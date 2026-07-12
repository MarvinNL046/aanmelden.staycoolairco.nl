/**
 * Stripe Checkout voor onderhoudsabonnementen — server-side helper voor de
 * Next.js API-route. Bewust dependency-vrij (geen stripe-SDK): plain fetch
 * met form-encoding, zelfde patroon als de cashflow-integratie.
 *
 * Prijzen worden ALTIJD server-side herberekend uit het opgeslagen contract
 * (utils/pricing.ts) — bedragen uit de browser worden nooit vertrouwd.
 * Geld gaat als integer centen naar Stripe.
 */

import {
  calculateMonthlyPrice,
  calculateOneTimePrice,
  calculateYearlyPrice,
} from '@/utils/pricing'
import type { ContractType } from '@/types/contract'

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

/** Euro's (evt. met centen als float, bijv. 24.3) → integer centen. */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100)
}

/** Geneste objecten → Stripe's bracketed form-encoding. */
export function encodeStripeForm(data: Record<string, unknown>): string {
  const params = new URLSearchParams()
  const walk = (prefix: string, value: unknown): void => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(`${prefix}[${index}]`, item))
    } else if (typeof value === 'object') {
      for (const [key, inner] of Object.entries(value as object)) {
        walk(`${prefix}[${key}]`, inner)
      }
    } else {
      params.append(prefix, String(value))
    }
  }
  for (const [key, value] of Object.entries(data)) {
    walk(key, value)
  }
  return params.toString()
}

export type ContractPricingInput = {
  contractType: ContractType
  outdoorUnits: number
  indoorUnits: number
  /** 'maandelijks' | 'jaarlijks' (jaarlijks = 5% korting, bestaande regel). */
  paymentFrequency: string | undefined
}

export type CheckoutPlan =
  | {
      mode: 'subscription'
      interval: 'month' | 'year'
      amountCents: number
      description: string
    }
  | { mode: 'payment'; amountCents: number; description: string }

/**
 * Vertaal een opgeslagen contract naar het Stripe-plan. Alle bestaande
 * prijsregels (kwantumkorting 10% vanaf 3 gewogen punten, extra
 * binnendelen, 5% jaarkorting) zitten al in utils/pricing.ts.
 */
export function planForContract(input: ContractPricingInput): CheckoutPlan | null {
  const units = `${input.outdoorUnits} buitendeel/${input.indoorUnits} binnendeel`
  if (input.contractType === 'geen') {
    const euros = calculateOneTimePrice(input.outdoorUnits, input.indoorUnits)
    if (euros <= 0) return null
    return {
      mode: 'payment',
      amountCents: eurosToCents(euros),
      description: `Eenmalige onderhoudsbeurt (${units})`,
    }
  }
  const monthly = calculateMonthlyPrice(
    input.contractType,
    input.outdoorUnits,
    input.indoorUnits,
  )
  if (monthly <= 0) return null
  const label = input.contractType === 'premium' ? 'Premium' : 'Basis'
  if (input.paymentFrequency === 'jaarlijks') {
    return {
      mode: 'subscription',
      interval: 'year',
      amountCents: eurosToCents(calculateYearlyPrice(monthly, true)),
      description: `Onderhoudsabonnement ${label} — jaarlijks (${units}, incl. 5% jaarkorting)`,
    }
  }
  return {
    mode: 'subscription',
    interval: 'month',
    amountCents: eurosToCents(monthly),
    description: `Onderhoudsabonnement ${label} — maandelijks (${units})`,
  }
}

export type CheckoutSessionInput = {
  plan: CheckoutPlan
  customerEmail: string
  contractId: string
  successUrl: string
  cancelUrl: string
}

/** Form-body voor POST /v1/checkout/sessions (payment óf subscription). */
export function buildCheckoutSessionBody(input: CheckoutSessionInput): string {
  const base: Record<string, unknown> = {
    mode: input.plan.mode,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.customerEmail,
    // Echoed back op webhook-events: zo vindt de webhook het contract terug.
    metadata: { contractId: input.contractId },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: input.plan.amountCents,
          product_data: { name: input.plan.description },
          ...(input.plan.mode === 'subscription'
            ? { recurring: { interval: input.plan.interval } }
            : {}),
        },
      },
    ],
  }
  if (input.plan.mode === 'subscription') {
    // Metadata ook op de Subscription zelf, zodat latere invoice/subscription-
    // events het contract kunnen terugvinden.
    base.subscription_data = { metadata: { contractId: input.contractId } }
  } else {
    base.payment_intent_data = { metadata: { contractId: input.contractId } }
  }
  return encodeStripeForm(base)
}

export type StripeResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

export async function createCheckoutSession(
  secretKey: string,
  input: CheckoutSessionInput,
  idempotencyKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StripeResult<{ id: string; url: string }>> {
  const response = await fetchImpl(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey,
    },
    body: buildCheckoutSessionBody(input),
  })
  if (!response.ok) {
    const text = await response.text()
    return { ok: false, status: response.status, message: text }
  }
  const json = (await response.json()) as { id?: string; url?: string }
  if (typeof json.id !== 'string' || typeof json.url !== 'string') {
    return { ok: false, status: response.status, message: 'Malformed session' }
  }
  return { ok: true, data: { id: json.id, url: json.url } }
}
