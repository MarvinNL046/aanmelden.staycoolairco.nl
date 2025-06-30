-- Create contracts table
CREATE TABLE contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  city VARCHAR(100) NOT NULL,
  number_of_aircos INTEGER NOT NULL DEFAULT 1,
  number_of_outdoor_units INTEGER NOT NULL DEFAULT 1,
  number_of_indoor_units INTEGER NOT NULL DEFAULT 1,
  contract_type VARCHAR(20) NOT NULL CHECK (contract_type IN ('geen', 'basis', 'premium')),
  payment_frequency VARCHAR(20) CHECK (payment_frequency IN ('maandelijks', 'jaarlijks')),
  iban VARCHAR(34),
  account_holder VARCHAR(255),
  mandate_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_contracts_email ON contracts(email);

-- Create index on created_at for sorting
CREATE INDEX idx_contracts_created_at ON contracts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated users (or anonymous for public forms)
CREATE POLICY "Allow public to insert contracts" ON contracts
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow reading own contracts (based on email)
CREATE POLICY "Allow users to view own contracts" ON contracts
  FOR SELECT
  USING (auth.jwt() ->> 'email' = email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE
  ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();