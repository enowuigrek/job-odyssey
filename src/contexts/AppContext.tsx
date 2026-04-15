import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  Dispatch,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AppState,
  JobApplication,
  Interview,
  CV,
  RecruitmentQuestion,
  StarStory,
  ApplicationStatus,
} from '../types';
import {
  loadUserState,
  upsertApplication,
  deleteApplication,
  upsertInterview,
  deleteInterview,
  upsertCV,
  deleteCV,
  upsertQuestion,
  deleteQuestion,
  upsertStory,
  deleteStory,
} from '../lib/db';
import { useAuth } from './AuthContext';

// ============================================================
// Action types (bez zmian — kompatybilne z istniejącymi stronami)
// ============================================================

type Action =
  | { type: 'ADD_APPLICATION'; payload: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_APPLICATION'; payload: JobApplication }
  | { type: 'DELETE_APPLICATION'; payload: string }
  | { type: 'ADD_INTERVIEW'; payload: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_INTERVIEW'; payload: Interview }
  | { type: 'DELETE_INTERVIEW'; payload: string }
  | { type: 'ADD_CV'; payload: Omit<CV, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } }
  | { type: 'UPDATE_CV'; payload: CV }
  | { type: 'DELETE_CV'; payload: string }
  | { type: 'ADD_QUESTION'; payload: Omit<RecruitmentQuestion, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_QUESTION'; payload: RecruitmentQuestion }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'ADD_STORY'; payload: Omit<StarStory, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_STORY'; payload: StarStory }
  | { type: 'DELETE_STORY'; payload: string }
  | { type: 'IMPORT_DATA'; payload: AppState }
  | { type: 'CLEAR_ALL' }
  | { type: 'INIT_STATE'; payload: AppState };

// ============================================================
// Reducer (bez zmian)
// ============================================================

function reducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [
          ...state.applications,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map(app =>
          app.id === action.payload.id ? { ...action.payload, updatedAt: now } : app
        ),
      };
    case 'DELETE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter(app => app.id !== action.payload),
        interviews: state.interviews.filter(int => int.applicationId !== action.payload),
      };

    case 'ADD_INTERVIEW':
      return {
        ...state,
        interviews: [
          ...state.interviews,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      };
    case 'UPDATE_INTERVIEW': {
      const oldInterview = state.interviews.find(i => i.id === action.payload.id);
      const newInterviews = state.interviews.map(int =>
        int.id === action.payload.id ? { ...action.payload, updatedAt: now } : int
      );
      let newApplications = state.applications;
      if (
        oldInterview &&
        oldInterview.status === 'scheduled' &&
        action.payload.status !== 'scheduled'
      ) {
        newApplications = state.applications.map(app => {
          if (app.id === action.payload.applicationId && app.status === 'interview') {
            return { ...app, status: 'pending' as ApplicationStatus, updatedAt: now };
          }
          return app;
        });
      }
      return { ...state, interviews: newInterviews, applications: newApplications };
    }
    case 'DELETE_INTERVIEW':
      return {
        ...state,
        interviews: state.interviews.filter(int => int.id !== action.payload),
      };

    case 'ADD_CV': {
      const cvId = action.payload.id ?? uuidv4();
      return {
        ...state,
        cvs: [
          ...state.cvs,
          { ...action.payload, id: cvId, createdAt: now, updatedAt: now },
        ],
      };
    }
    case 'UPDATE_CV':
      return {
        ...state,
        cvs: state.cvs.map(cv =>
          cv.id === action.payload.id ? { ...action.payload, updatedAt: now } : cv
        ),
      };
    case 'DELETE_CV':
      return { ...state, cvs: state.cvs.filter(cv => cv.id !== action.payload) };

    case 'ADD_QUESTION':
      return {
        ...state,
        questions: [
          ...state.questions,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map(q =>
          q.id === action.payload.id ? { ...action.payload, updatedAt: now } : q
        ),
      };
    case 'DELETE_QUESTION':
      return { ...state, questions: state.questions.filter(q => q.id !== action.payload) };

    case 'ADD_STORY':
      return {
        ...state,
        stories: [
          ...state.stories,
          { ...action.payload, id: uuidv4(), createdAt: now, updatedAt: now },
        ],
      };
    case 'UPDATE_STORY':
      return {
        ...state,
        stories: state.stories.map(s =>
          s.id === action.payload.id ? { ...action.payload, updatedAt: now } : s
        ),
      };
    case 'DELETE_STORY':
      return { ...state, stories: state.stories.filter(s => s.id !== action.payload) };

    case 'IMPORT_DATA':
      return action.payload;
    case 'CLEAR_ALL':
      return { applications: [], interviews: [], cvs: [], questions: [], stories: [] };
    case 'INIT_STATE':
      return action.payload;

    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  isElectronApp: boolean;
  getApplicationById: (id: string) => JobApplication | undefined;
  getInterviewsByApplicationId: (applicationId: string) => Interview[];
  getCVById: (id: string) => CV | undefined;
  getQuestionById: (id: string) => RecruitmentQuestion | undefined;
  getStoryById: (id: string) => StarStory | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const emptyState: AppState = {
  applications: [],
  interviews: [],
  cvs: [],
  questions: [],
  stories: [],
};

// ============================================================
// Provider
// ============================================================

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const prevStateRef = useRef<AppState>(emptyState);
  const syncReadyRef = useRef(false);

  // Electron jest dostępny tylko gdy electronAPI istnieje
  const isElectronApp = !!(window as Window & { electronAPI?: unknown }).electronAPI;

  // ============================================================
  // Ładowanie danych z Supabase przy logowaniu
  // ============================================================

  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR_ALL' });
      prevStateRef.current = emptyState;
      syncReadyRef.current = false;
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    syncReadyRef.current = false;

    loadUserState(user.id).then(data => {
      prevStateRef.current = data;
      dispatch({ type: 'INIT_STATE', payload: data });
      syncReadyRef.current = true;
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to load state from Supabase:', err);
      setIsLoading(false);
    });
  }, [user]);

  // ============================================================
  // Sync zmian do Supabase (diffing)
  // ============================================================

  useEffect(() => {
    if (!user || !syncReadyRef.current) return;

    const userId = user.id;
    const prev = prevStateRef.current;
    const curr = state;

    // Helper: diff jednej tablicy
    function diffAndSync<T extends { id: string; updatedAt: string }>(
      prevArr: T[],
      currArr: T[],
      upsertFn: (item: T, userId: string) => Promise<void>,
      deleteFn: (id: string) => Promise<void>
    ) {
      const prevMap = new Map(prevArr.map(x => [x.id, x]));
      const currMap = new Map(currArr.map(x => [x.id, x]));

      // Nowe lub zaktualizowane
      for (const item of currArr) {
        const old = prevMap.get(item.id);
        if (!old || old.updatedAt !== item.updatedAt) {
          upsertFn(item, userId);
        }
      }

      // Usunięte
      for (const item of prevArr) {
        if (!currMap.has(item.id)) {
          deleteFn(item.id);
        }
      }
    }

    diffAndSync(prev.applications, curr.applications, upsertApplication, deleteApplication);
    diffAndSync(prev.interviews, curr.interviews, upsertInterview, deleteInterview);
    diffAndSync(prev.cvs, curr.cvs, upsertCV, deleteCV);
    diffAndSync(prev.questions, curr.questions, upsertQuestion, deleteQuestion);
    diffAndSync(prev.stories, curr.stories, upsertStory, deleteStory);

    prevStateRef.current = curr;
  }, [state, user]);

  // ============================================================
  // Helpers
  // ============================================================

  const getApplicationById = useCallback(
    (id: string) => state.applications.find(app => app.id === id),
    [state.applications]
  );

  const getInterviewsByApplicationId = useCallback(
    (applicationId: string) => state.interviews.filter(int => int.applicationId === applicationId),
    [state.interviews]
  );

  const getCVById = useCallback(
    (id: string) => state.cvs.find(cv => cv.id === id),
    [state.cvs]
  );

  const getQuestionById = useCallback(
    (id: string) => state.questions.find(q => q.id === id),
    [state.questions]
  );

  const getStoryById = useCallback(
    (id: string) => state.stories.find(s => s.id === id),
    [state.stories]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch,
      isLoading,
      isElectronApp,
      getApplicationById,
      getInterviewsByApplicationId,
      getCVById,
      getQuestionById,
      getStoryById,
    }),
    [state, dispatch, isLoading, isElectronApp, getApplicationById, getInterviewsByApplicationId, getCVById, getQuestionById, getStoryById]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
