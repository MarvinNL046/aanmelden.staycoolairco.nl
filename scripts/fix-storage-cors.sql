-- Fix storage policies for proper CORS access
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow reads" ON storage.objects;

-- Create new policies with proper permissions
-- Allow anonymous uploads (for the form that doesn't require auth)
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'contracts');

-- Allow anyone to read PDFs - this is crucial for signed URLs to work
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'contracts');

-- Verify the policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname IN ('Allow public uploads', 'Allow public reads');