-- Check if all required columns exist in contracts table
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

-- If columns are missing, run this:
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_quote_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS contract_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- Verify RLS policies for contracts table
SELECT * FROM pg_policies WHERE tablename = 'contracts';

-- Make sure we can update pdf_url after insert
DROP POLICY IF EXISTS "Allow updating pdf_url" ON contracts;
CREATE POLICY "Allow updating pdf_url" ON contracts
FOR UPDATE
USING (true)
WITH CHECK (true);