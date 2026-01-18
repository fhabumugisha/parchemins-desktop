import { ipcMain, app } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  getSetting,
  setSetting,
  getAllSettings,
  getCredits,
  updateCredits,
} from '../services/database.service';
import {
  storeApiKey,
  hasApiKey,
  deleteApiKey,
  isEncryptionAvailable,
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
  ipcMain.handle('settings:saveApiKey', async (_, apiKey: string) => {
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
  ipcMain.handle('settings:deleteApiKey', () => {
    deleteApiKey();
    resetClaudeClient();
    return { success: true };
  });

  // Check if API key exists
  ipcMain.handle('settings:hasApiKey', () => {
    return hasApiKey();
  });

  // Get app info
  ipcMain.handle('settings:getAppInfo', () => {
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
}
