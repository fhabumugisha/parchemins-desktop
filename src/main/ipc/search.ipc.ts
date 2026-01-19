import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import {
  searchDocuments,
  searchByBibleRef,
  searchDocumentsSemantic,
  searchDocumentsHybrid,
  getEmbeddingStats,
} from '../services/database.service';
import { generateEmbedding, initializeEmbeddings } from '../services/embedding.service';
import { indexMissingEmbeddings } from '../services/indexer.service';

// Constants for input validation
const MAX_QUERY_LENGTH = 1000;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export function registerSearchHandlers(): void {
  // Full-text search (FTS5)
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

  // Semantic search (vector embeddings)
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_SEMANTIC,
    async (_, query: string, options?: { limit?: number }) => {
      // Input validation
      if (!query || typeof query !== 'string') {
        return [];
      }
      if (query.length > MAX_QUERY_LENGTH) {
        throw new Error(`Requête trop longue (max ${MAX_QUERY_LENGTH} caractères)`);
      }

      const limit = Math.min(
        Math.max(options?.limit ?? 10, MIN_LIMIT),
        MAX_LIMIT
      );

      // Initialize embeddings if needed and generate query embedding
      await initializeEmbeddings();
      const queryEmbedding = await generateEmbedding(query);

      return searchDocumentsSemantic(queryEmbedding, limit);
    }
  );

  // Hybrid search (FTS5 + vector)
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_HYBRID,
    async (_, query: string, options?: { limit?: number }) => {
      // Input validation
      if (!query || typeof query !== 'string') {
        return [];
      }
      if (query.length > MAX_QUERY_LENGTH) {
        throw new Error(`Requête trop longue (max ${MAX_QUERY_LENGTH} caractères)`);
      }

      const limit = Math.min(
        Math.max(options?.limit ?? 10, MIN_LIMIT),
        MAX_LIMIT
      );

      // Run FTS5 search
      const ftsResults = searchDocuments(query, limit);

      // Initialize embeddings and run semantic search
      await initializeEmbeddings();
      const queryEmbedding = await generateEmbedding(query);
      const vectorResults = searchDocumentsSemantic(queryEmbedding, limit);

      // Merge and rank results
      return searchDocumentsHybrid(ftsResults, vectorResults, limit);
    }
  );

  // Index missing embeddings
  ipcMain.handle(IPC_CHANNELS.EMBEDDINGS_INDEX_MISSING, async () => {
    return indexMissingEmbeddings();
  });

  // Get embedding stats
  ipcMain.handle(IPC_CHANNELS.EMBEDDINGS_GET_STATS, () => {
    return getEmbeddingStats();
  });
}
