import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface ParsedCvLink {
  label: string;
  url: string;
}

export interface ParsedCvExperience {
  company: string;
  roles: { title: string; years?: string; bullets: string[] }[];
}

export interface ParsedCvProfile {
  contact?: { name?: string; location?: string; phone?: string; email?: string; links?: ParsedCvLink[] };
  interests?: string;
  experiences?: ParsedCvExperience[];
  education?: { school: string; degree: string; years: string }[];
  techCategories?: { category: string; items: string }[];
  projects?: { name: string; tagline?: string; description?: string; stack?: string }[];
  certificates?: { name: string; issuer?: string; year?: string }[];
}

export type ParseCvErrorCode = 'AUTH' | 'LIMIT' | 'EMPTY_INPUT' | 'UPSTREAM' | 'PARSE' | 'UNKNOWN';

export class ParseCvError extends Error {
  code: ParseCvErrorCode;
  constructor(code: ParseCvErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const GENERIC_ERROR = 'Nie udało się przeanalizować CV — spróbuj ponownie.';
// Bogate CV (kilka firm, projekty, długie opisy) każą modelowi wygenerować
// sporo tokenów wyjścia — 25s okazało się za mało i zrywało realne, poprawne
// odpowiedzi w połowie generowania.
const TIMEOUT_MS = 55000;

export async function parseCvText(text: string): Promise<ParsedCvProfile> {
  const { data, error } = await supabase.functions.invoke<{ profile: ParsedCvProfile }>('parse-cv', {
    body: { text },
    timeout: TIMEOUT_MS,
  });

  if (error) {
    console.error(error);
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        throw new ParseCvError(body.code ?? 'UNKNOWN', body.error ?? GENERIC_ERROR);
      } catch (e) {
        if (e instanceof ParseCvError) throw e;
      }
    }
    throw new ParseCvError('UNKNOWN', GENERIC_ERROR);
  }

  return data?.profile ?? {};
}
