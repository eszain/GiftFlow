-- Create listings table for storing charity wishes/needs
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount_requested DECIMAL(10,2) NOT NULL,
  amount_raised DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  charity_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  charity_name VARCHAR(255) NOT NULL,
  charity_email VARCHAR(255) NOT NULL,
  images TEXT[], -- Array of image URLs
  documents TEXT[], -- Array of document URLs for tax verification
  tax_deductible BOOLEAN DEFAULT false,
  verification_status VARCHAR(50) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_charity_id ON listings(charity_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_verification_status ON listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- Enable Row Level Security
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Create policies for listings
-- Charities can view and manage their own listings
CREATE POLICY "Charities can view own listings" ON listings
  FOR SELECT USING (auth.uid() = charity_id);

CREATE POLICY "Charities can insert own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = charity_id);

CREATE POLICY "Charities can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = charity_id);

CREATE POLICY "Charities can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = charity_id);

-- Patrons can view all active listings
CREATE POLICY "Patrons can view active listings" ON listings
  FOR SELECT USING (
    status = 'active' AND 
    verification_status = 'verified' AND
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'patron'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at 
  BEFORE UPDATE ON listings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
