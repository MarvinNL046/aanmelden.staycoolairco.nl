# E-mailcampagne onderhoudsabonnement (5-staps drip)

Vijf kant-en-klare HTML-mails, opbouwend van informatief naar sales.
Elke mail heeft een Higgsfield-beeld (gpt_image_2, gehost op
`aanmelden.staycoolairco.nl/campagne/mail-N.jpg`) en een CTA-knop naar de
lage-frictie aanmeldpagina `https://aanmelden.staycoolairco.nl/direct`
(met UTM-tags per mail, zodat je in Stripe/GA kunt zien welke mail
converteert).

## Inplannen (aanbevolen ritme)

| # | Dag | Onderwerp | Toon |
|---|-----|-----------|------|
| 1 | 0   | Zo blijft uw airco fris en zuinig | informatief |
| 2 | 4   | Dit kunt u zelf doen (en dit beter niet) | praktisch |
| 3 | 9   | De duurste airco is er één zonder onderhoud | probleem |
| 4 | 14  | Zo werkt ons onderhoudsabonnement | aanbod |
| 5 | 21  | Regel het vandaag — in één minuut geregeld | sales |

## Gebruik

- Plak de HTML per mail in je verzendtool (Resend broadcast, Mailchimp,
  GHL, …) en zet het onderwerp uit de tabel erbij.
- Vervang `{{afmeldlink}}` in de footer door de afmeld-variabele van je
  tool (verplicht voor commerciële mail). Elke tool heeft daar een eigen
  merge-tag voor.
- Doelgroep: klanten ZONDER actief onderhoudsabonnement. De abonneelijst
  staat in cashflow (/abonnees); stuur deze reeks niet naar bestaande
  abonnees.
- De beelden worden geladen vanaf dit domein — verwijder de map
  `public/campagne/` dus niet zolang de campagne loopt.
