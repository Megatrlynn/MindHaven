/*
  # Update admin check function

  Updates the is_admin() function to ignore domain extensions when checking email
*/

CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id
    AND split_part(split_part(email, '@', 2), '.', 1) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;