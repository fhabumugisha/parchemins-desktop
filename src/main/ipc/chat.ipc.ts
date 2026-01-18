import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { chat, summarizeDocument, isApiKeyConfigured, testApiKey } from '../services/claude.service';

export function registerChatHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (_, message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) => {
      if (!isApiKeyConfigured()) {
        throw new Error('Cle API non configuree');
      }

      return await chat({
        message,
        conversationHistory: history,
      });
    }
  );

  ipcMain.handle(IPC_CHANNELS.CHAT_SUMMARIZE, async (_, documentId: number) => {
    if (!isApiKeyConfigured()) {
      throw new Error('Cle API non configuree');
    }

    return await summarizeDocument(documentId);
  });

  ipcMain.handle(IPC_CHANNELS.CHAT_TEST_API_KEY, async (_, apiKey: string) => {
    return await testApiKey(apiKey);
  });

  ipcMain.handle(IPC_CHANNELS.CHAT_IS_CONFIGURED, async () => {
    return isApiKeyConfigured();
  });
}
