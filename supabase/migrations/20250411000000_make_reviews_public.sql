/*
  # Make reviews visible to public (unauthenticated users)
  
  Change the reviews table RLS policy from authenticated-only to public,
  so testimonials are visible to all visitors, not just logged-in users.
*/

-- Drop the existing authenticated-only SELECT policy
DROP POLICY IF EXISTS "Everyone can read reviews" ON reviews;

-- Create a new public SELECT policy
CREATE POLICY "Anyone can read reviews"
  ON reviews FOR SELECT
  TO public
  USING (true);
