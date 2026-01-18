import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  getCorpusStats,
  setSetting,
  getSetting,
} from '../services/database.service';
import { startWatcher } from '../services/watcher.service';
import { forceReindexFolder, cancelIndexing } from '../services/indexer.service';
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

  // Force re-index all documents
  ipcMain.handle(IPC_CHANNELS.INDEXER_FORCE_REINDEX, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const folderPath = getSetting('sermons_folder');

    if (!folderPath) {
      return { added: 0, updated: 0, removed: 0, errors: ['No folder configured'] };
    }

    // Progress callback
    const onProgress = (progress: IndexingProgress) => {
      window?.webContents.send(IPC_CHANNELS.INDEXER_PROGRESS, progress);
    };

    const result = await forceReindexFolder(folderPath, onProgress);
    return result;
  });

  // Cancel indexing
  ipcMain.handle(IPC_CHANNELS.INDEXER_CANCEL, () => {
    return cancelIndexing();
  });
}

// Export helper functions for main process use
export { getCorpusStats };
