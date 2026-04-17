import { supabase } from './supabase';
import type {
  CandidateProfile,
  ProfileDescription,
  ProfileExperience,
  ProfileProject,
  ProfileTechCategory,
  ProfileEducation,
  FullProfile,
} from '../types/profile';

// ============================================================
// Candidate Profile (contact + interests + rodo)
// ============================================================

export async function getOrCreateProfile(userId: string): Promise<CandidateProfile> {
  const { data, error } = await supabase
    .from('candidate_profile')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      id: data.id as string,
      location: data.location as string,
      phone: data.phone as string,
      email: data.email as string,
      links: (data.links as CandidateProfile['links']) ?? [],
      interests: data.interests as string,
      rodo: data.rodo as string,
    };
  }

  // Create default profile
  const { data: created, error: createError } = await supabase
    .from('candidate_profile')
    .insert({ user_id: userId })
    .select()
    .single();

  if (createError) throw createError;

  return {
    id: created.id as string,
    location: '',
    phone: '',
    email: '',
    links: [],
    interests: '',
    rodo: '',
  };
}

export async function upsertProfile(userId: string, data: Omit<CandidateProfile, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('candidate_profile')
    .upsert(
      {
        user_id: userId,
        location: data.location,
        phone: data.phone,
        email: data.email,
        links: data.links,
        interests: data.interests,
        rodo: data.rodo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

// ============================================================
// Profile Descriptions
// ============================================================

export async function getDescriptions(userId: string): Promise<ProfileDescription[]> {
  const { data, error } = await supabase
    .from('profile_descriptions')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id as string,
    name: r.name as string,
    content: r.content as string,
    sort_order: r.sort_order as number,
  }));
}

export async function upsertDescription(userId: string, desc: Partial<ProfileDescription> & { name: string; content: string }): Promise<ProfileDescription> {
  const row = {
    ...(desc.id ? { id: desc.id } : {}),
    user_id: userId,
    name: desc.name,
    content: desc.content,
    sort_order: desc.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from('profile_descriptions')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    name: data.name as string,
    content: data.content as string,
    sort_order: data.sort_order as number,
  };
}

export async function deleteDescription(id: string): Promise<void> {
  await supabase.from('profile_descriptions').delete().eq('id', id);
}

// ============================================================
// Profile Experiences
// ============================================================

export async function getExperiences(userId: string): Promise<ProfileExperience[]> {
  const { data, error } = await supabase
    .from('profile_experiences')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id as string,
    company: r.company as string,
    company_link: (r.company_link as ProfileExperience['company_link']) ?? undefined,
    roles: (r.roles as ProfileExperience['roles']) ?? [],
    sort_order: r.sort_order as number,
  }));
}

export async function upsertExperience(userId: string, exp: Partial<ProfileExperience> & { company: string; roles: ProfileExperience['roles'] }): Promise<ProfileExperience> {
  const row = {
    ...(exp.id ? { id: exp.id } : {}),
    user_id: userId,
    company: exp.company,
    company_link: exp.company_link ?? null,
    roles: exp.roles,
    sort_order: exp.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from('profile_experiences')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    company: data.company as string,
    company_link: (data.company_link as ProfileExperience['company_link']) ?? undefined,
    roles: (data.roles as ProfileExperience['roles']) ?? [],
    sort_order: data.sort_order as number,
  };
}

export async function deleteExperience(id: string): Promise<void> {
  await supabase.from('profile_experiences').delete().eq('id', id);
}

// ============================================================
// Profile Projects
// ============================================================

export async function getProjects(userId: string): Promise<ProfileProject[]> {
  const { data, error } = await supabase
    .from('profile_projects')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id as string,
    name: r.name as string,
    tagline: r.tagline as string,
    description: r.description as string,
    stack: r.stack as string,
    note: (r.note as string | null) ?? undefined,
    links: (r.links as ProfileProject['links']) ?? [],
    sort_order: r.sort_order as number,
  }));
}

export async function upsertProject(userId: string, proj: Partial<ProfileProject> & { name: string }): Promise<ProfileProject> {
  const row = {
    ...(proj.id ? { id: proj.id } : {}),
    user_id: userId,
    name: proj.name,
    tagline: proj.tagline ?? '',
    description: proj.description ?? '',
    stack: proj.stack ?? '',
    note: proj.note ?? null,
    links: proj.links ?? [],
    sort_order: proj.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from('profile_projects')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    name: data.name as string,
    tagline: data.tagline as string,
    description: data.description as string,
    stack: data.stack as string,
    note: (data.note as string | null) ?? undefined,
    links: (data.links as ProfileProject['links']) ?? [],
    sort_order: data.sort_order as number,
  };
}

export async function deleteProject(id: string): Promise<void> {
  await supabase.from('profile_projects').delete().eq('id', id);
}

// ============================================================
// Profile Tech Categories
// ============================================================

export async function getTechCategories(userId: string): Promise<ProfileTechCategory[]> {
  const { data, error } = await supabase
    .from('profile_tech_categories')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id as string,
    category: r.category as string,
    items: r.items as string,
    sort_order: r.sort_order as number,
  }));
}

export async function upsertTechCategory(userId: string, tech: Partial<ProfileTechCategory> & { category: string; items: string }): Promise<ProfileTechCategory> {
  const row = {
    ...(tech.id ? { id: tech.id } : {}),
    user_id: userId,
    category: tech.category,
    items: tech.items,
    sort_order: tech.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from('profile_tech_categories')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    category: data.category as string,
    items: data.items as string,
    sort_order: data.sort_order as number,
  };
}

export async function deleteTechCategory(id: string): Promise<void> {
  await supabase.from('profile_tech_categories').delete().eq('id', id);
}

// ============================================================
// Profile Education
// ============================================================

export async function getEducation(userId: string): Promise<ProfileEducation[]> {
  const { data, error } = await supabase
    .from('profile_education')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id as string,
    school: r.school as string,
    degree: r.degree as string,
    years: r.years as string,
    sort_order: r.sort_order as number,
  }));
}

export async function upsertEducation(userId: string, edu: Partial<ProfileEducation> & { school: string; degree: string; years: string }): Promise<ProfileEducation> {
  const row = {
    ...(edu.id ? { id: edu.id } : {}),
    user_id: userId,
    school: edu.school,
    degree: edu.degree,
    years: edu.years,
    sort_order: edu.sort_order ?? 0,
  };

  const { data, error } = await supabase
    .from('profile_education')
    .upsert(row)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    school: data.school as string,
    degree: data.degree as string,
    years: data.years as string,
    sort_order: data.sort_order as number,
  };
}

export async function deleteEducation(id: string): Promise<void> {
  await supabase.from('profile_education').delete().eq('id', id);
}

// ============================================================
// Full profile loader
// ============================================================

export async function getFullProfile(userId: string): Promise<FullProfile> {
  const [contact, descriptions, experiences, projects, techCategories, education] = await Promise.all([
    getOrCreateProfile(userId),
    getDescriptions(userId),
    getExperiences(userId),
    getProjects(userId),
    getTechCategories(userId),
    getEducation(userId),
  ]);

  return { contact, descriptions, experiences, projects, techCategories, education };
}
