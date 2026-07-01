import { supabase } from './supabase';

export interface AdminUserOverview {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed: boolean;
  applications_count: number;
  cvs_count: number;
  interviews_count: number;
  has_profile: boolean;
}

export async function getAdminUsersOverview(): Promise<AdminUserOverview[]> {
  const { data, error } = await supabase.rpc('admin_get_users_overview');
  if (error) throw error;
  return (data ?? []) as AdminUserOverview[];
}
