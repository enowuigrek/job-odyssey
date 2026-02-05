// Status aplikacji o pracę
// Uproszczone statusy: Zapisana → Wysłana → Odmowa (bez rozmowy) → Zaproszenie → Odmowa (po rozmowie) → Sukces
export type ApplicationStatus =
  | 'saved'           // Zapisana - do aplikowania
  | 'applied'         // Wysłana - CV wysłane
  | 'rejected_no_interview'  // Odmowa bez rozmowy
  | 'interview'       // Zaproszenie na rozmowę
  | 'rejected_after_interview'  // Odmowa po rozmowie
  | 'success';        // Sukces - oferta/przyjęty

// Status rozmowy (uproszczony)
export type InterviewStatus =
  | 'scheduled'        // Zaplanowana
  | 'waiting'          // W oczekiwaniu na odpowiedź
  | 'positive'         // Pozytywna
  | 'negative';        // Negatywna

// Kategoria pytania rekrutacyjnego
export type QuestionCategory =
  | 'behavioral'
  | 'technical'
  | 'situational'
  | 'motivation'
  | 'salary'
  | 'company_knowledge'
  | 'role_specific'
  | 'other';

// Poziom trudności
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Aplikacja o pracę - uproszczona wersja
export interface JobApplication {
  id: string;
  companyName: string;
  position: string;
  jobUrl?: string;
  location?: string;
  salaryOffered?: string;    // wynagrodzenie z oferty
  salaryExpected?: string;   // moje oczekiwania
  status: ApplicationStatus;
  appliedDate?: string;
  cvId?: string; // powiązanie z konkretnym CV
  notes?: string;
  source?: string; // skąd znalazłem ofertę (LinkedIn, pracuj.pl, etc.)
  createdAt: string;
  updatedAt: string;
}

// Rozmowa kwalifikacyjna - uproszczona
export interface Interview {
  id: string;
  applicationId: string;
  scheduledDate: string;
  duration?: number; // w minutach
  location?: string; // lub link do video call
  status: InterviewStatus;
  // Pola do uzupełnienia po rozmowie
  whatWentWell?: string;
  whatWentWrong?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// CV
export interface CV {
  id: string;
  name: string; // np. "CV Frontend Developer"
  fileName?: string;
  fileContent?: string; // base64 lub tekst
  targetPosition?: string;
  keywords?: string[]; // słowa kluczowe dla ATS
  isDefault: boolean;
  usedInApplications?: string[]; // ID aplikacji
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Pytanie rekrutacyjne
export interface RecruitmentQuestion {
  id: string;
  question: string;
  category: QuestionCategory;
  difficulty: DifficultyLevel;
  positions?: string[]; // na jakie stanowiska to pytanie pada
  myAnswer?: string;
  suggestedAnswer?: string;
  timesAsked: number; // ile razy padło
  lastAskedAt?: string;
  relatedStoryIds?: string[]; // powiązane historie STAR
  tags?: string[];
  source?: string; // gdzie to pytanie padło
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Historia STAR (Situation, Task, Action, Result)
export interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  skills?: string[]; // jakie umiejętności demonstruje ta historia
  positions?: string[]; // dla jakich stanowisk pasuje
  usedInInterviews?: string[]; // ID rozmów gdzie użyłem
  effectiveness?: number; // 1-5 jak dobrze działa
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Statystyki dashboardu
export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  interviewsCompleted: number;
  offersReceived: number;
  rejections: number;
  responseRate: number;
  averageResponseTime: number; // dni
  topPerformingCV?: string;
  mostAskedQuestions: string[];
}

// Filtr dla aplikacji
export interface ApplicationFilter {
  status?: ApplicationStatus[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
}

// Stan całej aplikacji
export interface AppState {
  applications: JobApplication[];
  interviews: Interview[];
  cvs: CV[];
  questions: RecruitmentQuestion[];
  stories: StarStory[];
}
