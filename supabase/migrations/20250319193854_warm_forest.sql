/*
  # Add trigger for automatic user profile creation
  
  1. Changes
    - Create trigger function to create user profile on auth.users insert
    - Add trigger to auth.users table
    
  2. Details
    - Creates user_profile record when new user signs up
    - Links profile to user via user_id
    - Sets default values for new profiles
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.create_initial_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_initial_profile();