-- Fix the listings table policies to work with Supabase auth

-- Drop existing policies first
DROP POLICY IF EXISTS "Charities can view own listings" ON listings;
DROP POLICY IF EXISTS "Charities can insert own listings" ON listings;
DROP POLICY IF EXISTS "Charities can update own listings" ON listings;
DROP POLICY IF EXISTS "Charities can delete own listings" ON listings;
DROP POLICY IF EXISTS "Patrons can view active listings" ON listings;

-- Create simpler, working policies
-- Charities can view and manage their own listings
CREATE POLICY "Charities can view own listings" ON listings
  FOR SELECT USING (auth.uid() = charity_id);

CREATE POLICY "Charities can insert own listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = charity_id);

CREATE POLICY "Charities can update own listings" ON listings
  FOR UPDATE USING (auth.uid() = charity_id);

CREATE POLICY "Charities can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = charity_id);

-- Patrons can view all active, verified listings (simplified policy)
CREATE POLICY "Patrons can view active listings" ON listings
  FOR SELECT USING (
    status = 'active' AND 
    verification_status = 'verified'
  );

-- Allow authenticated users to view their own listings regardless of role
CREATE POLICY "Users can view own listings" ON listings
  FOR SELECT USING (auth.uid() = charity_id);
