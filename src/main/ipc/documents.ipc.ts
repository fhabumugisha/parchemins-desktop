import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  getCorpusStats,
  setSetting,
} from '../services/database.service';
import { startWatcher } from '../services/watcher.service';
import type { IndexingProgress } from '../../shared/types';

export function registerDocumentsHandlers(): void {
  // Get all documents
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_GET_ALL, () => {
    return getAllDocuments();
  });

  // Get document by ID
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_GET_BY_ID, (_, id: number) => {
    return getDocumentById(id);
  });

  // Delete document
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_DELETE, (_, id: number) => {
    deleteDocument(id);
    return { success: true };
  });

  // Open document in external app
  ipcMain.handle(IPC_CHANNELS.DOCUMENTS_OPEN_EXTERNAL, async (_, filePath: string) => {
    try {
      await shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Select folder for indexation
  ipcMain.handle(IPC_CHANNELS.INDEXER_SELECT_FOLDER, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Sélectionner le dossier des sermons',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Index folder
  ipcMain.handle(IPC_CHANNELS.INDEXER_INDEX_FOLDER, async (event, folderPath: string) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    // Save the folder path in settings
    setSetting('sermons_folder', folderPath);

    // Progress callback
    const onProgress = (progress: IndexingProgress) => {
      window?.webContents.send(IPC_CHANNELS.INDEXER_PROGRESS, progress);
    };

    // Start watcher (which does initial indexation)
    const result = await startWatcher(folderPath, onProgress);

    return result;
  });
}

// Export helper functions for main process use
export { getCorpusStats };
