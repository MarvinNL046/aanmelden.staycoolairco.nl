# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application for StayCool Airco's digital maintenance contract registration system. The app handles sensitive customer data including personal information, IBAN bank accounts, and digital signatures.

## Common Development Commands

```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production (run before pushing to check for errors)
npm run start        # Start production server
npm run lint         # Run ESLint (currently requires configuration)
```

## Architecture and Data Flow

### Multi-Step Form Flow
1. **ContractSelection** → User selects contract type (geen/basis/premium)
2. **CustomerForm** → Collects personal and business details
3. **SepaForm** → SEPA mandate for recurring payments (skipped for 'geen' contracts)
4. **Summary** → Review and submit with PDF generation

### Key Integration Points

#### Supabase Integration
- **Database**: PostgreSQL via Supabase client (`lib/supabase.ts`)
- **Storage**: PDF contracts stored in 'contracts' bucket with signed URLs
- **Security**: RLS policies restrict access to own contracts by email

#### PDF Generation Flow
1. `generateContractPDF()` creates PDF locally for immediate download
2. `generateContractPDFBuffer()` creates buffer for Supabase upload
3. PDFs stored as `{contractId}/contract.pdf` with 1-year expiry signed URLs

#### External Services
- **EmailJS**: Confirmation emails via template `template_lo61bri`
- **GoHighLevel**: Optional webhook integration for CRM
- **reCAPTCHA**: Optional spam protection (site key required)

## Critical Security Considerations

### Current Implementation
- **Contract IDs**: Using UUIDs (`OC-${crypto.randomUUID()}`) for unpredictability
- **PDF Access**: Signed URLs with 1-year expiry (not public access)
- **Storage Bucket**: Private with authentication requirements
- **Rate Limiting**: Client-side protection (5 attempts per 15 minutes)

### Sensitive Data Handled
- Full names, addresses, phone numbers
- IBAN bank account numbers
- Digital signatures
- Contract pricing and terms

## Pricing Logic

Located in `utils/pricing.ts`:
- **Complete Unit**: 1 outdoor + 1 indoor unit
- **Base Prices**: geen=€179, basis=€11/month, premium=€16/month
- **Extra Indoor Units**: €7/month (contracts) or €89.50 one-time
- **Annual Discount**: 5% for yearly payment

## Environment Configuration

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
NEXT_PUBLIC_GHL_WEBHOOK_URL=[optional]
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=[optional]
```

## Database Schema

The `contracts` table includes:
- Customer info: name, email, phone, address, postal_code, city
- Contract details: type, payment_frequency, units count
- SEPA data: iban, account_holder, mandate_date
- Customer IDs: customer_number, last_quote_number, last_invoice_number
- Metadata: pdf_url, contract_id, created_at, updated_at

## Testing Considerations

- **IBAN Validation**: Test with valid Dutch/Belgian IBANs
- **PDF Generation**: Verify all contract types generate correctly
- **Storage**: Ensure PDFs upload and signed URLs work
- **Email**: Check EmailJS template receives all parameters

## Deployment Notes

- Build locally with `npm run build` before pushing
- Ensure all environment variables are set in production
- Run storage bucket SQL scripts to set proper permissions
- Monitor Supabase usage for storage and database limits