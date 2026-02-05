const { contextBridge, ipcRenderer } = require('electron');

// Bezpieczne API dostępne w rendererze przez window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // Ścieżka do folderu danych
  getDataPath: () => ipcRenderer.invoke('get-data-path'),

  // Dane aplikacji (JSON)
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),

  // Pliki CV
  saveCVFile: (fileName, fileData) =>
    ipcRenderer.invoke('save-cv-file', { fileName, fileData }),
  loadCVFile: (fileName) => ipcRenderer.invoke('load-cv-file', fileName),
  deleteCVFile: (fileName) => ipcRenderer.invoke('delete-cv-file', fileName),
  listCVFiles: () => ipcRenderer.invoke('list-cv-files'),

  // Otwórz folder w Finderze
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),

  // Otwórz plik CV w domyślnej aplikacji
  openCVFile: (fileName) => ipcRenderer.invoke('open-cv-file', fileName),

  // Sprawdź czy jesteśmy w Electron
  isElectron: true,
});
