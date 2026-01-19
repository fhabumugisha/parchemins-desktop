import { create } from 'zustand';
import { getErrorMessage } from '../lib/error';

interface AppInfo {
  version: string;
  name: string;
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

interface SettingsState {
  hasApiKey: boolean;
  isEncryptionAvailable: boolean;
  sermonsFolder: string | null;
  fontSize: 'small' | 'medium' | 'large';
  appInfo: AppInfo | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSettings: () => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  setFontSize: (size: 'small' | 'medium' | 'large') => Promise<void>;
  fetchAppInfo: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  hasApiKey: false,
  isEncryptionAvailable: false,
  sermonsFolder: null,
  fontSize: 'medium',
  appInfo: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await window.electronAPI.settings.getAll();
      set({
        hasApiKey: settings.hasApiKey,
        isEncryptionAvailable: settings.isEncryptionAvailable,
        sermonsFolder: settings.sermons_folder || null,
        fontSize: (settings.font_size as 'small' | 'medium' | 'large') || 'medium',
        isLoading: false,
      });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  saveApiKey: async (apiKey) => {
    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.settings.saveApiKey(apiKey);
      set({ hasApiKey: true, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
      throw error;
    }
  },

  deleteApiKey: async () => {
    set({ isLoading: true });
    try {
      await window.electronAPI.settings.deleteApiKey();
      set({ hasApiKey: false, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  setFontSize: async (fontSize) => {
    await window.electronAPI.settings.set('font_size', fontSize);
    set({ fontSize });
  },

  fetchAppInfo: async () => {
    try {
      const appInfo = await window.electronAPI.settings.getAppInfo();
      set({ appInfo });
    } catch (error) {
      console.error('Failed to fetch app info:', error);
    }
  },
}));
