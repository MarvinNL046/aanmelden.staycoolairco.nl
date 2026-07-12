/**
 * Stripe Checkout-endpoint voor het aanmeldformulier.
 *
 * POST { contractId } → { url } van een Stripe Checkout-sessie:
 * - basis/premium → subscription (maandelijks of jaarlijks met 5% korting)
 * - geen → eenmalige betaling (losse onderhoudsbeurt)
 *
 * Het contract wordt server-side uit Convex gelezen en de prijs wordt hier
 * opnieuw berekend (utils/pricing.ts) — client-bedragen worden nooit
 * vertrouwd. DORMANT zonder STRIPE_SECRET_KEY: GET meldt configured=false
 * en POST antwoordt 503, de rest van het formulier werkt gewoon door.
 */

import { ConvexHttpClient } from 'convex/browser'
import { NextResponse } from 'next/server'
import { api } from '@/convex/_generated/api'
import {
  createCheckoutSession,
  planForContract,
} from '@/lib/stripe-checkout'

// Vercel-env kan een verdwaalde "\n" in de waarde hebben — altijd opschonen.
function convexUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL
  if (raw === undefined) return null
  const cleaned = raw.replace(/\\n/g, '').trim()
  return cleaned.length > 0 ? cleaned : null
}

function siteUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured !== undefined && configured.length > 0) {
    return configured.replace(/\/$/, '')
  }
  return new URL(request.url).origin
}

export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY
  return NextResponse.json({
    configured: key !== undefined && key.length > 0,
  })
}

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (secretKey === undefined || secretKey.length === 0) {
    return NextResponse.json(
      { error: 'STRIPE_NOT_CONFIGURED' },
      { status: 503 },
    )
  }
  const url = convexUrl()
  if (url === null) {
    return NextResponse.json({ error: 'CONVEX_NOT_CONFIGURED' }, { status: 503 })
  }

  let contractId: string
  try {
    const body = (await request.json()) as { contractId?: unknown }
    if (typeof body.contractId !== 'string' || body.contractId.length < 8) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }
    contractId = body.contractId
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
  }

  const convex = new ConvexHttpClient(url)
  const contract = await convex.query(api.contracts.getByContractId, {
    contractId,
  })
  if (contract === null) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const plan = planForContract({
    contractType: contract.contractType,
    outdoorUnits: contract.numberOfOutdoorUnits,
    indoorUnits: contract.numberOfIndoorUnits,
    paymentFrequency: contract.paymentFrequency,
  })
  if (plan === null) {
    return NextResponse.json({ error: 'NOTHING_TO_CHARGE' }, { status: 400 })
  }

  const base = siteUrl(request)
  const result = await createCheckoutSession(
    secretKey,
    {
      plan,
      customerEmail: contract.email,
      contractId,
      successUrl: `${base}/bedankt?status=geslaagd&contract=${encodeURIComponent(contractId)}`,
      cancelUrl: `${base}/bedankt?status=geannuleerd&contract=${encodeURIComponent(contractId)}`,
    },
    // Idempotent per (contract, bedrag): een retry maakt nooit een duplicaat.
    `contract-${contractId}-${plan.mode}-${plan.amountCents}`,
  )
  if (!result.ok) {
    console.error(
      `Stripe checkout for contract ${contractId} failed (${result.status}): ${result.message}`,
    )
    return NextResponse.json({ error: 'STRIPE_API_ERROR' }, { status: 502 })
  }
  return NextResponse.json({ url: result.data.url })
}
