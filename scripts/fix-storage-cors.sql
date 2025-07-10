-- Fix Storage Bucket Permissions for Contracts
-- This script ensures that the contracts bucket allows public read access

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

-- Create new policies for the contracts bucket
-- Allow anyone to read PDFs (public access)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'contracts');

-- Allow authenticated users to upload PDFs
CREATE POLICY "Allow authenticated insert" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- Allow service role full access (for backend operations)
CREATE POLICY "Allow service role full access" ON storage.objects
FOR ALL 
USING (bucket_id = 'contracts' AND auth.role() = 'service_role');

-- Update bucket configuration to ensure it's public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'contracts';

-- Verify the bucket settings
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'contracts';