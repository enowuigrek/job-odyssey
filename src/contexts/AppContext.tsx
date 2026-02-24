import { createContext, useContext, useReducer, useEffect, useState, useMemo, useCallback, Dispatch, ReactNode } from 'react';
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
import { loadState, loadStateAsync, saveState, isElectron } from '../utils/storage';

// Action types
type Action =
  // Applications
  | { type: 'ADD_APPLICATION'; payload: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_APPLICATION'; payload: JobApplication }
  | { type: 'DELETE_APPLICATION'; payload: string }
  // Interviews
  | { type: 'ADD_INTERVIEW'; payload: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_INTERVIEW'; payload: Interview }
  | { type: 'DELETE_INTERVIEW'; payload: string }
  // CVs
  | { type: 'ADD_CV'; payload: Omit<CV, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_CV'; payload: CV }
  | { type: 'DELETE_CV'; payload: string }
  // Questions
  | { type: 'ADD_QUESTION'; payload: Omit<RecruitmentQuestion, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_QUESTION'; payload: RecruitmentQuestion }
  | { type: 'DELETE_QUESTION'; payload: string }
  // Stories
  | { type: 'ADD_STORY'; payload: Omit<StarStory, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_STORY'; payload: StarStory }
  | { type: 'DELETE_STORY'; payload: string }
  // Bulk
  | { type: 'IMPORT_DATA'; payload: AppState }
  | { type: 'CLEAR_ALL' }
  // Init
  | { type: 'INIT_STATE'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    // Applications
    case 'ADD_APPLICATION':
      return {
        ...state,
        applications: [
          ...state.applications,
          {
            ...action.payload,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    case 'UPDATE_APPLICATION':
      return {
        ...state,
        applications: state.applications.map((app) =>
          app.id === action.payload.id
            ? { ...action.payload, updatedAt: now }
            : app
        ),
      };
    case 'DELETE_APPLICATION':
      return {
        ...state,
        applications: state.applications.filter((app) => app.id !== action.payload),
        interviews: state.interviews.filter((int) => int.applicationId !== action.payload),
      };

    // Interviews
    case 'ADD_INTERVIEW':
      return {
        ...state,
        interviews: [
          ...state.interviews,
          {
            ...action.payload,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    case 'UPDATE_INTERVIEW': {
      const oldInterview = state.interviews.find((i) => i.id === action.payload.id);
      const newInterviews = state.interviews.map((int) =>
        int.id === action.payload.id
          ? { ...action.payload, updatedAt: now }
          : int
      );

      // Gdy rozmowa zmienia status z "zaplanowana" na inny → aplikacja przeskakuje z
      // "Zaproszenie" na "Oczekiwanie" (rozmowa się odbyła, czekamy na odpowiedź)
      let newApplications = state.applications;
      if (
        oldInterview &&
        oldInterview.status === 'scheduled' &&
        action.payload.status !== 'scheduled'
      ) {
        newApplications = state.applications.map((app) => {
          if (app.id === action.payload.applicationId && app.status === 'interview') {
            return { ...app, status: 'pending' as ApplicationStatus, updatedAt: now };
          }
          return app;
        });
      }

      return {
        ...state,
        interviews: newInterviews,
        applications: newApplications,
      };
    }
    case 'DELETE_INTERVIEW':
      return {
        ...state,
        interviews: state.interviews.filter((int) => int.id !== action.payload),
      };

    // CVs
    case 'ADD_CV':
      return {
        ...state,
        cvs: [
          ...state.cvs,
          {
            ...action.payload,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    case 'UPDATE_CV':
      return {
        ...state,
        cvs: state.cvs.map((cv) =>
          cv.id === action.payload.id
            ? { ...action.payload, updatedAt: now }
            : cv
        ),
      };
    case 'DELETE_CV':
      return {
        ...state,
        cvs: state.cvs.filter((cv) => cv.id !== action.payload),
      };

    // Questions
    case 'ADD_QUESTION':
      return {
        ...state,
        questions: [
          ...state.questions,
          {
            ...action.payload,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id
            ? { ...action.payload, updatedAt: now }
            : q
        ),
      };
    case 'DELETE_QUESTION':
      return {
        ...state,
        questions: state.questions.filter((q) => q.id !== action.payload),
      };

    // Stories
    case 'ADD_STORY':
      return {
        ...state,
        stories: [
          ...state.stories,
          {
            ...action.payload,
            id: uuidv4(),
            createdAt: now,
            updatedAt: now,
          },
        ],
      };
    case 'UPDATE_STORY':
      return {
        ...state,
        stories: state.stories.map((s) =>
          s.id === action.payload.id
            ? { ...action.payload, updatedAt: now }
            : s
        ),
      };
    case 'DELETE_STORY':
      return {
        ...state,
        stories: state.stories.filter((s) => s.id !== action.payload),
      };

    // Bulk operations
    case 'IMPORT_DATA':
      return action.payload;
    case 'CLEAR_ALL':
      return {
        applications: [],
        interviews: [],
        cvs: [],
        questions: [],
        stories: [],
      };
    case 'INIT_STATE':
      return action.payload;

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
  isLoading: boolean;
  isElectronApp: boolean;
  // Helpers
  getApplicationById: (id: string) => JobApplication | undefined;
  getInterviewsByApplicationId: (applicationId: string) => Interview[];
  getCVById: (id: string) => CV | undefined;
  getQuestionById: (id: string) => RecruitmentQuestion | undefined;
  getStoryById: (id: string) => StarStory | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const defaultState: AppState = {
  applications: [],
  interviews: [],
  cvs: [],
  questions: [],
  stories: [],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, loadState());
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const isElectronApp = isElectron();

  // Asynchroniczne ładowanie stanu przy starcie (dla Electron)
  useEffect(() => {
    const initState = async () => {
      if (isElectronApp) {
        try {
          const data = await loadStateAsync();
          dispatch({ type: 'INIT_STATE', payload: data });
        } catch (error) {
          console.error('Failed to load state from Electron:', error);
        }
      }
      setIsLoading(false);
      setInitialized(true);
    };

    initState();
  }, [isElectronApp]);

  // Zapisuj przy każdej zmianie (ale dopiero po inicjalizacji)
  useEffect(() => {
    if (initialized) {
      saveState(state);
    }
  }, [state, initialized]);

  const getApplicationById = useCallback(
    (id: string) => state.applications.find((app) => app.id === id),
    [state.applications]
  );

  const getInterviewsByApplicationId = useCallback(
    (applicationId: string) => state.interviews.filter((int) => int.applicationId === applicationId),
    [state.interviews]
  );

  const getCVById = useCallback(
    (id: string) => state.cvs.find((cv) => cv.id === id),
    [state.cvs]
  );

  const getQuestionById = useCallback(
    (id: string) => state.questions.find((q) => q.id === id),
    [state.questions]
  );

  const getStoryById = useCallback(
    (id: string) => state.stories.find((s) => s.id === id),
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

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
