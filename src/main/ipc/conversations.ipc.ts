import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  createConversation,
  getAllConversations,
  getConversation,
  deleteConversation,
  updateConversationTitle,
  addMessage,
  getConversationMessages,
} from '../services/database.service';

export function registerConversationsHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_CREATE, async (_, title?: string) => {
    return createConversation(title);
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_GET_ALL, async () => {
    return getAllConversations();
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_GET_BY_ID, async (_, id: number) => {
    return getConversation(id);
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_DELETE, async (_, id: number) => {
    deleteConversation(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_UPDATE_TITLE, async (_, id: number, title: string) => {
    updateConversationTitle(id, title);
    return true;
  });

  ipcMain.handle(
    IPC_CHANNELS.CONVERSATIONS_ADD_MESSAGE,
    async (_, conversationId: number, role: 'user' | 'assistant', content: string, tokensUsed?: number) => {
      return addMessage(conversationId, role, content, tokensUsed || 0);
    }
  );

  ipcMain.handle(IPC_CHANNELS.CONVERSATIONS_GET_MESSAGES, async (_, conversationId: number) => {
    return getConversationMessages(conversationId);
  });
}
