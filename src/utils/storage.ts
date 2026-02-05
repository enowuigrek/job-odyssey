import { AppState } from '../types';

const STORAGE_KEY = 'job-odyssey-data';

const defaultState: AppState = {
  applications: [],
  interviews: [],
  cvs: [],
  questions: [],
  stories: [],
};

// Sprawdź czy jesteśmy w Electron
export function isElectron(): boolean {
  return !!(window.electronAPI?.isElectron);
}

// ============ Wczytywanie danych ============
export async function loadStateAsync(): Promise<AppState> {
  if (isElectron()) {
    try {
      const data = await window.electronAPI!.loadData();
      if (data) {
        return data;
      }
      return defaultState;
    } catch (error) {
      console.error('Failed to load state from file:', error);
      return defaultState;
    }
  } else {
    // Fallback do localStorage dla przeglądarki
    return loadStateSync();
  }
}

// Synchroniczna wersja dla kompatybilności (używa localStorage)
export function loadStateSync(): AppState {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return defaultState;
    }
    return JSON.parse(serialized) as AppState;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return defaultState;
  }
}

// Alias dla kompatybilności
export function loadState(): AppState {
  return loadStateSync();
}

// ============ Zapisywanie danych ============
export async function saveStateAsync(state: AppState): Promise<void> {
  if (isElectron()) {
    try {
      const result = await window.electronAPI!.saveData(state);
      if (!result.success) {
        console.error('Failed to save state to file:', result.error);
      }
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  } else {
    // Fallback do localStorage
    saveStateSync(state);
  }
}

// Synchroniczna wersja
export function saveStateSync(state: AppState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

// Alias dla kompatybilności
export function saveState(state: AppState): void {
  // Wywołaj async w tle
  saveStateAsync(state);
  // Też zapisz do localStorage jako backup
  saveStateSync(state);
}

// ============ Eksport/Import ============
export async function exportData(): Promise<string> {
  const state = await loadStateAsync();
  return JSON.stringify(state, null, 2);
}

export async function importData(jsonString: string): Promise<AppState | null> {
  try {
    const data = JSON.parse(jsonString) as AppState;
    // Walidacja podstawowa
    if (
      !Array.isArray(data.applications) ||
      !Array.isArray(data.interviews) ||
      !Array.isArray(data.cvs) ||
      !Array.isArray(data.questions) ||
      !Array.isArray(data.stories)
    ) {
      throw new Error('Invalid data structure');
    }
    await saveStateAsync(data);
    return data;
  } catch (error) {
    console.error('Failed to import data:', error);
    return null;
  }
}

export async function clearAllData(): Promise<void> {
  if (isElectron()) {
    await window.electronAPI!.saveData(defaultState);
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ============ Pliki CV ============
export async function saveCVFile(
  fileName: string,
  fileData: string
): Promise<{ success: boolean; error?: string }> {
  if (isElectron()) {
    return await window.electronAPI!.saveCVFile(fileName, fileData);
  }
  // W przeglądarce nie obsługujemy plików CV
  return { success: false, error: 'CV files not supported in browser mode' };
}

export async function loadCVFile(
  fileName: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  if (isElectron()) {
    return await window.electronAPI!.loadCVFile(fileName);
  }
  return { success: false, error: 'CV files not supported in browser mode' };
}

export async function deleteCVFile(
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  if (isElectron()) {
    return await window.electronAPI!.deleteCVFile(fileName);
  }
  return { success: false, error: 'CV files not supported in browser mode' };
}

export async function openDataFolder(): Promise<void> {
  if (isElectron()) {
    await window.electronAPI!.openDataFolder();
  }
}

export async function openCVFile(
  fileName: string
): Promise<{ success: boolean; error?: string }> {
  if (isElectron()) {
    return await window.electronAPI!.openCVFile(fileName);
  }
  return { success: false, error: 'CV files not supported in browser mode' };
}
