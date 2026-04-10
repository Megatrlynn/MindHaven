import { supabase } from './supabase';

const REQUIRED_PATIENT_FIELDS = ['username', 'name', 'phone', 'date_of_birth'] as const;

export const getPatientProfileCompletion = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      isComplete: false,
      missingFields: ['username', 'name', 'phone', 'date_of_birth'],
    };
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('username, name, phone, date_of_birth')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking patient profile completion:', error);
    return {
      isComplete: false,
      missingFields: ['username', 'name', 'phone', 'date_of_birth'],
    };
  }

  const missingFields = REQUIRED_PATIENT_FIELDS.filter((field) => {
    const value = data?.[field];
    return typeof value === 'string' ? value.trim().length === 0 : !value;
  });

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
};

export const isPatientProfileComplete = async () => {
  const completion = await getPatientProfileCompletion();
  return completion.isComplete;
};

export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }

  return Boolean(data);
};

export const isDoctor = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  
  const emailParts = user.email.split('@');
  if (emailParts.length !== 2) return false;
  
  const domain = emailParts[1].split('.')[0];
  return domain === 'doc';
};

export const getUserRole = async () => {
  if (await isAdmin()) return 'admin';
  if (await isDoctor()) return 'doctor';
  return 'patient';
};