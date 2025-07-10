-- Final verification
-- 1. Check if all required columns exist
SELECT 
    column_name, 
    data_type
FROM 
    information_schema.columns
WHERE 
    table_name = 'contracts' 
    AND column_name IN ('customer_number', 'last_quote_number', 'last_invoice_number', 'contract_id', 'pdf_url', 'pdf_generated_at')
ORDER BY 
    column_name;

-- 2. Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'contracts';

-- 3. Check storage policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY cmd;

-- Expected results:
-- 1. Should show 6 columns (all the new fields)
-- 2. Should show 1 bucket named 'contracts'
-- 3. Should show 2 policies: Allow uploads (INSERT) and Allow reads (SELECT)