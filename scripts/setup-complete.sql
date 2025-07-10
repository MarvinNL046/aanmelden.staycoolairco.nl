-- Complete setup script voor PDF opslag
-- Run dit in je Supabase SQL Editor

-- 1. Voeg de nieuwe velden toe aan de contracts tabel
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_quote_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS contract_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- 2. Maak indexes voor betere performance
CREATE INDEX IF NOT EXISTS idx_contracts_contract_id ON contracts(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_number ON contracts(customer_number);

-- 3. Voeg comments toe voor documentatie
COMMENT ON COLUMN contracts.customer_number IS 'Customer number from existing customer database';
COMMENT ON COLUMN contracts.last_quote_number IS 'Last quote number for this customer';
COMMENT ON COLUMN contracts.last_invoice_number IS 'Last invoice number for this customer';
COMMENT ON COLUMN contracts.contract_id IS 'Unique contract identifier (e.g., OC-123456789)';
COMMENT ON COLUMN contracts.pdf_url IS 'URL to the generated contract PDF in Supabase Storage';
COMMENT ON COLUMN contracts.pdf_generated_at IS 'Timestamp when the PDF was generated';

-- 4. Storage bucket policies
-- Eerst moet je de 'contracts' bucket aanmaken in de Supabase Dashboard onder Storage

-- Allow authenticated users to upload PDFs
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts');

-- Allow anyone with the link to read PDFs  
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'contracts');

-- 5. Update de RLS policy voor de contracts tabel om pdf_url te kunnen updaten
DROP POLICY IF EXISTS "Allow public to insert contracts" ON contracts;

CREATE POLICY "Allow public to insert contracts" ON contracts
FOR INSERT
WITH CHECK (true);

-- Allow updating pdf_url after contract creation
CREATE POLICY "Allow updating pdf_url" ON contracts
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Verificatie query om te checken of alles goed is gegaan
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'contracts' 
    AND column_name IN ('customer_number', 'last_quote_number', 'last_invoice_number', 'contract_id', 'pdf_url', 'pdf_generated_at')
ORDER BY 
    ordinal_position;