/**
 * Directe Stripe Checkout vanaf de /direct-keuzepagina (de lage-frictie
 * funnel uit de e-mail-CTA's van cashflow).
 *
 * POST { contractType, outdoorUnits, indoorUnits, paymentFrequency }
 * → { url } van een Stripe Checkout-sessie.
 *
 * Anders dan /api/stripe/checkout bestaat er hier nog GEEN contract: er
 * wordt bewust niets opgeslagen vóór de betaling (een afgebroken checkout
 * laat geen lege records achter). Het contract wordt pas door de webhook
 * aangemaakt, uit de metadata (de keuzes) + de klantgegevens die Stripe
 * op de betaalpagina uitvraagt. De prijs wordt hier server-side berekend
 * (utils/pricing.ts) — bedragen uit de browser worden nooit vertrouwd.
 */

import { NextResponse } from 'next/server'
import {
  buildDirectCheckoutSessionBody,
  planForContract,
  postCheckoutSession,
} from '@/lib/stripe-checkout'
import type { ContractType } from '@/types/contract'

function siteUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured !== undefined && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }
  return new URL(request.url).origin
}

const CONTRACT_TYPES: ReadonlyArray<ContractType> = ['geen', 'basis', 'premium']

function intInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null
  if (value < min || value > max) return null
  return value
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (secretKey === undefined || secretKey.length === 0) {
    return NextResponse.json({ error: 'STRIPE_NOT_CONFIGURED' }, { status: 503 })
  }

  let body: {
    contractType?: unknown
    outdoorUnits?: unknown
    indoorUnits?: unknown
    paymentFrequency?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const contractType = CONTRACT_TYPES.find((t) => t === body.contractType)
  const outdoorUnits = intInRange(body.outdoorUnits, 1, 8)
  const indoorUnits = intInRange(body.indoorUnits, 1, 12)
  const paymentFrequency =
    body.paymentFrequency === 'jaarlijks' ? 'jaarlijks' : 'maandelijks'
  if (contractType === undefined || outdoorUnits === null || indoorUnits === null) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const plan = planForContract({
    contractType,
    outdoorUnits,
    indoorUnits,
    paymentFrequency,
  })
  if (plan === null) {
    return NextResponse.json({ error: 'NOTHING_TO_CHARGE' }, { status: 400 })
  }

  // Zelfde OC-vorm als het formulier; de webhook maakt het record aan.
  const contractId = `OC-${crypto.randomUUID()}`
  const base = siteUrl(request)
  const result = await postCheckoutSession(
    secretKey,
    buildDirectCheckoutSessionBody({
      plan,
      contractId,
      choices: { contractType, outdoorUnits, indoorUnits, paymentFrequency },
      successUrl: `${base}/bedankt?status=geslaagd&flow=direct&contract=${encodeURIComponent(contractId)}`,
      cancelUrl: `${base}/bedankt?status=geannuleerd&flow=direct`,
    }),
    `direct-${contractId}`,
  )
  if (!result.ok) {
    console.error(
      `Stripe direct checkout failed (${result.status}): ${result.message}`,
    )
    return NextResponse.json({ error: 'STRIPE_API_ERROR' }, { status: 502 })
  }
  return NextResponse.json({ url: result.data.url })
}
