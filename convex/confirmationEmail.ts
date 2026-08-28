import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { internalQuery } from "./_generated/server";
import {
  calculateMonthlyPrice,
  calculateOneTimePrice,
} from "../utils/pricing";

/**
 * Server-side bevestigingsmail via Resend — vervangt de EmailJS-mail die
 * vanuit de browser werd verstuurd en daar STIL kon falen. Hier wordt
 * elke fout in de Convex-logs gelogd en krijgt de client een eerlijke
 * {sent:false} terug. Vereist RESEND_API_KEY (+ optioneel EMAIL_FROM) op
 * de deployment; zonder key is dit een nette no-op.
 *
 * De HTML is 1-op-1 de bestaande template (email-template-with-pdf.html),
 * server-side ingevuld met ge-escapete waarden uit het OPGESLAGEN
 * contract — de browser levert alleen nog het contractId.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CONTRACT_TYPE_NAMES: Record<string, string> = {
  geen: "Geen contract (eenmalig)",
  basis: "Basis pakket",
  premium: "Premium pakket",
};

export const getForEmail = internalQuery({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
      .first();
    if (contract === null) return null;
    const pdfUrl = contract.pdfStorageId
      ? await ctx.storage.getUrl(contract.pdfStorageId)
      : null;
    return { contract, pdfUrl };
  },
});

/**
 * Interne notificatie naar kantoor bij elke nieuwe aanmelding — zodat
 * niemand het Stripe-dashboard of cashflow hoeft te bewaken om te weten
 * dat er iets binnenkwam. Best-effort (fouten alleen in de logs).
 */
export const sendInternalNotice = internalAction({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey === undefined || apiKey.length === 0) return;
    const result = await ctx.runQuery(internal.confirmationEmail.getForEmail, {
      contractId: args.contractId,
    });
    if (result === null) return;
    const { contract } = result;
    const typeLabel = CONTRACT_TYPE_NAMES[contract.contractType] ?? contract.contractType;
    const monthly = calculateMonthlyPrice(
      contract.contractType,
      contract.numberOfOutdoorUnits,
      contract.numberOfIndoorUnits,
    );
    const isSubscription = contract.contractType !== "geen";
    const priceLine = !isSubscription
      ? `€${calculateOneTimePrice(contract.numberOfOutdoorUnits, contract.numberOfIndoorUnits)},- eenmalig`
      : contract.paymentFrequency === "jaarlijks"
        ? `€${Math.round(monthly * 12 * 0.95)},- per jaar`
        : `€${monthly},- per maand`;
    const row = (label: string, value: string) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#666">${label}</td><td style="padding:4px 0"><strong>${escapeHtml(value)}</strong></td></tr>`;
    const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#333;max-width:520px">
<h2 style="color:#173a40">Nieuwe aanmelding onderhoudscontract</h2>
<table style="border-collapse:collapse">
${row("Contractnummer", contract.contractId)}
${row("Type", typeLabel)}
${row("Bedrag", priceLine)}
${row("Naam", `${contract.firstName} ${contract.lastName}`.trim())}
${row("E-mail", contract.email)}
${row("Telefoon", contract.phone)}
${row("Adres", `${contract.address}, ${contract.postalCode} ${contract.city}`)}
${row("Units", `${contract.numberOfOutdoorUnits} buiten / ${contract.numberOfIndoorUnits} binnen`)}
${isSubscription ? row("IBAN", contract.iban ?? "-") : ""}
</table>
${
  contract.stripeStatus !== undefined
    ? `<p style="margin-top:16px;font-size:13px;color:#555">Direct via Stripe ${contract.stripeStatus === "actief" ? "gestart (abonnement)" : "betaald"} — Stripe incasseert zelf. ${isSubscription ? "De abonnee staat als <strong>Via Stripe</strong> in cashflow (Abonnees-pagina); koppel daar nog even het klantrecord." : "Plan de onderhoudsbeurt in — er hoeft niets meer gefactureerd te worden."}</p>`
    : isSubscription
      ? `<p style="margin-top:16px;font-size:13px;color:#555">Deze aanmelding staat automatisch als <strong>abonnee-in-wacht</strong> in cashflow (Abonnees-pagina). Betaalt de klant online via Stripe, dan verdwijnt die regel vanzelf; anders daar even bevestigen zodat hij in de ING-batch meedraait.</p>`
      : `<p style="margin-top:16px;font-size:13px;color:#555">Losse onderhoudsbeurt — plan een afspraak in en factureer na afloop.</p>`
}
</div>`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.EMAIL_FROM ?? "StayCool Airco <info@staycoolairco.nl>",
        to: [process.env.INTERNAL_NOTICE_EMAIL ?? "info@staycoolairco.nl"],
        subject: `Nieuwe aanmelding: ${typeLabel} — ${contract.firstName} ${contract.lastName} (${priceLine})`,
        html,
      }),
    });
    if (!response.ok) {
      console.error(
        `internal notice ${contract.contractId}: Resend ${response.status}: ${await response.text()}`,
      );
    }
  },
});

/** Gedeelde bezorging: gebruikt door de publieke action (formulier-flow,
 *  client roept hem na submit aan) én de internalAction (directe
 *  Stripe-funnel, aangeroepen vanuit de webhook). */
async function deliverConfirmation(
  ctx: { runQuery: any },
  contractId: string,
): Promise<{ sent: boolean }> {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey === undefined || apiKey.length === 0) {
      console.warn("confirmationEmail: RESEND_API_KEY ontbreekt");
      return { sent: false };
    }
    const result = await ctx.runQuery(internal.confirmationEmail.getForEmail, {
      contractId,
    });
    if (result === null) {
      console.error(`confirmationEmail: contract ${contractId} niet gevonden`);
      return { sent: false };
    }
    const { contract, pdfUrl } = result;

    const monthlyPrice = calculateMonthlyPrice(
      contract.contractType,
      contract.numberOfOutdoorUnits,
      contract.numberOfIndoorUnits,
    );
    const totalPrice =
      contract.contractType === "geen"
        ? calculateOneTimePrice(
            contract.numberOfOutdoorUnits,
            contract.numberOfIndoorUnits,
          )
        : contract.paymentFrequency === "jaarlijks"
          ? Math.round(monthlyPrice * 12 * 0.95)
          : monthlyPrice;
    const priceText =
      contract.contractType === "geen"
        ? `€${totalPrice},- per onderhoudsbeurt`
        : contract.paymentFrequency === "jaarlijks"
          ? `€${totalPrice},- per jaar`
          : `€${totalPrice},- per maand`;
    // Directe Stripe-funnel: er is al betaald en er is geen ING-machtiging —
    // andere vervolgtekst dan de formulier-flow (die op incasso wacht).
    const viaStripe = contract.stripeStatus !== undefined;
    const serviceText = viaStripe
      ? contract.contractType !== "geen"
        ? "U heeft online betaald via Stripe — uw abonnement is direct actief. Vervolgbetalingen gaan automatisch via dezelfde betaalmethode. Wij nemen contact met u op om de eerste onderhoudsbeurt in te plannen."
        : "U heeft de onderhoudsbeurt al online betaald. Wij nemen contact met u op om de beurt in te plannen."
      : contract.contractType !== "geen"
        ? `Uw contract gaat in binnen 5 werkdagen. De afschrijving zal plaatsvinden aan het einde van de maand tussen de 27ste en 28ste op de door u opgegeven rekening eindigend op ...${contract.iban?.slice(-4) ?? "****"}.`
        : "Wij nemen contact met u op voor het plannen van de onderhoudsbeurt. U betaalt na afloop van de onderhoudsbeurt.";

    const name = escapeHtml(
      `${contract.firstName} ${contract.lastName}`.trim(),
    );
    const row = (label: string, value: string, shaded: boolean) =>
      value.length === 0
        ? ""
        : `<tr${shaded ? ' style="background-color:#f9f9f9"' : ""}><td style="padding:8px 0;color:#666">${label}:</td><td style="padding:8px 0;text-align:right"><strong>${escapeHtml(value)}</strong></td></tr>`;

    const html = `<div style="font-family:system-ui,-apple-system,sans-serif,Arial;font-size:14px;color:#333;padding:14px 8px;background-color:#f5f5f5">
<div style="max-width:600px;margin:auto;background-color:#fff">
<div style="border-top:6px solid #0066cc;padding:16px"><span style="font-size:16px;vertical-align:middle"><strong>StayCool Airco - Bevestiging Onderhoudscontract</strong></span></div>
<div style="padding:0 16px">
<p>Beste ${name},</p>
<p>Bedankt voor het afsluiten van uw onderhoudscontract bij StayCool Airco. Hierbij bevestigen wij uw aanmelding.</p>
<div style="text-align:left;font-size:14px;padding-bottom:4px;border-bottom:2px solid #333;margin-top:24px"><strong>Contract Details</strong></div>
<table style="width:100%;border-collapse:collapse;margin-top:16px">
${row("Contractnummer", contract.contractId, false)}
${row("Type contract", CONTRACT_TYPE_NAMES[contract.contractType] ?? contract.contractType, true)}
${row("Aantal buitendelen", String(contract.numberOfOutdoorUnits), false)}
${row("Aantal binnendelen", String(contract.numberOfIndoorUnits), true)}
${row("Betalingsfrequentie", contract.contractType !== "geen" ? (contract.paymentFrequency ?? "") : "", false)}
</table>
<div style="margin:24px 0;padding:16px;background-color:#e8f4f8;border-radius:8px"><table style="width:100%;border-collapse:collapse"><tr><td style="font-size:16px"><strong>Totaal bedrag:</strong></td><td style="text-align:right;font-size:20px;color:#0066cc"><strong>${escapeHtml(priceText)}</strong></td></tr></table></div>
<div style="text-align:left;font-size:14px;padding-bottom:4px;border-bottom:2px solid #333;margin-top:24px"><strong>Uw Gegevens</strong></div>
<table style="width:100%;border-collapse:collapse;margin-top:16px">
${row("Naam", `${contract.firstName} ${contract.lastName}`.trim(), false)}
${row("Telefoon", contract.phone, true)}
${row("Email", contract.email, false)}
${row("Woonplaats", contract.city, true)}
${row("Klantnummer", contract.customerNumber ?? "", false)}
</table>
${
  contract.contractType !== "geen" && contract.iban
    ? `<div style="text-align:left;font-size:14px;padding-bottom:4px;border-bottom:2px solid #333;margin-top:24px"><strong>Betaalgegevens</strong></div>
<table style="width:100%;border-collapse:collapse;margin-top:16px">
${row("IBAN", contract.iban, false)}
${row("Tenaamstelling", contract.accountHolder ?? "", true)}
</table>`
    : ""
}
${
  pdfUrl !== null
    ? `<div style="margin:24px 0;padding:16px;background-color:#f0f9ff;border-radius:8px;border:1px solid #0066cc"><table style="width:100%;border-collapse:collapse"><tr><td style="vertical-align:middle"><strong style="color:#0066cc">Contract Document</strong></td><td style="text-align:right"><a href="${pdfUrl}" style="display:inline-block;padding:8px 16px;background-color:#0066cc;color:white;text-decoration:none;border-radius:4px;font-weight:bold">Download PDF</a></td></tr></table><p style="margin:8px 0 0 0;font-size:12px;color:#666">Bewaar dit contract goed. U kunt het altijd terugvinden via deze link.</p></div>`
    : ""
}
<div style="margin:24px 0;padding:16px;background-color:#fff8e1;border-radius:8px;font-size:13px"><strong>Wat gebeurt er nu?</strong><ul style="margin:8px 0;padding-left:20px"><li>Wij verwerken uw aanmelding binnen 2 werkdagen</li><li>Wij nemen contact met u op voor het plannen van de onderhoudsbeurt</li></ul></div>
<div style="margin:16px 0;padding:12px;background-color:#f5f5f5;border-radius:4px;font-size:13px">${escapeHtml(serviceText)}</div>
</div>
<div style="padding:24px 16px;background-color:#f5f5f5;margin-top:24px"><div style="text-align:center;margin-top:16px;font-size:12px;color:#666"><strong>StayCool Airco B.V.</strong><br/>Tel: 046 202 1430 | Email: info@staycoolairco.nl<br/>Website: <a href="https://staycoolairco.nl" style="color:#0066cc">staycoolairco.nl</a></div></div>
</div>
<div style="max-width:600px;margin:auto;padding:16px 0"><p style="color:#999;font-size:12px;text-align:center">Dit is een automatisch gegenereerd bericht verstuurd naar ${escapeHtml(contract.email)}<br/>U ontvangt deze email omdat u een onderhoudscontract heeft afgesloten.<br/>Voor vragen kunt u contact met ons opnemen via info@staycoolairco.nl</p></div>
</div>`;

    const fromAddress =
      process.env.EMAIL_FROM ?? "StayCool Airco <info@staycoolairco.nl>";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [contract.email],
        subject: `Bevestiging onderhoudscontract ${contract.contractId} — StayCool Airco`,
        html,
      }),
    });
    if (!response.ok) {
      console.error(
        `confirmationEmail ${contract.contractId}: Resend error ${response.status}: ${await response.text()}`,
      );
      return { sent: false };
    }
    return { sent: true };
}

export const send = action({
  args: { contractId: v.string() },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    return await deliverConfirmation(ctx, args.contractId);
  },
});

/** Webhook-variant (directe funnel): zelfde mail, maar aangeroepen door het
 *  systeem in plaats van de browser. */
export const sendInternal = internalAction({
  args: { contractId: v.string() },
  handler: async (ctx, args): Promise<{ sent: boolean }> => {
    return await deliverConfirmation(ctx, args.contractId);
  },
});
