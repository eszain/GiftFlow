-- Fix patron policies to allow viewing pending listings for testing

-- Drop the existing patron policy
DROP POLICY IF EXISTS "Patrons can view active listings" ON listings;

-- Create new policy that allows patrons to view both verified and pending listings
CREATE POLICY "Patrons can view active listings" ON listings
  FOR SELECT USING (
    status = 'active' AND 
    (verification_status = 'verified' OR verification_status = 'pending')
  );

-- Also create a policy for patrons to view all active listings (for testing)
-- This will allow patrons to see any active listing regardless of verification status
CREATE POLICY "Patrons can view all active listings" ON listings
  FOR SELECT USING (status = 'active');
