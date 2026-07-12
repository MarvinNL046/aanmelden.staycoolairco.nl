import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { parseStripeEvent, verifyStripeSignature } from "./stripeWebhook";

const http = httpRouter();

/**
 * Stripe-webhook: markeert een contract als online betaald (eenmalig) of
 * actief (abonnement gestart) zodra Stripe de settlement bevestigt.
 * DORMANT zonder STRIPE_WEBHOOK_SECRET (503). Raw body + Stripe-Signature
 * worden geverifieerd vóór er iets gebeurt; verwerkte/onbekende events
 * krijgen altijd snel een 200 zodat Stripe niet blijft retryen.
 */
http.route({
  path: "/api/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret === undefined || secret.length === 0) {
      return new Response("Stripe webhook not configured", { status: 503 });
    }
    const rawBody = await request.text();
    const ok = await verifyStripeSignature(
      rawBody,
      request.headers.get("Stripe-Signature"),
      secret,
    );
    if (!ok) {
      return new Response("Invalid signature", { status: 400 });
    }
    const event = parseStripeEvent(rawBody);
    if (event === null || event.contractId === undefined) {
      return new Response("ignored", { status: 200 });
    }
    // Alleen op échte settlement markeren: een async betaalmethode kan de
    // sessie voltooien terwijl het geld nog niet binnen is (payment_status
    // "unpaid") — dan wachten we op async_payment_succeeded.
    const settled =
      (event.type === "checkout.session.completed" &&
        event.paymentStatus === "paid") ||
      event.type === "checkout.session.async_payment_succeeded";
    if (settled) {
      const status = event.mode === "subscription" ? "actief" : "betaald";
      const outcome = await ctx.runMutation(internal.stripeWebhook.markStripe, {
        contractId: event.contractId,
        status,
        sessionId: event.sessionId,
        subscriptionId: event.subscriptionId,
      });
      // Stripe incasseert zelf → de wachtende ING-regel in cashflow is
      // overbodig; best-effort afvoeren (idempotent aan de cashflow-kant).
      await ctx.scheduler.runAfter(0, internal.cashflowSync.cancelSignup, {
        contractId: event.contractId,
      });
      console.log(
        `stripe webhook: contract ${event.contractId} → ${status} (${outcome})`,
      );
    }
    return new Response("ok", { status: 200 });
  }),
});

export default http;
