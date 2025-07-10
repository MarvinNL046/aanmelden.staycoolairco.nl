-- Create a storage bucket for contract PDFs
-- Note: This SQL creates the bucket policy, but the actual bucket needs to be created 
-- through Supabase Dashboard or using the Supabase JS Admin client

-- Storage bucket name: 'contracts'
-- The bucket should be created with the following settings:
-- - Public: false (private bucket)
-- - File size limit: 10MB
-- - Allowed MIME types: application/pdf

-- Create RLS policies for the contracts bucket
-- These policies need to be applied after creating the bucket

-- Policy 1: Allow authenticated users to upload PDFs
-- Name: 'Allow authenticated uploads'
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK: true

-- Policy 2: Allow public to read PDFs with a valid contract_id
-- Name: 'Allow public to read contract PDFs'
-- Allowed operation: SELECT
-- Target roles: anon, authenticated
-- USING: true (anyone with the link can access)

-- Policy 3: Prevent deletion of PDFs
-- Name: 'Prevent PDF deletion'
-- Allowed operation: DELETE
-- Target roles: none
-- WITH CHECK: false

-- Example bucket path structure:
-- contracts/{contract_id}/contract.pdf
-- e.g., contracts/OC-1234567890/contract.pdf