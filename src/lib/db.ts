import { supabase } from './supabase';
import {
  AppState,
  JobApplication,
  Interview,
  CV,
  RecruitmentQuestion,
  StarStory,
  ApplicationStatus,
  InterviewStatus,
  QuestionCategory,
  DifficultyLevel,
} from '../types';

// ============================================================
// Mappers: Postgres (snake_case) ↔ TypeScript (camelCase)
// ============================================================

function mapApplication(row: Record<string, unknown>): JobApplication {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    position: row.position as string,
    jobUrl: row.job_url as string | undefined,
    location: row.location as string | undefined,
    salaryOffered: row.salary_offered as string | undefined,
    salaryExpected: row.salary_expected as string | undefined,
    status: row.status as ApplicationStatus,
    appliedDate: row.applied_date as string | undefined,
    cvId: row.cv_id as string | undefined,
    notes: row.notes as string | undefined,
    source: row.source as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbApplication(app: JobApplication, userId: string) {
  return {
    id: app.id,
    user_id: userId,
    company_name: app.companyName,
    position: app.position,
    job_url: app.jobUrl ?? null,
    location: app.location ?? null,
    salary_offered: app.salaryOffered ?? null,
    salary_expected: app.salaryExpected ?? null,
    status: app.status,
    applied_date: app.appliedDate ?? null,
    cv_id: app.cvId ?? null,
    notes: app.notes ?? null,
    source: app.source ?? null,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
  };
}

function mapInterview(row: Record<string, unknown>): Interview {
  return {
    id: row.id as string,
    applicationId: row.application_id as string,
    scheduledDate: row.scheduled_date as string,
    duration: row.duration as number | undefined,
    location: row.location as string | undefined,
    status: row.status as InterviewStatus,
    whatWentWell: row.what_went_well as string | undefined,
    whatWentWrong: row.what_went_wrong as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbInterview(interview: Interview, userId: string) {
  return {
    id: interview.id,
    user_id: userId,
    application_id: interview.applicationId,
    scheduled_date: interview.scheduledDate,
    duration: interview.duration ?? null,
    location: interview.location ?? null,
    status: interview.status,
    what_went_well: interview.whatWentWell ?? null,
    what_went_wrong: interview.whatWentWrong ?? null,
    notes: interview.notes ?? null,
    created_at: interview.createdAt,
    updated_at: interview.updatedAt,
  };
}

function mapCV(row: Record<string, unknown>): CV {
  return {
    id: row.id as string,
    name: row.name as string,
    fileName: row.file_name as string | undefined,
    targetPosition: row.target_position as string | undefined,
    keywords: (row.keywords as string[]) ?? undefined,
    isDefault: row.is_default as boolean,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbCV(cv: CV, userId: string) {
  return {
    id: cv.id,
    user_id: userId,
    name: cv.name,
    file_name: cv.fileName ?? null,
    target_position: cv.targetPosition ?? null,
    keywords: cv.keywords ?? null,
    is_default: cv.isDefault,
    notes: cv.notes ?? null,
    created_at: cv.createdAt,
    updated_at: cv.updatedAt,
  };
}

function mapQuestion(row: Record<string, unknown>): RecruitmentQuestion {
  return {
    id: row.id as string,
    question: row.question as string,
    category: row.category as QuestionCategory,
    difficulty: row.difficulty as DifficultyLevel,
    positions: (row.positions as string[]) ?? undefined,
    myAnswer: row.my_answer as string | undefined,
    suggestedAnswer: row.suggested_answer as string | undefined,
    timesAsked: row.times_asked as number,
    lastAskedAt: row.last_asked_at as string | undefined,
    relatedStoryIds: (row.related_story_ids as string[]) ?? undefined,
    tags: (row.tags as string[]) ?? undefined,
    source: row.source as string | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbQuestion(q: RecruitmentQuestion, userId: string) {
  return {
    id: q.id,
    user_id: userId,
    question: q.question,
    category: q.category,
    difficulty: q.difficulty,
    positions: q.positions ?? null,
    my_answer: q.myAnswer ?? null,
    suggested_answer: q.suggestedAnswer ?? null,
    times_asked: q.timesAsked,
    last_asked_at: q.lastAskedAt ?? null,
    related_story_ids: q.relatedStoryIds ?? null,
    tags: q.tags ?? null,
    source: q.source ?? null,
    notes: q.notes ?? null,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  };
}

function mapStory(row: Record<string, unknown>): StarStory {
  return {
    id: row.id as string,
    title: row.title as string,
    situation: row.situation as string,
    task: row.task as string,
    action: row.action as string,
    result: row.result as string,
    skills: (row.skills as string[]) ?? undefined,
    positions: (row.positions as string[]) ?? undefined,
    usedInInterviews: (row.used_in_interviews as string[]) ?? undefined,
    effectiveness: row.effectiveness as number | undefined,
    tags: (row.tags as string[]) ?? undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toDbStory(s: StarStory, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    situation: s.situation,
    task: s.task,
    action: s.action,
    result: s.result,
    skills: s.skills ?? null,
    positions: s.positions ?? null,
    used_in_interviews: s.usedInInterviews ?? null,
    effectiveness: s.effectiveness ?? null,
    tags: s.tags ?? null,
    notes: s.notes ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

// ============================================================
// Load entire state
// ============================================================

export async function loadUserState(userId: string): Promise<AppState> {
  const [appRes, intRes, cvRes, qRes, stRes] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', userId),
    supabase.from('interviews').select('*').eq('user_id', userId),
    supabase.from('cvs').select('*').eq('user_id', userId),
    supabase.from('questions').select('*').eq('user_id', userId),
    supabase.from('stories').select('*').eq('user_id', userId),
  ]);

  return {
    applications: (appRes.data ?? []).map(r => mapApplication(r as Record<string, unknown>)),
    interviews: (intRes.data ?? []).map(r => mapInterview(r as Record<string, unknown>)),
    cvs: (cvRes.data ?? []).map(r => mapCV(r as Record<string, unknown>)),
    questions: (qRes.data ?? []).map(r => mapQuestion(r as Record<string, unknown>)),
    stories: (stRes.data ?? []).map(r => mapStory(r as Record<string, unknown>)),
  };
}

// ============================================================
// Applications
// ============================================================

export async function upsertApplication(app: JobApplication, userId: string) {
  await supabase.from('applications').upsert(toDbApplication(app, userId));
}

export async function deleteApplication(id: string) {
  await supabase.from('applications').delete().eq('id', id);
}

// ============================================================
// Interviews
// ============================================================

export async function upsertInterview(interview: Interview, userId: string) {
  await supabase.from('interviews').upsert(toDbInterview(interview, userId));
}

export async function deleteInterview(id: string) {
  await supabase.from('interviews').delete().eq('id', id);
}

// ============================================================
// CVs
// ============================================================

export async function upsertCV(cv: CV, userId: string) {
  await supabase.from('cvs').upsert(toDbCV(cv, userId));
}

export async function deleteCV(id: string) {
  await supabase.from('cvs').delete().eq('id', id);
}

// ============================================================
// CV Files (Supabase Storage)
// ============================================================

export async function uploadCVFile(
  userId: string,
  cvId: string,
  fileName: string,
  fileData: ArrayBuffer | Blob | File
): Promise<{ path: string; error?: string } | null> {
  const path = `${userId}/${cvId}/${fileName}`;

  // Determine content type
  const contentType = fileData instanceof File
    ? fileData.type
    : 'application/octet-stream';

  const { error } = await supabase.storage.from('cv-files').upload(path, fileData, {
    upsert: true,
    contentType,
  });

  if (error) {
    console.error('Upload error:', error.message, error);
    return { path, error: error.message };
  }
  return { path };
}

export async function getCVFileUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('cv-files').createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteCVFileFromStorage(path: string) {
  await supabase.storage.from('cv-files').remove([path]);
}

// ============================================================
// Questions
// ============================================================

export async function upsertQuestion(q: RecruitmentQuestion, userId: string) {
  await supabase.from('questions').upsert(toDbQuestion(q, userId));
}

export async function deleteQuestion(id: string) {
  await supabase.from('questions').delete().eq('id', id);
}

// ============================================================
// Stories
// ============================================================

export async function upsertStory(s: StarStory, userId: string) {
  await supabase.from('stories').upsert(toDbStory(s, userId));
}

export async function deleteStory(id: string) {
  await supabase.from('stories').delete().eq('id', id);
}

// ============================================================
// CV Tracking Links
// ============================================================

export interface TrackingLink {
  id: string;
  userId: string;
  applicationId: string;
  cvId?: string;
  token: string;
  label: string;
  targetUrl: string;
  createdAt: string;
}

export interface TrackingClick {
  id: string;
  token: string;
  clickedAt: string;
  userAgent?: string;
  referrer?: string;
}

export async function createTrackingLinks(
  links: Omit<TrackingLink, 'id' | 'createdAt'>[]
): Promise<TrackingLink[]> {
  const rows = links.map(l => ({
    user_id: l.userId,
    application_id: l.applicationId,
    cv_id: l.cvId ?? null,
    token: l.token,
    label: l.label,
    target_url: l.targetUrl,
  }));
  const { data, error } = await supabase.from('cv_tracking_links').insert(rows).select();
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id,
    userId: r.user_id,
    applicationId: r.application_id,
    cvId: r.cv_id ?? undefined,
    token: r.token,
    label: r.label,
    targetUrl: r.target_url,
    createdAt: r.created_at,
  }));
}

export async function getTrackingLinksForApplication(
  applicationId: string
): Promise<TrackingLink[]> {
  const { data } = await supabase
    .from('cv_tracking_links')
    .select('*')
    .eq('application_id', applicationId);
  return (data ?? []).map(r => ({
    id: r.id,
    userId: r.user_id,
    applicationId: r.application_id,
    cvId: r.cv_id ?? undefined,
    token: r.token,
    label: r.label,
    targetUrl: r.target_url,
    createdAt: r.created_at,
  }));
}

export async function getClicksForApplication(applicationId: string): Promise<TrackingClick[]> {
  const { data: links } = await supabase
    .from('cv_tracking_links')
    .select('token')
    .eq('application_id', applicationId);

  if (!links || links.length === 0) return [];

  const tokens = links.map(l => l.token);
  const { data: clicks } = await supabase
    .from('cv_clicks')
    .select('*')
    .in('token', tokens)
    .order('clicked_at', { ascending: false });

  return (clicks ?? []).map(r => ({
    id: r.id,
    token: r.token,
    clickedAt: r.clicked_at,
    userAgent: r.user_agent ?? undefined,
    referrer: r.referrer ?? undefined,
  }));
}

export async function getRecentClicksForUser(userId: string, limit = 20): Promise<Array<TrackingClick & { label: string; companyName?: string; applicationId: string }>> {
  const { data: links } = await supabase
    .from('cv_tracking_links')
    .select('token, label, application_id')
    .eq('user_id', userId);

  if (!links || links.length === 0) return [];

  const tokens = links.map(l => l.token);
  const { data: clicks } = await supabase
    .from('cv_clicks')
    .select('*')
    .in('token', tokens)
    .order('clicked_at', { ascending: false })
    .limit(limit);

  const tokenMap = new Map(links.map(l => [l.token, l]));

  return (clicks ?? []).map(r => {
    const link = tokenMap.get(r.token);
    return {
      id: r.id,
      token: r.token,
      clickedAt: r.clicked_at,
      userAgent: r.user_agent ?? undefined,
      referrer: r.referrer ?? undefined,
      label: link?.label ?? 'Nieznany link',
      applicationId: link?.application_id ?? '',
    };
  });
}
