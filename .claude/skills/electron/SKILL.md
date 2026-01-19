---
name: electron
description: Electron best practices for 2025 - security, clean code, architecture, performance, and maintainability patterns
---

# Electron Best Practices (2025)

Comprehensive guidelines for building secure, maintainable, and performant Electron applications.

## 1. Security

### Sandbox Configuration
Always enable sandbox mode for all renderer processes:

```typescript
// main process - window creation
const mainWindow = new BrowserWindow({
  webPreferences: {
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    webSecurity: true,
  }
});
```

### Context Isolation & contextBridge
Never expose Node.js APIs directly. Use contextBridge for safe IPC:

```typescript
// preload.ts - expose only specific, validated APIs
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Type-safe, validated channels only
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
  saveFile: (path: string, content: string) => ipcRenderer.invoke('file:save', path, content),

  // Subscriptions with cleanup
  onFileChange: (callback: (path: string) => void) => {
    const handler = (_: unknown, path: string) => callback(path);
    ipcRenderer.on('file:changed', handler);
    return () => ipcRenderer.removeListener('file:changed', handler);
  }
});
```

### Content Security Policy
Configure strict CSP in your HTML and main process:

```typescript
// main process - set CSP headers
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://api.anthropic.com",
        "img-src 'self' data:",
      ].join('; ')
    }
  });
});
```

### IPC Channel Validation
Validate all IPC inputs in the main process:

```typescript
// main/ipc/documents.ipc.ts
ipcMain.handle('documents:save', async (event, data: unknown) => {
  // Validate input structure
  if (!isValidDocumentData(data)) {
    throw new Error('Invalid document data');
  }

  // Validate sender origin
  if (!event.senderFrame.url.startsWith('file://')) {
    throw new Error('Unauthorized sender');
  }

  return documentService.save(data);
});
```

### Secure Credential Storage
Use Electron's safeStorage for sensitive data:

```typescript
import { safeStorage } from 'electron';

export class SecureStorage {
  static encrypt(value: string): Buffer {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption not available');
    }
    return safeStorage.encryptString(value);
  }

  static decrypt(encrypted: Buffer): string {
    return safeStorage.decryptString(encrypted);
  }
}
```

## 2. Clean Code & Architecture

### Modular Service Layer
Organize business logic in dedicated services:

```
src/main/
├── services/
│   ├── database.service.ts    # Data persistence
│   ├── indexer.service.ts     # Document indexing
│   ├── search.service.ts      # Search functionality
│   └── claude.service.ts      # AI integration
├── ipc/
│   ├── documents.ipc.ts       # Document handlers
│   ├── search.ipc.ts          # Search handlers
│   └── settings.ipc.ts        # Settings handlers
└── extractors/
    ├── pdf.extractor.ts
    └── docx.extractor.ts
```

### IPC Handler Organization
Group related IPC handlers by domain:

```typescript
// main/ipc/documents.ipc.ts
export function registerDocumentHandlers(documentService: DocumentService) {
  ipcMain.handle('documents:list', () => documentService.list());
  ipcMain.handle('documents:get', (_, id: string) => documentService.get(id));
  ipcMain.handle('documents:save', (_, data) => documentService.save(data));
  ipcMain.handle('documents:delete', (_, id: string) => documentService.delete(id));
}

// main/index.ts
registerDocumentHandlers(documentService);
registerSearchHandlers(searchService);
registerSettingsHandlers(settingsService);
```

### Shared Type Definitions
Define types in a shared location accessible by both processes:

```typescript
// shared/types.ts
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IpcResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// shared/ipc-channels.ts
export const IPC_CHANNELS = {
  DOCUMENTS: {
    LIST: 'documents:list',
    GET: 'documents:get',
    SAVE: 'documents:save',
    DELETE: 'documents:delete',
  },
  SEARCH: {
    QUERY: 'search:query',
  },
} as const;
```

### Dependency Injection Pattern
Initialize services with their dependencies explicitly:

```typescript
// main/index.ts
const databaseService = new DatabaseService(dbPath);
const searchService = new SearchService(databaseService);
const indexerService = new IndexerService(databaseService, extractors);
const claudeService = new ClaudeService(searchService, databaseService);

// Pass to IPC handlers
registerChatHandlers(claudeService);
```

## 3. Resilient Code

### Error Handling in IPC
Wrap all IPC handlers with consistent error handling:

```typescript
function createSafeHandler<T>(
  handler: (...args: unknown[]) => Promise<T>
): IpcMainInvokeHandler {
  return async (event, ...args) => {
    try {
      return { success: true, data: await handler(...args) };
    } catch (error) {
      console.error('IPC Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };
}

ipcMain.handle('documents:save', createSafeHandler(documentService.save));
```

### Resource Cleanup
Properly clean up resources on window close and app quit:

```typescript
// main/index.ts
app.on('before-quit', async () => {
  await databaseService.close();
  await watcherService.stopAll();
});

mainWindow.on('closed', () => {
  // Remove event listeners
  ipcMain.removeHandler('documents:list');
  // Clear references
  mainWindow = null;
});
```

### Graceful Degradation
Handle missing features or failed operations gracefully:

```typescript
export class ClaudeService {
  async chat(message: string): Promise<string> {
    // Check prerequisites
    const credits = await this.creditsService.getBalance();
    if (credits <= 0) {
      throw new InsufficientCreditsError('No credits remaining');
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new ConfigurationError('API key not configured');
    }

    try {
      return await this.callApi(message);
    } catch (error) {
      if (error instanceof NetworkError) {
        // Return cached response if available
        return this.getCachedResponse(message) ??
          'Unable to connect. Please check your internet connection.';
      }
      throw error;
    }
  }
}
```

### Process Crash Recovery
Handle renderer crashes gracefully:

```typescript
mainWindow.webContents.on('render-process-gone', (event, details) => {
  console.error('Renderer crashed:', details.reason);

  if (details.reason === 'crashed') {
    // Show user-friendly dialog
    dialog.showErrorBox(
      'Application Error',
      'The application encountered an error and needs to reload.'
    );

    // Reload or recreate window
    mainWindow.reload();
  }
});
```

## 4. Maintainability

### TypeScript Strict Mode
Enable strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Typed IPC Communication
Create type-safe IPC wrappers:

```typescript
// shared/ipc.types.ts
export interface IpcApi {
  documents: {
    list: () => Promise<Document[]>;
    get: (id: string) => Promise<Document | null>;
    save: (doc: DocumentInput) => Promise<Document>;
    delete: (id: string) => Promise<void>;
  };
  search: {
    query: (term: string) => Promise<SearchResult[]>;
  };
}

// preload.ts
declare global {
  interface Window {
    electronAPI: IpcApi;
  }
}
```

### Naming Conventions
Follow consistent naming patterns:

```
Services:        *.service.ts     (database.service.ts)
IPC Handlers:    *.ipc.ts         (documents.ipc.ts)
Extractors:      *.extractor.ts   (pdf.extractor.ts)
Stores:          *.store.ts       (documents.store.ts)
Types:           *.types.ts       (shared/document.types.ts)
```

### Electron Version Updates
Keep Electron updated for security patches. Use electron-builder for consistent builds:

```yaml
# electron-builder.yml
appId: com.yourcompany.app
productName: YourApp
directories:
  output: dist
files:
  - "out/**/*"
  - "package.json"
```

## 5. Readable Code

### Separation of Concerns
Keep renderer code free of Node.js/Electron specifics:

```typescript
// renderer - pure React, no Electron imports
export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Uses preload bridge, not direct IPC
    window.electronAPI.documents.list().then(setDocuments);
  }, []);

  return <ul>{documents.map(doc => <DocumentItem key={doc.id} doc={doc} />)}</ul>;
}
```

### Self-Documenting IPC Channels
Use descriptive, namespaced channel names:

```typescript
// Good - clear intent and domain
'documents:list'
'documents:save'
'search:full-text'
'settings:get-api-key'

// Bad - ambiguous
'get-data'
'save'
'do-search'
```

### Hook Abstractions
Abstract IPC calls behind React hooks:

```typescript
// hooks/useDocuments.ts
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.documents.list();
      setDocuments(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { documents, loading, error, refresh };
}
```

## 6. Performance

### Lazy Loading Windows
Create windows on demand, not at startup:

```typescript
let settingsWindow: BrowserWindow | null = null;

export function showSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
      contextIsolation: true,
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}
```

### Code Splitting in Renderer
Use dynamic imports for heavy components:

```typescript
// Lazy load heavy components
const PdfViewer = lazy(() => import('./components/PdfViewer'));
const MarkdownEditor = lazy(() => import('./components/MarkdownEditor'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/pdf/:id" element={<PdfViewer />} />
        <Route path="/edit/:id" element={<MarkdownEditor />} />
      </Routes>
    </Suspense>
  );
}
```

### Web Workers for Heavy Tasks
Offload CPU-intensive work to workers:

```typescript
// workers/indexer.worker.ts
self.onmessage = async (event) => {
  const { files } = event.data;
  const results = await processFiles(files);
  self.postMessage({ results });
};

// main usage
const worker = new Worker(new URL('./workers/indexer.worker.ts', import.meta.url));
worker.postMessage({ files: filesToIndex });
worker.onmessage = (e) => handleIndexResults(e.data.results);
```

### Batch Database Operations
Use transactions for bulk operations:

```typescript
export class DatabaseService {
  batchInsert(documents: Document[]): void {
    const insert = this.db.prepare(`
      INSERT INTO documents (id, title, content, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((docs: Document[]) => {
      for (const doc of docs) {
        insert.run(doc.id, doc.title, doc.content, doc.createdAt);
      }
    });

    transaction(documents);
  }
}
```

### Debounce Frequent Operations
Debounce search and auto-save operations:

```typescript
// hooks/useSearch.ts
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const debouncedSearch = useMemo(
    () => debounce(async (q: string) => {
      if (q.length < 2) return setResults([]);
      const res = await window.electronAPI.search.query(q);
      setResults(res);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query, debouncedSearch]);

  return { query, setQuery, results };
}
```

## Quick Reference Checklist

### Security
- [ ] `sandbox: true` on all BrowserWindows
- [ ] `contextIsolation: true`
- [ ] `nodeIntegration: false`
- [ ] CSP headers configured
- [ ] All IPC inputs validated
- [ ] Credentials in safeStorage

### Architecture
- [ ] Services separated by domain
- [ ] IPC handlers organized by feature
- [ ] Shared types between processes
- [ ] Dependency injection used

### Error Handling
- [ ] All IPC handlers wrapped with error handling
- [ ] Resources cleaned up on close/quit
- [ ] Crash recovery implemented

### Performance
- [ ] Windows created lazily
- [ ] Heavy components code-split
- [ ] Workers used for CPU tasks
- [ ] Database operations batched
- [ ] Frequent operations debounced
