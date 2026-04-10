export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  profession: string;
  phone: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  user_id: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  medical_history: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  name: string | null;
  phone: string | null;
  profile_picture: string | null;
  email: string | null;
}

export interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_profile?: UserProfile;
}

export interface Question {
  id: string;
  user_id: string;
  question: string;
  answer: string | null;
  status: 'pending' | 'answered';
  created_at: string;
}

export interface DoctorPatientConnection {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: 'pending' | 'connected';
  created_at: string;
  updated_at: string;
  doctor?: Doctor;
  patient?: UserProfile;
}

export interface DoctorPatientChat {
  id: string;
  connection_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}