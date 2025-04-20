import { supabase } from './supabase';

export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;
  
  const emailParts = user.email.split('@');
  if (emailParts.length !== 2) return false;
  
  const domain = emailParts[1].split('.')[0];
  return domain === 'admin';
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