const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Folder na dane aplikacji w Documents
const DATA_FOLDER = path.join(app.getPath('documents'), 'JobOdyssey');
const CV_FOLDER = path.join(DATA_FOLDER, 'cv-files');
const DATA_FILE = path.join(DATA_FOLDER, 'data.json');

// Upewnij się że foldery istnieją
function ensureFolders() {
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER, { recursive: true });
  }
  if (!fs.existsSync(CV_FOLDER)) {
    fs.mkdirSync(CV_FOLDER, { recursive: true });
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    titleBarStyle: 'hiddenInset', // Ładniejszy wygląd na macOS
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Otwieraj wszystkie linki zewnętrzne (target="_blank") w domyślnej przeglądarce systemowej
  const { shell } = require('electron');
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // W trybie dev ładuj z Vite, w produkcji z buildu
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // W spakowanej aplikacji (asar) ścieżka jest względna do __dirname
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ensureFolders();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============ IPC Handlers - API dla renderera ============

// Pobierz ścieżkę do folderu danych
ipcMain.handle('get-data-path', () => {
  return DATA_FOLDER;
});

// Wczytaj dane aplikacji
ipcMain.handle('load-data', () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
});

// Zapisz dane aplikacji
ipcMain.handle('save-data', (event, data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: error.message };
  }
});

// Zapisz plik CV
ipcMain.handle('save-cv-file', (event, { fileName, fileData }) => {
  try {
    const filePath = path.join(CV_FOLDER, fileName);
    // fileData to data URL (data:application/pdf;base64,xxxxx)
    // Musimy wyciągnąć czysty base64
    const base64Data = fileData.includes(',')
      ? fileData.split(',')[1]
      : fileData;
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving CV file:', error);
    return { success: false, error: error.message };
  }
});

// Wczytaj plik CV
ipcMain.handle('load-cv-file', (event, fileName) => {
  try {
    const filePath = path.join(CV_FOLDER, fileName);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      // Określ MIME type na podstawie rozszerzenia
      const ext = path.extname(fileName).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.doc') mimeType = 'application/msword';
      else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      // Zwróć jako data URL
      return { success: true, data: `data:${mimeType};base64,${base64}` };
    }
    return { success: false, error: 'File not found' };
  } catch (error) {
    console.error('Error loading CV file:', error);
    return { success: false, error: error.message };
  }
});

// Usuń plik CV
ipcMain.handle('delete-cv-file', (event, fileName) => {
  try {
    const filePath = path.join(CV_FOLDER, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting CV file:', error);
    return { success: false, error: error.message };
  }
});

// Lista plików CV
ipcMain.handle('list-cv-files', () => {
  try {
    if (fs.existsSync(CV_FOLDER)) {
      const files = fs.readdirSync(CV_FOLDER);
      return { success: true, files };
    }
    return { success: true, files: [] };
  } catch (error) {
    console.error('Error listing CV files:', error);
    return { success: false, error: error.message, files: [] };
  }
});

// Otwórz folder z danymi w Finderze
ipcMain.handle('open-data-folder', () => {
  const { shell } = require('electron');
  shell.openPath(DATA_FOLDER);
});

// Otwórz plik CV w domyślnej aplikacji systemowej
ipcMain.handle('open-cv-file', (event, fileName) => {
  const { shell } = require('electron');
  const filePath = path.join(CV_FOLDER, fileName);
  if (fs.existsSync(filePath)) {
    shell.openPath(filePath);
    return { success: true };
  }
  return { success: false, error: 'File not found' };
});
