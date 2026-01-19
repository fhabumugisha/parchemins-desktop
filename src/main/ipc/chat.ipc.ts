import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { chat, summarizeDocument, isApiKeyConfigured, testApiKey } from '../services/claude.service';

// Constants for input validation
const MAX_MESSAGE_LENGTH = 50000;
const MAX_HISTORY_LENGTH = 100;

export function registerChatHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.CHAT_SEND,
    async (_, message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>, referencedDocumentIds?: number[]) => {
      // Input validation
      if (!message || typeof message !== 'string') {
        throw new Error('Message invalide');
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(`Message trop long (max ${MAX_MESSAGE_LENGTH} caractères)`);
      }
      if (history && history.length > MAX_HISTORY_LENGTH) {
        throw new Error(`Historique trop long (max ${MAX_HISTORY_LENGTH} messages)`);
      }

      if (!isApiKeyConfigured()) {
        throw new Error('Cle API non configuree');
      }

      return await chat({
        message,
        conversationHistory: history,
        referencedDocumentIds,
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
