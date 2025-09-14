-- Run this SQL in your Supabase SQL Editor to create the donations table

-- Create donations table for storing patron donations to listings
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patron_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    ein_number TEXT,
    amount_cents INTEGER NOT NULL, -- Amount in cents to avoid floating point issues
    currency TEXT NOT NULL DEFAULT 'USD',
    deductible BOOLEAN NOT NULL DEFAULT false,
    receipt_url TEXT,
    receipt_data JSONB, -- Store receipt metadata
    donation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_donations_patron_id ON donations(patron_id);
CREATE INDEX IF NOT EXISTS idx_donations_listing_id ON donations(listing_id);
CREATE INDEX IF NOT EXISTS idx_donations_donation_date ON donations(donation_date);
CREATE INDEX IF NOT EXISTS idx_donations_organization_name ON donations(organization_name);
CREATE INDEX IF NOT EXISTS idx_donations_ein_number ON donations(ein_number);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_donations_updated_at 
    BEFORE UPDATE ON donations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Create policies for donations table
-- Patrons can view their own donations
CREATE POLICY "Patrons can view their own donations" ON donations
    FOR SELECT USING (auth.uid() = patron_id);

-- Patrons can insert their own donations
CREATE POLICY "Patrons can insert their own donations" ON donations
    FOR INSERT WITH CHECK (auth.uid() = patron_id);

-- Patrons can update their own donations (for receipt uploads, etc.)
CREATE POLICY "Patrons can update their own donations" ON donations
    FOR UPDATE USING (auth.uid() = patron_id);

-- Patrons can delete their own donations (within a certain time limit)
CREATE POLICY "Patrons can delete their own donations" ON donations
    FOR DELETE USING (auth.uid() = patron_id AND created_at > NOW() - INTERVAL '24 hours');

-- Charities can view donations to their listings
CREATE POLICY "Charities can view donations to their listings" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM listings 
            WHERE listings.id = donations.listing_id 
            AND listings.charity_id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE donations IS 'Stores patron donations to charity listings';
COMMENT ON COLUMN donations.patron_id IS 'ID of the patron who made the donation';
COMMENT ON COLUMN donations.listing_id IS 'ID of the listing that was donated to';
COMMENT ON COLUMN donations.organization_name IS 'Name of the organization receiving the donation';
COMMENT ON COLUMN donations.ein_number IS 'Employer Identification Number of the organization';
COMMENT ON COLUMN donations.amount_cents IS 'Donation amount in cents to avoid floating point precision issues';
COMMENT ON COLUMN donations.currency IS 'Currency code (e.g., USD, EUR)';
COMMENT ON COLUMN donations.deductible IS 'Whether the donation is tax deductible';
COMMENT ON COLUMN donations.receipt_url IS 'URL to the donation receipt';
COMMENT ON COLUMN donations.receipt_data IS 'Additional receipt metadata as JSON';
COMMENT ON COLUMN donations.donation_date IS 'Date and time when the donation was made';
