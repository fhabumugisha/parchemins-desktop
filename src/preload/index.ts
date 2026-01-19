import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type { IndexingProgress, ChatResponse, Settings, Document, IndexingResult } from '../shared/types';

const electronAPI = {
  documents: {
    getAll: (): Promise<Document[]> => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_GET_ALL),
    getById: (id: number): Promise<Document | null> => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_GET_BY_ID, id),
    delete: (id: number): Promise<{ success: boolean }> => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_DELETE, id),
    openExternal: (id: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.DOCUMENTS_OPEN_EXTERNAL, id),
  },

  indexer: {
    selectFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC_CHANNELS.INDEXER_SELECT_FOLDER),
    indexFolder: (folderPath: string): Promise<IndexingResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.INDEXER_INDEX_FOLDER, folderPath),
    forceReindex: (): Promise<IndexingResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.INDEXER_FORCE_REINDEX),
    cancel: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.INDEXER_CANCEL),
    onProgress: (callback: (progress: IndexingProgress) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: IndexingProgress) => callback(progress);
      ipcRenderer.on(IPC_CHANNELS.INDEXER_PROGRESS, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.INDEXER_PROGRESS, handler);
    },
  },

  search: {
    query: (query: string): Promise<Document[]> => ipcRenderer.invoke(IPC_CHANNELS.SEARCH_QUERY, query),
  },

  chat: {
    send: (
      message: string,
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<ChatResponse> => ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND, message, history),
    summarize: (documentId: number): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.CHAT_SUMMARIZE, documentId),
    testApiKey: (apiKey: string): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.CHAT_TEST_API_KEY, apiKey),
    isConfigured: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.CHAT_IS_CONFIGURED),
  },

  credits: {
    get: (): Promise<number> => ipcRenderer.invoke(IPC_CHANNELS.CREDITS_GET),
    purchase: (amount: number): Promise<number> => ipcRenderer.invoke(IPC_CHANNELS.CREDITS_PURCHASE, amount),
  },

  settings: {
    get: (key: string): Promise<string | undefined> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: string): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
    getAll: (): Promise<Settings & { hasApiKey: boolean; isEncryptionAvailable: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
    saveApiKey: (apiKey: string): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SAVE_API_KEY, apiKey),
    deleteApiKey: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_DELETE_API_KEY),
    hasApiKey: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_HAS_API_KEY),
    getAppInfo: (): Promise<{
      version: string;
      name: string;
      electronVersion: string;
      chromeVersion: string;
      nodeVersion: string;
    }> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_APP_INFO),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
