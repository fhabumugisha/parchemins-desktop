# Bonnes Pratiques 2025
## Application Desktop SaaS Production-Ready
### Electron + React + IA + SQLite

---

## Table des matières

1. [Architecture & Patterns](#1-architecture--patterns)
2. [Electron - Bonnes pratiques](#2-electron---bonnes-pratiques)
3. [React - Patterns modernes](#3-react---patterns-modernes)
4. [IA & LLM - Prompts, Caching, Résilience](#4-ia--llm)
5. [SQLite - Performance & Fiabilité](#5-sqlite)
6. [Sécurité Desktop](#6-sécurité-desktop)
7. [Checklist Production](#7-checklist-production)

---

## 1. Architecture & Patterns

### 1.1 Principes fondamentaux

```
┌─────────────────────────────────────────────────────────┐
│                    ARCHITECTURE                          │
├─────────────────────────────────────────────────────────┤
│  • Séparation Main/Renderer Process                     │
│  • Communication IPC typée et validée                   │
│  • Injection de dépendances                             │
│  • Result Pattern (pas d'exceptions pour flow normal)   │
│  • Repository Pattern pour l'accès données              │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Structure hexagonale recommandée

```
src/
├── domain/           # Cœur métier (aucune dépendance externe)
│   ├── entities/
│   ├── value-objects/
│   └── ports/        # Interfaces (contrats)
│
├── infrastructure/   # Implémentations concrètes
│   ├── repositories/
│   ├── llm/
│   └── extractors/
│
└── application/      # Cas d'usage
    ├── commands/
    └── queries/
```

### 1.3 Result Pattern

```typescript
// ✅ BON : Result type explicite
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage
async function findDocument(id: number): Promise<Result<Document, 'NOT_FOUND' | 'DB_ERROR'>> {
  try {
    const doc = await repository.findById(id);
    if (!doc) return { success: false, error: 'NOT_FOUND' };
    return { success: true, data: doc };
  } catch (e) {
    return { success: false, error: 'DB_ERROR' };
  }
}
```

---

## 2. Electron - Bonnes pratiques

### 2.1 Configuration sécurisée OBLIGATOIRE

```typescript
const win = new BrowserWindow({
  webPreferences: {
    // ⚠️ CRITIQUE - Toujours activer
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    
    // Preload sécurisé
    preload: path.join(__dirname, 'preload.js'),
    
    // Désactiver features dangereuses
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
  },
});
```

### 2.2 IPC typé et validé

```typescript
// shared/ipc-channels.ts
export const IPC_CHANNELS = {
  'documents:list': {} as { input: { limit?: number }; output: Document[] },
  'documents:get': {} as { input: { id: number }; output: Document | null },
  'chat:send': {} as { input: { message: string }; output: ChatResponse },
} as const;

// preload.ts - Exposition sécurisée
contextBridge.exposeInMainWorld('api', {
  documents: {
    list: (input) => ipcRenderer.invoke('documents:list', input),
    get: (input) => ipcRenderer.invoke('documents:get', input),
  },
});

// main/ipc-handlers.ts - Validation avec Zod
import { z } from 'zod';

const ListSchema = z.object({ limit: z.number().min(1).max(100).optional() });

ipcMain.handle('documents:list', async (_, rawInput) => {
  const input = ListSchema.parse(rawInput); // Validation
  return documentRepository.list(input.limit);
});
```

### 2.3 Stockage sécurisé des secrets

```typescript
import keytar from 'keytar';

const SERVICE = 'AssistantPastoral';

// Stocker
await keytar.setPassword(SERVICE, 'api_key', apiKey);

// Récupérer
const apiKey = await keytar.getPassword(SERVICE, 'api_key');

// Supprimer
await keytar.deletePassword(SERVICE, 'api_key');
```

### 2.4 Content Security Policy

```typescript
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "connect-src 'self' https://api.anthropic.com",
        "frame-ancestors 'none'",
      ].join('; ')
    }
  });
});
```

---

## 3. React - Patterns modernes

### 3.1 Structure de composants

```typescript
// ✅ BON : Séparation logique/UI

// hooks/useDocuments.ts
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    window.api.documents.list({}).then(setDocuments).finally(() => setIsLoading(false));
  }, []);
  
  return { documents, isLoading };
}

// components/DocumentList.tsx (UI pure)
interface Props {
  documents: Document[];
  onSelect: (doc: Document) => void;
}

export function DocumentList({ documents, onSelect }: Props) {
  return (
    <ul>
      {documents.map(doc => (
        <li key={doc.id} onClick={() => onSelect(doc)}>{doc.title}</li>
      ))}
    </ul>
  );
}

// containers/DocumentListContainer.tsx (connecte hook + UI)
export function DocumentListContainer() {
  const { documents, isLoading } = useDocuments();
  const [selected, setSelected] = useState<Document>();
  
  if (isLoading) return <Skeleton />;
  return <DocumentList documents={documents} onSelect={setSelected} />;
}
```

### 3.2 State Management avec Zustand

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface DocumentsState {
  documents: Document[];
  selectedId: number | null;
  setDocuments: (docs: Document[]) => void;
  selectDocument: (id: number | null) => void;
}

export const useDocumentsStore = create<DocumentsState>()(
  devtools(
    persist(
      immer((set) => ({
        documents: [],
        selectedId: null,
        
        setDocuments: (docs) => set((state) => { state.documents = docs }),
        selectDocument: (id) => set((state) => { state.selectedId = id }),
      })),
      { name: 'documents-store' }
    )
  )
);
```

### 3.3 Error Boundaries

```typescript
class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('React error', error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### 3.4 Optimistic Updates

```typescript
const deleteDocument = useMutation({
  mutationFn: (id: number) => window.api.documents.delete({ id }),
  
  onMutate: async (deletedId) => {
    await queryClient.cancelQueries({ queryKey: ['documents'] });
    const previous = queryClient.getQueryData(['documents']);
    
    // Mise à jour optimiste
    queryClient.setQueryData(['documents'], (old) => 
      old?.filter(doc => doc.id !== deletedId)
    );
    
    return { previous };
  },
  
  onError: (err, id, context) => {
    // Rollback
    queryClient.setQueryData(['documents'], context?.previous);
  },
});
```

---

## 4. IA & LLM

### 4.1 Architecture résiliente

```
Request → Cache Check → Rate Limiter → Circuit Breaker → Retry Handler → API
                ↓                                              ↓
           Cache Hit                                     Cache Store
```

### 4.2 Prompts versionnés

```typescript
export const PROMPTS = {
  SEARCH_ASSISTANT: {
    version: '2.1',
    template: `Tu es un assistant pour pasteurs.

<context>
{{#each documents}}
<sermon id="{{this.id}}">
  <titre>{{this.title}}</titre>
  <contenu>{{this.content}}</contenu>
</sermon>
{{/each}}
</context>

<instructions>
1. Base tes réponses sur les sermons fournis
2. Cite le titre quand tu t'en inspires
3. Dis clairement si l'info n'est pas disponible
</instructions>`,
  },
};

// Compiler avec Handlebars
const prompt = Handlebars.compile(PROMPTS.SEARCH_ASSISTANT.template)({ documents });
```

### 4.3 Cache intelligent

```typescript
class LLMCache {
  private db: Database;
  
  generateKey(params: { prompt: string; model: string; contextIds?: number[] }): string {
    return crypto.createHash('sha256').update(JSON.stringify({
      prompt: params.prompt.trim().toLowerCase(),
      model: params.model,
      contextIds: params.contextIds?.sort(),
    })).digest('hex');
  }
  
  get(key: string, promptVersion: string): CacheEntry | null {
    return this.db.prepare(`
      SELECT * FROM llm_cache 
      WHERE key = ? AND prompt_version = ? AND expires_at > ?
    `).get(key, promptVersion, Date.now());
  }
  
  set(key: string, response: string, ttl = 24 * 60 * 60 * 1000): void {
    this.db.prepare(`
      INSERT OR REPLACE INTO llm_cache (key, response, expires_at)
      VALUES (?, ?, ?)
    `).run(key, response, Date.now() + ttl);
  }
  
  // Invalider quand le contexte change
  invalidateByContext(contextHash: string): void {
    this.db.prepare('DELETE FROM llm_cache WHERE context_hash = ?').run(contextHash);
  }
}
```

### 4.4 Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure: number | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(private threshold = 5, private resetTimeout = 60000) {}
  
  isOpen(): boolean {
    if (this.state === 'closed') return false;
    
    if (this.state === 'open' && this.lastFailure) {
      if (Date.now() - this.lastFailure >= this.resetTimeout) {
        this.state = 'half-open';
        return false;
      }
    }
    
    return this.state === 'open';
  }
  
  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = 'open';
  }
}
```

### 4.5 Retry avec backoff exponentiel

```typescript
import pRetry from 'p-retry';

async function callWithRetry(fn: () => Promise<Response>): Promise<Response> {
  return pRetry(fn, {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 10000,
    factor: 2,
    onFailedAttempt: (error) => {
      console.warn(`Attempt ${error.attemptNumber} failed`);
      
      // Ne pas retry pour certaines erreurs
      if (error instanceof AuthenticationError) throw error;
    },
  });
}
```

---

## 5. SQLite

### 5.1 Configuration optimale

```typescript
const db = new Database(dbPath);

// Performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB
db.pragma('mmap_size = 268435456'); // 256MB
db.pragma('temp_store = MEMORY');

// Sécurité
db.pragma('foreign_keys = ON');
```

### 5.2 FTS5 pour la recherche

```sql
-- Créer l'index FTS5
CREATE VIRTUAL TABLE documents_fts USING fts5(
  title,
  content,
  content='documents',
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'
);

-- Triggers de synchronisation
CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- Recherche avec ranking
SELECT d.*, bm25(documents_fts) AS rank,
       snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) AS snippet
FROM documents_fts
JOIN documents d ON d.id = documents_fts.rowid
WHERE documents_fts MATCH 'grâce pardon'
ORDER BY rank
LIMIT 20;
```

### 5.3 Migrations versionnées

```typescript
const migrations = [
  {
    version: 1,
    name: 'initial',
    up: (db) => db.exec(`CREATE TABLE documents (...)`),
    down: (db) => db.exec('DROP TABLE documents'),
  },
  {
    version: 2,
    name: 'add_fts',
    up: (db) => db.exec(`CREATE VIRTUAL TABLE documents_fts USING fts5(...)`),
    down: (db) => db.exec('DROP TABLE documents_fts'),
  },
];

class MigrationRunner {
  migrate(): void {
    const current = this.getCurrentVersion();
    const pending = migrations.filter(m => m.version > current);
    
    for (const migration of pending) {
      this.db.transaction(() => {
        migration.up(this.db);
        this.db.prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)').run(migration.version, migration.name);
      })();
    }
  }
}
```

### 5.4 Transactions et prepared statements

```typescript
// ✅ Toujours utiliser des prepared statements
const stmt = db.prepare('INSERT INTO documents (title, content) VALUES (?, ?)');
stmt.run(title, content);

// ✅ Transactions pour opérations multiples
const insertMany = db.transaction((docs) => {
  const insert = db.prepare('INSERT INTO documents (title, content) VALUES (?, ?)');
  for (const doc of docs) {
    insert.run(doc.title, doc.content);
  }
});

insertMany(documents); // Atomique et performant
```

---

## 6. Sécurité Desktop

### 6.1 Checklist sécurité

```typescript
function auditSecurity(win: BrowserWindow): void {
  const prefs = win.webContents.getWebPreferences();
  
  const checks = [
    { name: 'Context Isolation', pass: prefs.contextIsolation === true, critical: true },
    { name: 'Node Integration', pass: prefs.nodeIntegration === false, critical: true },
    { name: 'Sandbox', pass: prefs.sandbox === true, critical: true },
    { name: 'Web Security', pass: prefs.webSecurity !== false, critical: true },
  ];
  
  const failed = checks.filter(c => !c.pass && c.critical);
  if (failed.length) {
    throw new Error(`Security audit failed: ${failed.map(c => c.name).join(', ')}`);
  }
}
```

### 6.2 Validation des entrées

```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Schémas Zod
const schemas = {
  document: z.object({
    path: z.string().max(1000).refine(p => !p.includes('..'), 'Path traversal'),
    title: z.string().min(1).max(500),
    content: z.string().max(10_000_000),
  }),
  
  chatMessage: z.object({
    content: z.string().min(1).max(10_000).transform(s => s.trim()),
  }),
};

// Sanitize HTML
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'mark'],
    ALLOWED_ATTR: [],
  });
}

// Protection Path Traversal
function sanitizePath(inputPath: string, baseDir: string): string {
  const resolved = path.resolve(baseDir, inputPath);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Path traversal attempt');
  }
  return resolved;
}
```

### 6.3 Audit logging

```typescript
class AuditLogger {
  log(type: string, details: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      details: this.sanitize(details),
    };
    
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
  }
  
  private sanitize(details: Record<string, unknown>): Record<string, unknown> {
    const sensitive = ['apiKey', 'password', 'token'];
    return Object.fromEntries(
      Object.entries(details).map(([k, v]) => [k, sensitive.includes(k) ? '[REDACTED]' : v])
    );
  }
}

// Usage
auditLogger.log('api.request', { endpoint: '/messages', tokensUsed: 500 });
auditLogger.log('auth.api_key_set', { apiKey: 'sk-...' }); // sera redacté
```

---

## 7. Checklist Production

### ✅ Avant release

```
SÉCURITÉ
□ contextIsolation: true
□ nodeIntegration: false
□ sandbox: true
□ CSP configurée
□ Validation Zod sur tous les inputs IPC
□ Secrets dans keytar/safeStorage
□ Audit logging actif

PERFORMANCE
□ SQLite WAL mode
□ Cache LLM actif
□ Lazy loading des modules lourds
□ Virtualisation des listes longues

QUALITÉ
□ Tests unitaires > 80% coverage
□ Tests E2E sur flows critiques
□ ESLint sans erreurs
□ TypeScript strict mode

RESILIENCE
□ Circuit breaker sur API externe
□ Retry avec backoff
□ Error boundaries React
□ Graceful degradation (offline mode)

BUILD
□ Code signing (Windows/macOS)
□ Notarization (macOS)
□ Auto-updater configuré
□ CI/CD fonctionnel
```

### ✅ Monitoring en production

```typescript
// Métriques à collecter
const metrics = {
  // Performance
  appStartTime: number,
  indexingDuration: number[],
  searchDuration: number[],
  aiResponseTime: number[],
  
  // Usage
  documentsIndexed: number,
  searchesPerformed: number,
  aiQueriesSent: number,
  
  // Errors
  errorCount: Record<string, number>,
  crashCount: number,
};
```

---

## Résumé des règles d'or

| Domaine | Règle | Priorité |
|---------|-------|----------|
| **Electron** | Context Isolation + Sandbox toujours ON | 🔴 Critique |
| **Electron** | IPC typé + validé avec Zod | 🔴 Critique |
| **React** | Séparation hooks/UI/containers | 🟡 Important |
| **React** | Zustand + immer pour état global | 🟡 Important |
| **IA** | Cache avec TTL + invalidation | 🔴 Critique |
| **IA** | Circuit Breaker + Retry | 🔴 Critique |
| **SQLite** | WAL mode + prepared statements | 🔴 Critique |
| **SQLite** | FTS5 pour recherche full-text | 🟡 Important |
| **Sécurité** | Validation toutes entrées | 🔴 Critique |
| **Sécurité** | keytar pour secrets | 🔴 Critique |

---

*Document généré le 17 janvier 2025*
