import { supabase } from './supabase';

export async function submitContactMessage(data: {
  name: string;
  email: string;
  message: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('contact_messages').insert({
    name: data.name,
    email: data.email,
    message: data.message,
  });
  return { error: error?.message ?? null };
}
