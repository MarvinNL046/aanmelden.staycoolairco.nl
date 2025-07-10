-- Secure Storage Policies for Contracts
-- This ensures only authorized access to PDFs

-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;

-- Create secure policies for the contracts bucket

-- 1. Only service role can upload (backend only)
CREATE POLICY "Service role upload" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'contracts' 
  AND auth.role() = 'service_role'
);

-- 2. Only service role can read (for generating signed URLs)
CREATE POLICY "Service role read" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'service_role'
);

-- 3. Service role full access for management
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL 
USING (
  bucket_id = 'contracts' 
  AND auth.role() = 'service_role'
);

-- 4. Make bucket private (not public!)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'contracts';

-- Verify the bucket is now private
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'contracts';