import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { searchDocuments, searchByBibleRef } from '../services/database.service';

// Constants for input validation
const MAX_QUERY_LENGTH = 1000;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export function registerSearchHandlers(): void {
  // Full-text search
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_QUERY,
    (_, query: string, options?: { limit?: number; bibleRefOnly?: boolean }) => {
      // Input validation
      if (!query || typeof query !== 'string') {
        return [];
      }
      if (query.length > MAX_QUERY_LENGTH) {
        throw new Error(`Requête trop longue (max ${MAX_QUERY_LENGTH} caractères)`);
      }

      // Validate and clamp limit
      const limit = Math.min(
        Math.max(options?.limit ?? 20, MIN_LIMIT),
        MAX_LIMIT
      );

      if (options?.bibleRefOnly) {
        return searchByBibleRef(query);
      }

      return searchDocuments(query, limit);
    }
  );
}
