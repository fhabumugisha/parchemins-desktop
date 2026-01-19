import { ipcMain, app, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  getSetting,
  setSetting,
  getAllSettings,
  getCredits,
  updateCredits,
  setCredits,
} from '../services/database.service';
import {
  storeApiKey,
  hasApiKey,
  deleteApiKey,
  isEncryptionAvailable,
  canStoreApiKey,
} from '../services/secure-storage.service';
import { resetClaudeClient, testApiKey } from '../services/claude.service';
import { messages } from '../../shared/messages';

export function registerSettingsHandlers(): void {
  // Get single setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_, key: string) => {
    return getSetting(key);
  });

  // Set single setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, key: string, value: string) => {
    setSetting(key, value);
    return { success: true };
  });

  // Get all settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    const settings = getAllSettings();
    return {
      ...settings,
      hasApiKey: hasApiKey(),
      isEncryptionAvailable: isEncryptionAvailable(),
    };
  });

  // Save API key securely
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SAVE_API_KEY, async (_, apiKey: string) => {
    // Check if secure storage is available
    if (!canStoreApiKey()) {
      throw new Error(messages.errors.encryptionUnavailable);
    }

    // Test the key first
    const isValid = await testApiKey(apiKey);
    if (!isValid) {
      throw new Error(messages.errors.apiKeyInvalid);
    }

    storeApiKey(apiKey);
    resetClaudeClient();
    return { success: true };
  });

  // Delete API key
  ipcMain.handle(IPC_CHANNELS.SETTINGS_DELETE_API_KEY, () => {
    deleteApiKey();
    resetClaudeClient();
    return { success: true };
  });

  // Check if API key exists
  ipcMain.handle(IPC_CHANNELS.SETTINGS_HAS_API_KEY, () => {
    return hasApiKey();
  });

  // Get app info
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_APP_INFO, () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
    };
  });

  // Get credits balance
  ipcMain.handle(IPC_CHANNELS.CREDITS_GET, () => {
    return getCredits();
  });

  // Purchase credits (placeholder - will integrate with payment later)
  ipcMain.handle(IPC_CHANNELS.CREDITS_PURCHASE, (_, amount: number) => {
    const newBalance = updateCredits(amount);
    return { success: true, balance: newBalance };
  });

  // Reset credits to initial value (100)
  ipcMain.handle(IPC_CHANNELS.CREDITS_RESET, () => {
    const initialCredits = 100;
    setCredits(initialCredits);
    return { success: true, balance: initialCredits };
  });

  // Open external URL in default browser
  ipcMain.handle(IPC_CHANNELS.SETTINGS_OPEN_EXTERNAL, async (_, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });
}
