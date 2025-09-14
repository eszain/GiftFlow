-- Migration to add EIN (Employer Identification Number) field to listings table
-- This field is optional (nullable) to maintain compatibility with existing data

-- Add the charity_ein column to the listings table
ALTER TABLE public.listings 
ADD COLUMN charity_ein VARCHAR(20);

-- Add a comment to document the field
COMMENT ON COLUMN public.listings.charity_ein IS 'EIN (Employer Identification Number) for tax verification purposes';

-- Create an index on charity_ein for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_charity_ein ON public.listings(charity_ein);

-- Note: EIN field is nullable to maintain backward compatibility with existing listings
-- Charities can add their EIN when creating new listings or updating existing ones
