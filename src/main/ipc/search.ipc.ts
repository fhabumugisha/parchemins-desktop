import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { searchDocuments, searchByBibleRef } from '../services/database.service';

export function registerSearchHandlers(): void {
  // Full-text search
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_QUERY,
    (_, query: string, options?: { limit?: number; bibleRefOnly?: boolean }) => {
      if (options?.bibleRefOnly) {
        return searchByBibleRef(query);
      }

      return searchDocuments(query, options?.limit ?? 20);
    }
  );
}
