import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import type { Document, Conversation, Message } from '../../shared/types';

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

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
    CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  `);
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
  const searchTerms = escapedQuery
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => `"${term}"*`)
    .join(' ');

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

// ============ CLEANUP ============

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
