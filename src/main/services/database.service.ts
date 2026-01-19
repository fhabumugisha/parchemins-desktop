import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import * as sqliteVec from 'sqlite-vec';
import type { Document, Conversation, Message } from '../../shared/types';
import { getEmbeddingDimensions } from './embedding.service';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), 'sermons.db');

  db = new Database(dbPath);

  // Load sqlite-vec extension for vector search
  sqliteVec.load(db);

  // Performance optimizations
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  createTables();

  console.log('Database initialized at:', dbPath);
}

function createTables(): void {
  getDb().exec(`
    -- Documents table
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT,
      bible_ref TEXT,
      word_count INTEGER DEFAULT 0,
      hash TEXT NOT NULL,
      indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- FTS5 virtual table for full-text search
    CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
      title,
      content,
      bible_ref,
      content='documents',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 2'
    );

    -- Triggers to keep FTS5 synchronized with documents table
    CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, title, content, bible_ref)
      VALUES (new.id, new.title, new.content, new.bible_ref);
    END;

    CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content, bible_ref)
      VALUES ('delete', old.id, old.title, old.content, old.bible_ref);
    END;

    CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
      INSERT INTO documents_fts(documents_fts, rowid, title, content, bible_ref)
      VALUES ('delete', old.id, old.title, old.content, old.bible_ref);
      INSERT INTO documents_fts(rowid, title, content, bible_ref)
      VALUES (new.id, new.title, new.content, new.bible_ref);
    END;

    -- Conversations table
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );

    -- Settings table (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Credits table (single row)
    CREATE TABLE IF NOT EXISTS credits (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      balance INTEGER DEFAULT 100,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Initialize credits if not exists
    INSERT OR IGNORE INTO credits (id, balance) VALUES (1, 100);

    -- Usage logs table (tracking API costs)
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
    CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);

    -- Table for storing document embeddings
    CREATE TABLE IF NOT EXISTS document_embeddings (
      document_id INTEGER PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
      embedding BLOB NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create vec0 virtual table for vector search (if not exists)
  // vec0 virtual tables need to be created separately
  const dimensions = getEmbeddingDimensions();
  try {
    getDb().exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS documents_vec USING vec0(
        embedding float[${dimensions}]
      );
    `);
  } catch (error) {
    // Table might already exist with different schema, ignore
    console.log('[Database] documents_vec table setup:', error);
  }
}

// ============ DOCUMENTS ============

export function getAllDocuments(): Document[] {
  return getDb()
    .prepare('SELECT * FROM documents ORDER BY date DESC, title ASC')
    .all() as Document[];
}

export function getRecentDocuments(limit: number): Document[] {
  return getDb()
    .prepare('SELECT * FROM documents ORDER BY date DESC, title ASC LIMIT ?')
    .all(limit) as Document[];
}

export function getDocumentById(id: number): Document | undefined {
  return getDb()
    .prepare('SELECT * FROM documents WHERE id = ?')
    .get(id) as Document | undefined;
}

export function getDocumentByPath(filePath: string): Document | undefined {
  return getDb()
    .prepare('SELECT * FROM documents WHERE path = ?')
    .get(filePath) as Document | undefined;
}

export function insertDocument(doc: Omit<Document, 'id' | 'indexed_at' | 'updated_at'>): number {
  const result = getDb()
    .prepare(`
      INSERT INTO documents (path, title, content, date, bible_ref, word_count, hash)
      VALUES (@path, @title, @content, @date, @bible_ref, @word_count, @hash)
    `)
    .run(doc);
  return result.lastInsertRowid as number;
}

// Whitelist of allowed columns for dynamic updates
const DOCUMENT_UPDATE_COLUMNS = new Set([
  'path', 'title', 'content', 'date', 'bible_ref', 'word_count', 'hash'
]);

export function updateDocument(id: number, doc: Partial<Document>): void {
  // Filter to only allowed columns
  const fields = Object.keys(doc)
    .filter(k => DOCUMENT_UPDATE_COLUMNS.has(k))
    .map(k => `${k} = @${k}`)
    .join(', ');

  if (fields.length === 0) return;

  getDb()
    .prepare(`UPDATE documents SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`)
    .run({ ...doc, id });
}

export function deleteDocument(id: number): void {
  getDb().prepare('DELETE FROM documents WHERE id = ?').run(id);
}

export function getDocumentCount(): number {
  const result = getDb()
    .prepare('SELECT COUNT(*) as count FROM documents')
    .get() as { count: number };
  return result.count;
}

export function getCorpusStats(): {
  totalDocuments: number;
  totalWords: number;
  oldestDate: string | null;
  newestDate: string | null;
} {
  const result = getDb()
    .prepare(`
      SELECT
        COUNT(*) as totalDocuments,
        COALESCE(SUM(word_count), 0) as totalWords,
        MIN(date) as oldestDate,
        MAX(date) as newestDate
      FROM documents
    `)
    .get() as {
      totalDocuments: number;
      totalWords: number;
      oldestDate: string | null;
      newestDate: string | null;
    };
  return result;
}

// ============ SEARCH ============

// French stopwords to filter from search queries
const FRENCH_STOPWORDS = new Set([
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'l',
  // Prepositions
  'à', 'a', 'au', 'aux', 'avec', 'dans', 'en', 'par', 'pour', 'sur', 'sous', 'vers', 'chez',
  // Pronouns
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'lui', 'leur', 'moi', 'toi', 'soi',
  'ce', 'cet', 'cette', 'ces', 'ceci', 'cela', 'ça',
  'qui', 'que', 'quoi', 'dont', 'où',
  // Possessives
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
  // Conjunctions
  'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'si', 'comme', 'quand', 'lorsque',
  // Common verbs
  'est', 'sont', 'suis', 'es', 'sommes', 'êtes', 'être', 'etre',
  'ai', 'as', 'a', 'avons', 'avez', 'ont', 'avoir',
  'fait', 'faire', 'fais', 'faisons', 'faites', 'font',
  // Adverbs & others
  'ne', 'pas', 'plus', 'moins', 'très', 'bien', 'mal', 'tout', 'tous', 'toute', 'toutes',
  'y', 'en', 'là', 'ici', 'alors', 'aussi', 'encore', 'même', 'autre', 'autres',
]);

export function searchDocuments(
  query: string,
  limit = 20
): (Document & { rank: number; snippet: string })[] {
  // Escape special FTS5 characters to prevent syntax errors
  // Include : which FTS5 interprets as column prefix
  const escapedQuery = query
    .replace(/['"]/g, '')
    .replace(/[(){}[\]^~*?:\\:]/g, ' ')
    .trim();

  if (!escapedQuery) return [];

  // Use prefix matching for better results
  // Wrap each term in quotes to prevent FTS5 operator interpretation
  // Filter out French stopwords to improve search relevance
  const searchTerms = escapedQuery
    .split(/\s+/)
    .filter(term => term.length > 1 && !FRENCH_STOPWORDS.has(term.toLowerCase()))
    .map(term => `"${term}"*`)
    .join(' ');

  // If all terms were filtered out, return empty results
  if (!searchTerms) return [];

  return getDb()
    .prepare(`
      SELECT
        d.*,
        bm25(documents_fts) AS rank,
        snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) AS snippet
      FROM documents_fts
      JOIN documents d ON d.id = documents_fts.rowid
      WHERE documents_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `)
    .all(searchTerms, limit) as (Document & { rank: number; snippet: string })[];
}

export function searchByBibleRef(ref: string): Document[] {
  // Escape LIKE wildcards to prevent SQL injection
  const escapedRef = ref.replace(/[%_\\]/g, '\\$&');
  return getDb()
    .prepare('SELECT * FROM documents WHERE bible_ref LIKE ? ESCAPE \'\\\' ORDER BY date DESC')
    .all(`%${escapedRef}%`) as Document[];
}

// ============ VECTOR SEARCH ============

export function indexDocumentEmbedding(documentId: number, embedding: Float32Array): void {
  const embeddingBlob = Buffer.from(embedding.buffer);

  // Store embedding in document_embeddings table
  getDb()
    .prepare(`
      INSERT OR REPLACE INTO document_embeddings (document_id, embedding)
      VALUES (?, ?)
    `)
    .run(documentId, embeddingBlob);

  // Check if document already exists in vec table
  const existing = getDb()
    .prepare('SELECT rowid FROM documents_vec WHERE rowid = ?')
    .get(documentId);

  if (existing) {
    // Delete and re-insert (vec0 doesn't support UPDATE)
    getDb().prepare('DELETE FROM documents_vec WHERE rowid = ?').run(documentId);
  }

  // Insert into vec0 virtual table
  getDb()
    .prepare('INSERT INTO documents_vec (rowid, embedding) VALUES (?, ?)')
    .run(documentId, embeddingBlob);
}

export function removeDocumentEmbedding(documentId: number): void {
  getDb().prepare('DELETE FROM document_embeddings WHERE document_id = ?').run(documentId);
  getDb().prepare('DELETE FROM documents_vec WHERE rowid = ?').run(documentId);
}

export function hasDocumentEmbedding(documentId: number): boolean {
  const result = getDb()
    .prepare('SELECT 1 FROM document_embeddings WHERE document_id = ?')
    .get(documentId);
  return !!result;
}

export function getDocumentsWithoutEmbeddings(): Document[] {
  return getDb()
    .prepare(`
      SELECT d.* FROM documents d
      LEFT JOIN document_embeddings de ON d.id = de.document_id
      WHERE de.document_id IS NULL
    `)
    .all() as Document[];
}

export function searchDocumentsSemantic(
  queryEmbedding: Float32Array,
  limit = 10
): (Document & { distance: number })[] {
  const embeddingBlob = Buffer.from(queryEmbedding.buffer);

  return getDb()
    .prepare(`
      SELECT
        d.*,
        vec_distance_cosine(dv.embedding, ?) as distance
      FROM documents_vec dv
      JOIN documents d ON d.id = dv.rowid
      ORDER BY distance ASC
      LIMIT ?
    `)
    .all(embeddingBlob, limit) as (Document & { distance: number })[];
}

export type SearchResultHybrid = Document & {
  score: number;
  matchType: 'exact' | 'semantic' | 'both';
  snippet?: string;
};

export function searchDocumentsHybrid(
  ftsResults: (Document & { rank: number; snippet: string })[],
  vectorResults: (Document & { distance: number })[],
  limit = 10
): SearchResultHybrid[] {
  const ftsIds = new Set(ftsResults.map(r => r.id));
  const vectorIds = new Set(vectorResults.map(r => r.id));

  const merged = new Map<number, SearchResultHybrid>();

  // Add FTS results with high score (exact matches)
  ftsResults.forEach((doc, i) => {
    const score = 1 - (i / Math.max(ftsResults.length, 1)) * 0.5; // Score 1.0 -> 0.5
    merged.set(doc.id, {
      ...doc,
      score: vectorIds.has(doc.id) ? score + 0.5 : score, // Boost if found in both
      matchType: vectorIds.has(doc.id) ? 'both' : 'exact',
      snippet: doc.snippet,
    });
  });

  // Add vector results not present in FTS
  vectorResults.forEach((doc, i) => {
    if (!merged.has(doc.id)) {
      const similarity = 1 - doc.distance; // Convert distance to similarity
      const score = similarity * 0.5; // Semantic-only results get lower base score
      merged.set(doc.id, {
        ...doc,
        score,
        matchType: 'semantic',
      });
    }
  });

  // Sort by score and return top results
  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getEmbeddingStats(): { total: number; indexed: number } {
  const total = getDb()
    .prepare('SELECT COUNT(*) as count FROM documents')
    .get() as { count: number };
  const indexed = getDb()
    .prepare('SELECT COUNT(*) as count FROM document_embeddings')
    .get() as { count: number };
  return { total: total.count, indexed: indexed.count };
}

// ============ CONVERSATIONS ============

export function createConversation(title?: string): number {
  const result = getDb()
    .prepare('INSERT INTO conversations (title) VALUES (?)')
    .run(title || null);
  return result.lastInsertRowid as number;
}

export function getConversation(id: number): Conversation | undefined {
  return getDb()
    .prepare('SELECT * FROM conversations WHERE id = ?')
    .get(id) as Conversation | undefined;
}

export function getAllConversations(): Conversation[] {
  return getDb()
    .prepare('SELECT * FROM conversations ORDER BY updated_at DESC')
    .all() as Conversation[];
}

export function getConversationMessages(conversationId: number): Message[] {
  return getDb()
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conversationId) as Message[];
}

export function addMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string,
  tokensUsed = 0
): number {
  const result = getDb()
    .prepare(`
      INSERT INTO messages (conversation_id, role, content, tokens_used)
      VALUES (?, ?, ?, ?)
    `)
    .run(conversationId, role, content, tokensUsed);

  // Update conversation timestamp
  getDb()
    .prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(conversationId);

  return result.lastInsertRowid as number;
}

export function updateConversationTitle(id: number, title: string): void {
  getDb()
    .prepare('UPDATE conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title, id);
}

export function deleteConversation(id: number): void {
  getDb().prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

// ============ CREDITS ============

export function getCredits(): number {
  const result = getDb()
    .prepare('SELECT balance FROM credits WHERE id = 1')
    .get() as { balance: number } | undefined;
  return result?.balance ?? 0;
}

export function updateCredits(delta: number): number {
  // Use transaction for atomic read-after-write
  const updateAndGet = getDb().transaction(() => {
    getDb()
      .prepare('UPDATE credits SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
      .run(delta);
    const result = getDb()
      .prepare('SELECT balance FROM credits WHERE id = 1')
      .get() as { balance: number } | undefined;
    return result?.balance ?? 0;
  });
  return updateAndGet();
}

export function setCredits(amount: number): void {
  getDb()
    .prepare('UPDATE credits SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1')
    .run(amount);
}

// ============ SETTINGS ============

export function getSetting(key: string): string | undefined {
  const result = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: string } | undefined;
  return result?.value;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb()
    .prepare('SELECT key, value FROM settings')
    .all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export function deleteSetting(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key);
}

// ============ USAGE TRACKING ============

// Anthropic pricing (USD per million tokens)
const ANTHROPIC_PRICING = {
  input: 3,    // $3 per million input tokens
  output: 15,  // $15 per million output tokens
};

export interface UsageLog {
  id: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

export interface UsageStats {
  totalQuestions: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  avgCostPerQuestion: number;
}

export function logUsage(inputTokens: number, outputTokens: number): void {
  const inputCost = (inputTokens / 1_000_000) * ANTHROPIC_PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * ANTHROPIC_PRICING.output;
  const totalCost = inputCost + outputCost;

  getDb()
    .prepare('INSERT INTO usage_logs (input_tokens, output_tokens, cost_usd) VALUES (?, ?, ?)')
    .run(inputTokens, outputTokens, totalCost);

  // Wrap console.log to avoid EPIPE errors when stdout pipe is closed
  try {
    console.log(
      `[Usage] in: ${inputTokens}, out: ${outputTokens}, cost: $${totalCost.toFixed(4)}`
    );
  } catch {
    // Ignore EPIPE errors
  }
}

export function getUsageStats(days = 30): UsageStats {
  const result = getDb()
    .prepare(`
      SELECT
        COUNT(*) as totalQuestions,
        COALESCE(SUM(input_tokens), 0) as totalInputTokens,
        COALESCE(SUM(output_tokens), 0) as totalOutputTokens,
        COALESCE(SUM(cost_usd), 0) as totalCostUsd
      FROM usage_logs
      WHERE created_at > datetime('now', '-' || ? || ' days')
    `)
    .get(days) as {
      totalQuestions: number;
      totalInputTokens: number;
      totalOutputTokens: number;
      totalCostUsd: number;
    };

  return {
    ...result,
    avgCostPerQuestion: result.totalQuestions > 0
      ? result.totalCostUsd / result.totalQuestions
      : 0,
  };
}

export function getUsageStatsByMonth(): Array<{
  month: string;
  questions: number;
  cost_usd: number;
}> {
  return getDb()
    .prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as questions,
        SUM(cost_usd) as cost_usd
      FROM usage_logs
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 12
    `)
    .all() as Array<{ month: string; questions: number; cost_usd: number }>;
}

export function getTodayUsage(): { questions: number; cost_usd: number } {
  const result = getDb()
    .prepare(`
      SELECT
        COUNT(*) as questions,
        COALESCE(SUM(cost_usd), 0) as cost_usd
      FROM usage_logs
      WHERE date(created_at) = date('now')
    `)
    .get() as { questions: number; cost_usd: number };
  return result;
}

// ============ CLEANUP ============

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
