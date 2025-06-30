# StayCool Airco - Digitaal Aanmeldformulier

Een moderne webapplicatie voor het digitaal aanmelden van onderhoudscontracten voor airconditioningsystemen.

## Features

- 🎯 Multi-step formulier voor contractaanmelding
- 💳 SEPA machtiging met IBAN validatie
- 📱 Volledig responsive design
- 📄 Automatische PDF generatie
- ✉️ Email bevestigingen
- 💾 Formulier opslag in localStorage
- 🔒 Spam bescherming met reCAPTCHA support
- 🚀 Supabase database integratie

## Technologie Stack

- **Framework**: Next.js 15 met App Router
- **Taal**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Email**: EmailJS
- **PDF**: jsPDF

## Installatie

```bash
# Clone de repository
git clone https://github.com/MarvinNL046/aanmelden.staycoolairco.nl.git

# Installeer dependencies
npm install

# Maak een .env.local bestand met:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Start development server
npm run dev
```

## Contract Prijzen

- **Geen contract**: €179,- eenmalig
- **Basis pakket**: €11,- per maand per complete unit
- **Premium pakket**: €16,- per maand per complete unit (inclusief vervangende unit bij defect)

### Multi-split systemen
- Extra binnendelen: €7,- per maand per extra binnendeel

### Betalingsopties
- Maandelijks via automatische incasso
- Jaarlijks met 5% korting

## Database Setup

Voer de SQL migration uit in Supabase:
```sql
-- Zie /supabase/migrations/001_create_contracts_table.sql
```

## Deployment

Build voor productie:
```bash
npm run build
```

Deploy naar Netlify of Vercel met de juiste environment variables.

## Licentie

© 2025 StayCool Airco B.V.