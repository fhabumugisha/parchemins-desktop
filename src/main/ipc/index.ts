import { logger } from '../utils/logger';
import { registerDocumentsHandlers } from './documents.ipc';
import { registerSearchHandlers } from './search.ipc';
import { registerSettingsHandlers } from './settings.ipc';
import { registerChatHandlers } from './chat.ipc';

export function registerIpcHandlers(): void {
  registerDocumentsHandlers();
  registerSearchHandlers();
  registerSettingsHandlers();
  registerChatHandlers();

  logger.info('IPC handlers registered');
}
