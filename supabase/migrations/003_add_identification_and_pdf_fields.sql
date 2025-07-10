-- Add customer identification fields and PDF storage
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_quote_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS contract_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index on contract_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_contracts_contract_id ON contracts(contract_id);

-- Create index on customer_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_contracts_customer_number ON contracts(customer_number);

-- Add comment to explain the fields
COMMENT ON COLUMN contracts.customer_number IS 'Customer number from existing customer database';
COMMENT ON COLUMN contracts.last_quote_number IS 'Last quote number for this customer';
COMMENT ON COLUMN contracts.last_invoice_number IS 'Last invoice number for this customer';
COMMENT ON COLUMN contracts.contract_id IS 'Unique contract identifier (e.g., OC-123456789)';
COMMENT ON COLUMN contracts.pdf_url IS 'URL to the generated contract PDF in Supabase Storage';
COMMENT ON COLUMN contracts.pdf_generated_at IS 'Timestamp when the PDF was generated';