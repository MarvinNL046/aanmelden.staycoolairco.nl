/**
 * Stripe-webhookverwerking voor het aanmeldformulier. Signature-verificatie
 * met Web Crypto (geen SDK) — zelfde geauditeerde aanpak als de
 * cashflow-integratie. De httpAction zelf staat in convex/http.ts.
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// ─── Signature-verificatie (HMAC-SHA256, constant-time compare) ─────────────

export function parseStripeSignatureHeader(
  header: string,
): { timestamp: number; v1: string[] } | null {
  const parts = header.split(",");
  let timestamp: number | null = null;
  const v1: string[] = [];
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const prefix = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (prefix === "t") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) timestamp = parsed;
    } else if (prefix === "v1") {
      v1.push(value);
    }
  }
  if (timestamp === null || v1.length === 0) return null;
  return { timestamp, v1 };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function computeExpectedSignature(
  secret: string,
  timestamp: number,
  rawBody: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${rawBody}`),
  );
  return toHex(signature);
}

export async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  nowMs: number = Date.now(),
  toleranceSeconds = 300,
): Promise<boolean> {
  if (signatureHeader === null || signatureHeader.length === 0) return false;
  const parsed = parseStripeSignatureHeader(signatureHeader);
  if (parsed === null) return false;
  const skewSeconds = Math.abs(Math.floor(nowMs / 1000) - parsed.timestamp);
  if (skewSeconds > toleranceSeconds) return false;
  const expected = await computeExpectedSignature(
    secret,
    parsed.timestamp,
    rawBody,
  );
  return parsed.v1.some((candidate) => timingSafeEqualHex(candidate, expected));
}

// ─── Event-parsing ───────────────────────────────────────────────────────────

export type ParsedEvent = {
  type: string;
  contractId: string | undefined;
  sessionId: string | undefined;
  subscriptionId: string | undefined;
  paymentStatus: string | undefined;
  mode: string | undefined;
};

export function parseStripeEvent(rawBody: string): ParsedEvent | null {
  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return null;
  }
  if (typeof event !== "object" || event === null) return null;
  const e = event as {
    type?: unknown;
    data?: { object?: Record<string, unknown> };
  };
  if (typeof e.type !== "string") return null;
  const object = e.data?.object ?? {};
  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  return {
    type: e.type,
    contractId:
      typeof metadata.contractId === "string" ? metadata.contractId : undefined,
    sessionId: typeof object.id === "string" ? object.id : undefined,
    subscriptionId:
      typeof object.subscription === "string" ? object.subscription : undefined,
    paymentStatus:
      typeof object.payment_status === "string"
        ? object.payment_status
        : undefined,
    mode: typeof object.mode === "string" ? object.mode : undefined,
  };
}

// ─── Contract bijwerken ──────────────────────────────────────────────────────

/**
 * Markeer een contract als online betaald/actief. Idempotent: een
 * webhook-retry op een al-gemarkeerd contract is een no-op.
 */
export const markStripe = internalMutation({
  args: {
    contractId: v.string(),
    status: v.union(v.literal("betaald"), v.literal("actief")),
    sessionId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<"updated" | "unchanged" | "not_found"> => {
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
      .first();
    if (contract === null) return "not_found";
    if (contract.stripeStatus !== undefined) return "unchanged";
    await ctx.db.patch(contract._id, {
      stripeStatus: args.status,
      stripeCheckoutSessionId: args.sessionId,
      stripeSubscriptionId: args.subscriptionId,
      stripePaidAt: new Date().toISOString(),
    });
    return "updated";
  },
});
