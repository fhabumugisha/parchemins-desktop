import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';
import { registerIpcHandlers } from './ipc';
import { logger } from './utils/logger';
import { initDatabase, closeDatabase } from './services/database.service';
import { initWatcher, stopWatcher } from './services/watcher.service';
import { migratePlaintextKey } from './services/secure-storage.service';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Store reference for later use (e.g., IPC handlers in subsequent tasks)
let _mainWindow: BrowserWindow | null = null;

async function bootstrap(): Promise<void> {
  logger.info('Starting Parchemins...');

  // Initialize database first
  await initDatabase();

  // Migrate any plaintext API keys to secure storage
  const wasMigrated = migratePlaintextKey();
  if (wasMigrated) {
    logger.info('Plaintext API key removed for security. User will need to re-enter key.');
  }

  // Register IPC handlers (after database is ready)
  registerIpcHandlers();

  // Create main window
  _mainWindow = createWindow();

  // Initialize watcher (auto-starts if folder is configured)
  await initWatcher();

  logger.info('Application started successfully');
}

async function cleanup(): Promise<void> {
  logger.info('Cleaning up...');
  await stopWatcher();
  closeDatabase();
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await cleanup();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    _mainWindow = createWindow();
  }
});
