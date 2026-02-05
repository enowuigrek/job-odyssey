import { AppState } from './index';

// Typy dla Electron API dostępnego przez preload
export interface ElectronAPI {
  getDataPath: () => Promise<string>;
  loadData: () => Promise<AppState | null>;
  saveData: (data: AppState) => Promise<{ success: boolean; error?: string }>;
  saveCVFile: (
    fileName: string,
    fileData: string
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  loadCVFile: (
    fileName: string
  ) => Promise<{ success: boolean; data?: string; error?: string }>;
  deleteCVFile: (
    fileName: string
  ) => Promise<{ success: boolean; error?: string }>;
  listCVFiles: () => Promise<{
    success: boolean;
    files: string[];
    error?: string;
  }>;
  openDataFolder: () => Promise<void>;
  openCVFile: (fileName: string) => Promise<{ success: boolean; error?: string }>;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
