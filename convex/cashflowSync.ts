import { v } from "convex/values";
import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  calculateMonthlyPrice,
  calculateYearlyPrice,
} from "../utils/pricing";

/**
 * Doorstroom naar cashflow (wetry-suite): elke abonnements-aanmelding
 * (basis/premium) komt daar automatisch binnen als abonnee-in-wacht voor
 * de ING-incasso-administratie. Betaalt de klant alsnog via Stripe, dan
 * voert de webhook de wachtende regel automatisch weer af.
 *
 * Server-to-server, x-api-key = CASHFLOW_INTAKE_API_KEY (op beide
 * deployments); endpoint = CASHFLOW_INTAKE_URL. Best-effort: een storing
 * hier mag de aanmelding zelf nooit raken.
 */

export const getContractInternal = internalQuery({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contracts")
      .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
      .first();
  },
});

async function postToCashflow(body: Record<string, unknown>): Promise<void> {
  const url = process.env.CASHFLOW_INTAKE_URL;
  const key = process.env.CASHFLOW_INTAKE_API_KEY;
  if (!url || !key) {
    console.warn("cashflowSync: CASHFLOW_INTAKE_URL/API_KEY ontbreekt");
    return;
  }
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`cashflowSync: ${response.status}: ${text}`);
  } else {
    console.log(`cashflowSync: ${body.action ?? "create"} → ${text}`);
  }
}

/** Nieuwe aanmelding → abonnee-in-wacht in cashflow. */
export const pushSignup = internalAction({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    const contract = await ctx.runQuery(
      internal.cashflowSync.getContractInternal,
      { contractId: args.contractId },
    );
    if (contract === null) return;
    // "geen" = eenmalige onderhoudsbeurt, geen abonnement → niets doorzetten.
    if (contract.contractType === "geen") return;
    if (!contract.iban) {
      console.warn(`cashflowSync: contract ${args.contractId} zonder IBAN`);
      return;
    }
    const monthly = calculateMonthlyPrice(
      contract.contractType,
      contract.numberOfOutdoorUnits,
      contract.numberOfIndoorUnits,
    );
    const isYearly = contract.paymentFrequency === "jaarlijks";
    const amountEuros = isYearly
      ? calculateYearlyPrice(monthly, true)
      : monthly;
    const now = new Date();
    await postToCashflow({
      action: "create",
      sourceContractId: contract.contractId,
      name:
        (contract.accountHolder && contract.accountHolder.trim()) ||
        `${contract.firstName} ${contract.lastName}`.trim(),
      iban: contract.iban,
      amountCents: Math.round(amountEuros * 100),
      frequency: isYearly ? "yearly" : "monthly",
      yearlyMonth: isYearly ? now.getMonth() + 1 : undefined,
      mandateDate: contract.mandateDate
        ? contract.mandateDate.slice(0, 10)
        : now.toISOString().slice(0, 10),
    });
  },
});

/** Stripe-betaling gelukt → wachtende ING-regel in cashflow afvoeren. */
export const cancelSignup = internalAction({
  args: { contractId: v.string() },
  handler: async (_ctx, args) => {
    await postToCashflow({
      action: "cancel",
      sourceContractId: args.contractId,
    });
  },
});

