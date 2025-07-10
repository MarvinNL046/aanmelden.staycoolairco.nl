-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;

-- Create new policies with correct permissions
-- Allow both authenticated and anonymous users to upload (for your form)
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'contracts');

-- Allow anyone to read PDFs with the direct link
CREATE POLICY "Allow reads" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'contracts');

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname IN ('Allow uploads', 'Allow reads');