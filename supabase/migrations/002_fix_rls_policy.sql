-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public to insert contracts" ON contracts;
DROP POLICY IF EXISTS "Allow users to view own contracts" ON contracts;

-- Create a more permissive policy for public inserts
CREATE POLICY "Enable insert for all users" ON contracts
FOR INSERT 
TO public
WITH CHECK (true);

-- Create a policy to allow reading contracts (optional, for admin panel later)
CREATE POLICY "Enable read access for all users" ON contracts
FOR SELECT
TO public
USING (true);

-- Alternative: If you want to disable RLS completely for now
-- ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;