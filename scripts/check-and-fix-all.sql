-- 1. First check if storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'contracts';

-- 2. Check all columns in contracts table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'contracts'
ORDER BY 
    ordinal_position;

-- 3. If any columns are missing, add them
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS customer_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_quote_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS contract_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- 4. Clean up duplicate policies
DROP POLICY IF EXISTS "Allow public to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Enable insert for all users" ON contracts;
DROP POLICY IF EXISTS "Allow inserts" ON contracts;

-- Keep only one insert policy
CREATE POLICY "Allow inserts" ON contracts
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 5. Make sure update policy allows updating pdf_url
DROP POLICY IF EXISTS "Allow updating pdf_url" ON contracts;
DROP POLICY IF EXISTS "Allow updates" ON contracts;

CREATE POLICY "Allow updates" ON contracts
FOR UPDATE TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Verify final policies
SELECT * FROM pg_policies WHERE tablename = 'contracts';

-- 7. Test insert with all fields (uncomment to test)
-- This should work without errors
/*
INSERT INTO contracts (
    first_name, last_name, email, phone, address, postal_code, city,
    number_of_aircos, number_of_outdoor_units, number_of_indoor_units,
    contract_type, payment_frequency, customer_number, contract_id
) VALUES (
    'Test', 'User', 'test@example.com', '0612345678', 'Teststraat 1',
    '1234AB', 'Amsterdam', 1, 1, 1, 'basis', 'maandelijks', 'CUST123', 'OC-TEST-123'
);
*/

-- 8. Clean up test data (uncomment if you ran the test insert)
-- DELETE FROM contracts WHERE contract_id = 'OC-TEST-123';

-- 9. Final check - This should show your cleaned up policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'contracts'
ORDER BY cmd;