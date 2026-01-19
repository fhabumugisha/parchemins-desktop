---
name: sqlite-best-practices
description: SQLite coding best practices for clean, secure, resilient, maintainable, and readable code. Use when writing SQLite queries, reviewing database code, setting up SQLite databases, or working with better-sqlite3 in Node.js/Electron.
---

# SQLite Best Practices

Apply these patterns when writing or reviewing SQLite code.

## Clean Code

### Repository Pattern

Encapsulate database access in dedicated service classes:

```typescript
// Good: Dedicated service with clear responsibility
class DocumentRepository {
  constructor(private db: Database) {}

  findById(id: number): Document | undefined {
    return this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  }

  findByReference(bibleRef: string): Document[] {
    return this.db.prepare(
      'SELECT * FROM documents WHERE bible_ref = ?'
    ).all(bibleRef);
  }
}

// Bad: SQL scattered throughout application
function handleRequest(req) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.id);
  // ...
}
```

### Naming Conventions

- **Tables**: lowercase, plural, snake_case (`documents`, `user_settings`)
- **Columns**: lowercase, snake_case (`created_at`, `word_count`)
- **Indexes**: `idx_{table}_{column}` (`idx_documents_created_at`)
- **FTS tables**: `{table}_fts` (`documents_fts`)

## Secure Code

### Parameterized Queries (CRITICAL)

ALWAYS use parameterized queries. NEVER concatenate user input into SQL.

```typescript
// Good: Parameterized query
const stmt = db.prepare('SELECT * FROM documents WHERE title LIKE ?');
const results = stmt.all(`%${searchTerm}%`);

// Good: Named parameters
const stmt = db.prepare('INSERT INTO documents (title, content) VALUES (@title, @content)');
stmt.run({ title, content });

// BAD: SQL Injection vulnerability
const results = db.prepare(`SELECT * FROM documents WHERE title LIKE '%${searchTerm}%'`).all();
```

### Input Validation

Validate inputs before database operations:

```typescript
function findDocument(id: unknown): Document | undefined {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1) {
    throw new Error('Invalid document ID');
  }
  return this.db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
}
```

### FTS5 Query Escaping

Escape special characters in FTS5 queries:

```typescript
function escapeFts5Query(query: string): string {
  // Escape special FTS5 characters: " * - OR AND NOT ( )
  return query
    .replace(/"/g, '""')
    .replace(/[*\-()]/g, ' ')
    .trim();
}

const safeQuery = escapeFts5Query(userInput);
const results = db.prepare(
  'SELECT * FROM documents_fts WHERE documents_fts MATCH ?'
).all(safeQuery);
```

## Resilient Code

### Transactions

Wrap multiple operations in transactions for atomicity:

```typescript
// Good: Transaction for related operations
const insertDocument = db.transaction((doc: Document) => {
  const info = db.prepare(
    'INSERT INTO documents (title, content, hash) VALUES (?, ?, ?)'
  ).run(doc.title, doc.content, doc.hash);

  db.prepare(
    'INSERT INTO documents_fts (rowid, title, content) VALUES (?, ?, ?)'
  ).run(info.lastInsertRowid, doc.title, doc.content);

  return info.lastInsertRowid;
});

// Usage: automatically commits or rolls back
const id = insertDocument(document);
```

### WAL Mode

Enable Write-Ahead Logging for better concurrency:

```typescript
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');  // Safe with WAL
db.pragma('foreign_keys = ON');
```

### Error Handling

Handle database errors gracefully:

```typescript
try {
  const result = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
  return result ?? null;
} catch (error) {
  if (error.code === 'SQLITE_BUSY') {
    // Retry logic for busy database
    return this.retryOperation(() => this.findById(id));
  }
  throw new DatabaseError('Failed to fetch document', { cause: error });
}
```

### Graceful Shutdown

Close database connections properly:

```typescript
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
```

## Maintainable Code

### Schema Migrations

Use versioned migrations:

```typescript
const MIGRATIONS = [
  // Version 1: Initial schema
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  // Version 2: Add word_count
  `ALTER TABLE documents ADD COLUMN word_count INTEGER DEFAULT 0`,
  // Version 3: Add FTS
  `CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts
   USING fts5(title, content, content='documents', content_rowid='id')`,
];

function migrate(db: Database): void {
  const version = db.pragma('user_version', { simple: true }) as number;

  for (let i = version; i < MIGRATIONS.length; i++) {
    db.exec(MIGRATIONS[i]);
    db.pragma(`user_version = ${i + 1}`);
  }
}
```

### Typed Queries

Use TypeScript interfaces for query results:

```typescript
interface DocumentRow {
  id: number;
  title: string;
  content: string;
  created_at: string;
  word_count: number;
}

const stmt = db.prepare<[number], DocumentRow>(
  'SELECT * FROM documents WHERE id = ?'
);
const doc: DocumentRow | undefined = stmt.get(id);
```

### Prepared Statement Caching

Cache prepared statements for reuse:

```typescript
class DocumentRepository {
  private statements = {
    findById: this.db.prepare('SELECT * FROM documents WHERE id = ?'),
    findAll: this.db.prepare('SELECT * FROM documents ORDER BY created_at DESC'),
    insert: this.db.prepare('INSERT INTO documents (title, content) VALUES (?, ?)'),
  };

  findById(id: number) {
    return this.statements.findById.get(id);
  }
}
```

## Readable Code

### SQL Formatting

Format SQL for readability:

```typescript
// Good: Multi-line, formatted SQL
const stmt = db.prepare(`
  SELECT
    d.id,
    d.title,
    d.created_at,
    snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) AS snippet
  FROM documents_fts
  JOIN documents d ON documents_fts.rowid = d.id
  WHERE documents_fts MATCH ?
  ORDER BY rank
  LIMIT ?
`);

// Bad: Long single line
const stmt = db.prepare('SELECT d.id, d.title, d.created_at, snippet(documents_fts, 1, \'<mark>\', \'</mark>\', \'...\', 32) AS snippet FROM documents_fts JOIN documents d ON documents_fts.rowid = d.id WHERE documents_fts MATCH ? ORDER BY rank LIMIT ?');
```

### Named Parameters

Use named parameters for clarity:

```typescript
// Good: Named parameters
const stmt = db.prepare(`
  INSERT INTO documents (title, content, path, hash, word_count)
  VALUES (@title, @content, @path, @hash, @wordCount)
`);
stmt.run({ title, content, path, hash, wordCount });

// Less clear: Positional parameters for many values
stmt.run(title, content, path, hash, wordCount);
```

## Performance

### Indexes

Create indexes for frequently queried columns:

```sql
-- Index for common lookups
CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Composite index for filtered sorting
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON documents(doc_type, created_at);
```

### Query Optimization

Use EXPLAIN QUERY PLAN to analyze queries:

```typescript
// Development helper
function explainQuery(sql: string): void {
  const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
  console.log('Query plan:', plan);
}
```

### Batch Operations

Use transactions for bulk inserts:

```typescript
const insertMany = db.transaction((documents: Document[]) => {
  const stmt = db.prepare(
    'INSERT INTO documents (title, content) VALUES (?, ?)'
  );
  for (const doc of documents) {
    stmt.run(doc.title, doc.content);
  }
});

// Much faster than individual inserts
insertMany(documentsArray);
```

### VACUUM and ANALYZE

Maintain database health:

```typescript
// Run periodically (e.g., on app startup or after large deletions)
function optimizeDatabase(db: Database): void {
  db.exec('ANALYZE');  // Update query planner statistics
  db.exec('VACUUM');   // Reclaim space and defragment
}
```

## FTS5 Full-Text Search

### Setup

```sql
-- Create FTS5 table with content sync
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title,
  content,
  content='documents',
  content_rowid='id',
  tokenize='unicode61'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, content)
  VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, content)
  VALUES('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, content)
  VALUES('delete', old.id, old.title, old.content);
  INSERT INTO documents_fts(rowid, title, content)
  VALUES (new.id, new.title, new.content);
END;
```

### Search with BM25 Ranking

```typescript
function search(query: string, limit = 20): SearchResult[] {
  const safeQuery = escapeFts5Query(query);

  return db.prepare(`
    SELECT
      d.*,
      bm25(documents_fts) AS rank,
      snippet(documents_fts, 1, '<mark>', '</mark>', '...', 64) AS snippet
    FROM documents_fts
    JOIN documents d ON documents_fts.rowid = d.id
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(safeQuery, limit);
}
```

## Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| String concatenation in SQL | SQL injection | Use parameterized queries |
| Missing transactions | Data inconsistency | Wrap related operations |
| No prepared statement reuse | Performance overhead | Cache statements |
| SELECT * everywhere | Fetches unnecessary data | Select specific columns |
| Missing indexes | Slow queries | Add indexes for WHERE/JOIN columns |
| Synchronous in UI thread | Blocks UI | Use async IPC in Electron |
| No error handling | Silent failures | Catch and handle errors |
| Forgetting to close DB | Resource leak | Close on exit/SIGINT |
