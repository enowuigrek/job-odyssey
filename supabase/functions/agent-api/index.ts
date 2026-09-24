import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// API dla zewnętrznego agenta (np. zaplanowanej sesji Claude Code), który szuka ofert
// i przygotowuje aplikacje z CV — to samo co "Importuj paczkę", tylko bez klikania.
// Autoryzacja: osobisty token z Ustawień (Authorization: Bearer jo_…). Token daje
// dostęp wyłącznie do danych swojego właściciela i tylko do dwóch operacji:
//   GET  /agent-api/applications  — lista aplikacji (do wykrywania duplikatów)
//   POST /agent-api/import        — paczka { items: [...] } w formacie z src/lib/importPackage.ts
// Wdrażane z --no-verify-jwt: zamiast JWT Supabase sprawdzamy własny token.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Trzymać w zgodzie z src/lib/planLimits.ts
const TRIAL_CV_LIMIT = 2;
const TRIAL_APPLICATION_LIMIT = 15;
const MAX_ITEMS_PER_REQUEST = 20;

const SOURCES: Record<string, string> = {
  'linkedin.com': 'LinkedIn',
  'pracuj.pl': 'Pracuj.pl',
  'indeed.com': 'Indeed',
  'nofluffjobs.com': 'No Fluff Jobs',
  'justjoin.it': 'Just Join IT',
  'bulldogjob.pl': 'Bulldogjob',
  'theprotocol.it': 'The:Protocol',
  'rocket-jobs.pl': 'Rocket Jobs',
  'glassdoor.com': 'Glassdoor',
  'olx.pl': 'OLX',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** user_id właściciela tokenu albo null, gdy token nieprawidłowy/odwołany */
async function authenticate(req: Request): Promise<string | null> {
  const match = (req.headers.get('Authorization') ?? '').match(/^Bearer\s+(jo_[A-Za-z0-9_-]+)$/);
  if (!match) return null;
  const { data } = await supabase
    .from('agent_tokens')
    .select('id, user_id')
    .eq('token_hash', await sha256Hex(match[1]))
    .maybeSingle();
  if (!data) return null;
  await supabase.from('agent_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data.user_id as string;
}

// Trzymać w zgodzie z normalizeUrlKey w src/lib/trackUrl.ts
function urlKey(u: string): string {
  return u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

// Ta sama minimalna kontrola co looksLikeCVData w src/lib/importPackage.ts;
// resztę (brakujące pola, stare formaty) appka normalizuje przy odczycie CV.
function looksLikeCVData(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false;
  const cv = v as Record<string, unknown>;
  const contact = cv.contact as Record<string, unknown> | undefined;
  return (
    typeof cv.name === 'string' &&
    !!contact && Array.isArray(contact.links) &&
    Array.isArray(cv.experience) &&
    Array.isArray(cv.education) &&
    Array.isArray(cv.technologies) &&
    Array.isArray(cv.projects)
  );
}

function detectSource(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    for (const [domain, name] of Object.entries(SOURCES)) {
      if (host.includes(domain)) return name;
    }
  } catch { /* nieprawidłowy URL — bez źródła */ }
  return null;
}

async function listApplications(userId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('applications')
    .select('company_name, position, job_url, status, origin, applied_date, notes')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return json({ error: error.message }, 500);
  return json({
    applications: (data ?? []).map(a => ({
      companyName: a.company_name,
      position: a.position,
      jobUrl: a.job_url,
      status: a.status,
      origin: a.origin,
      appliedDate: a.applied_date,
      // Notatki tylko przy wycofanych — to informacja zwrotna dla agenta, czego nie proponować
      ...(a.status === 'withdrawn' && a.notes ? { notes: a.notes } : {}),
    })),
  });
}

interface Skipped { companyName: string; position: string; reason: string }

async function importPackage(userId: string, req: Request): Promise<Response> {
  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Nieprawidłowy JSON' }, 400);
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return json({ error: 'Brak listy "items" w paczce' }, 400);
  }
  if (body.items.length > MAX_ITEMS_PER_REQUEST) {
    return json({ error: `Maksymalnie ${MAX_ITEMS_PER_REQUEST} pozycji na raz` }, 400);
  }

  const [{ data: existing, error: appsError }, { count: cvCount }, { data: settings }] = await Promise.all([
    supabase.from('applications').select('company_name, position, job_url').eq('user_id', userId),
    supabase.from('cvs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_settings').select('plan').eq('user_id', userId).maybeSingle(),
  ]);
  if (appsError) return json({ error: appsError.message }, 500);

  const isTrial = settings?.plan !== 'full';
  let appTotal = existing?.length ?? 0;
  let cvTotal = cvCount ?? 0;
  const urlKeys = new Set((existing ?? []).filter(a => a.job_url).map(a => urlKey(a.job_url)));
  const pairKeys = new Set((existing ?? []).map(a => `${a.company_name}|${a.position}`.toLowerCase()));

  const now = new Date().toISOString();
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Warsaw' });
  const added: { companyName: string; position: string; applicationId: string }[] = [];
  const skipped: Skipped[] = [];

  for (const raw of body.items as Record<string, unknown>[]) {
    const companyName = isNonEmptyString(raw?.companyName) ? raw.companyName.trim() : '';
    const position = isNonEmptyString(raw?.position) ? raw.position.trim() : '';
    const skip = (reason: string) => skipped.push({ companyName, position, reason });

    if (!companyName || !position) { skip('brak nazwy firmy albo stanowiska'); continue; }
    if (raw.cv !== undefined && !looksLikeCVData(raw.cv)) { skip('CV ma niepoprawną strukturę'); continue; }

    const jobUrl = isNonEmptyString(raw.jobUrl) ? raw.jobUrl.trim() : null;
    const pairKey = `${companyName}|${position}`.toLowerCase();
    if ((jobUrl && urlKeys.has(urlKey(jobUrl))) || (!jobUrl && pairKeys.has(pairKey))) {
      skip('już jest w aplikacjach');
      continue;
    }
    if (isTrial && appTotal >= TRIAL_APPLICATION_LIMIT) { skip('limit aplikacji wersji próbnej'); continue; }
    if (isTrial && raw.cv && cvTotal >= TRIAL_CV_LIMIT) { skip('limit CV wersji próbnej'); continue; }

    let cvId: string | null = null;
    if (raw.cv) {
      cvId = crypto.randomUUID();
      const { error } = await supabase.from('cvs').insert({
        id: cvId,
        user_id: userId,
        name: isNonEmptyString(raw.cvName) ? raw.cvName.trim() : `${companyName} — ${position}`,
        target_position: position,
        is_default: false,
        data: raw.cv,
        created_at: now,
        updated_at: now,
      });
      if (error) { skip(`błąd zapisu CV: ${error.message}`); continue; }
    }

    const applicationId = crypto.randomUUID();
    const { error } = await supabase.from('applications').insert({
      id: applicationId,
      user_id: userId,
      company_name: companyName,
      position,
      job_url: jobUrl,
      location: isNonEmptyString(raw.location) ? raw.location.trim() : null,
      salary_offered: isNonEmptyString(raw.salaryOffered) ? raw.salaryOffered.trim() : null,
      status: 'saved',
      applied_date: today,
      cv_id: cvId,
      notes: isNonEmptyString(raw.notes) ? raw.notes : null,
      source: isNonEmptyString(raw.source) ? raw.source.trim() : (jobUrl ? detectSource(jobUrl) : null),
      origin: 'ai',
      created_at: now,
      updated_at: now,
    });
    if (error) {
      // Bez aplikacji osierocone CV tylko by zaśmiecało Bazę CV
      if (cvId) await supabase.from('cvs').delete().eq('id', cvId);
      skip(`błąd zapisu aplikacji: ${error.message}`);
      continue;
    }

    appTotal++;
    if (cvId) cvTotal++;
    if (jobUrl) urlKeys.add(urlKey(jobUrl));
    pairKeys.add(pairKey);
    added.push({ companyName, position, applicationId });
  }

  return json({ added, skipped });
}

Deno.serve(async (req: Request) => {
  const userId = await authenticate(req);
  if (!userId) return json({ error: 'Nieprawidłowy lub odwołany token agenta' }, 401);

  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  if (req.method === 'GET' && path.endsWith('/applications')) return listApplications(userId);
  if (req.method === 'POST' && path.endsWith('/import')) return importPackage(userId, req);
  return json({ error: 'Nieznana operacja. Dostępne: GET /applications, POST /import' }, 404);
});
