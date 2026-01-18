# CLAUDE.md - Assistant Pastoral

## Apercu du projet

Application desktop Electron pour pasteurs permettant d'indexer, rechercher et dialoguer avec leurs sermons via l'IA Claude.

## Stack technique

- **Frontend**: React 18 + TypeScript 5.3+ + Tailwind CSS 3.4 + Zustand + Lucide React
- **Backend**: Electron 28+ + Node.js
- **Base de donnees**: SQLite (better-sqlite3) avec FTS5 pour recherche full-text
- **IA**: API Anthropic Claude (claude-sonnet-4-20250514)
- **Extraction**: pdf-parse (PDF), mammoth (DOCX), ODT, Markdown
- **Build**: Vite + electron-builder

## Structure du projet

```
src/
├── main/                    # Electron Main Process (backend)
│   ├── index.ts             # Point d'entree principal
│   ├── window.ts            # Gestion fenetre
│   ├── ipc/                 # Handlers IPC (documents, search, chat, settings)
│   ├── services/            # Logique metier (database, indexer, search, claude, watcher)
│   ├── extractors/          # Extraction texte (PDF, DOCX, ODT, MD)
│   └── types/
├── renderer/                # React Frontend
│   ├── components/          # UI (layout/, chat/, documents/, settings/, common/)
│   ├── hooks/               # Custom hooks (useDocuments, useSearch, useChat, useSettings)
│   ├── stores/              # Zustand (documents, chat, ui, settings, credits)
│   ├── lib/                 # Utilitaires (ipc client, format, classnames)
│   └── styles/
├── preload/                 # Script preload (API securisee via contextBridge)
└── shared/                  # Types et constantes partages (types.ts, ipc-channels.ts)
```

## Architecture

### Communication IPC
- Renderer -> Preload (contextBridge) -> Main Process
- Canaux definis dans `src/shared/ipc-channels.ts`
- Handlers dans `src/main/ipc/`

### Flux de donnees
1. User action -> React Component -> Zustand Store
2. Store -> window.electronAPI (preload) -> IPC Handler
3. Handler -> Service -> SQLite/Claude API
4. Response -> Store update -> Re-render

### Securite Electron
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- CSP configure pour Anthropic API uniquement

## Base de donnees SQLite

Tables principales:
- `documents`: sermons indexes (path, title, content, date, bible_ref, word_count, hash)
- `documents_fts`: index FTS5 pour recherche full-text
- `conversations`: historique des conversations IA
- `messages`: messages user/assistant
- `settings`: parametres (cle/valeur)
- `credits`: solde de credits IA

Recherche FTS5 avec BM25 ranking et snippets.

## Services principaux

### DatabaseService (`database.service.ts`)
CRUD documents, conversations, messages, settings, credits.

### IndexerService (`indexer.service.ts`)
Scan dossier, extraction texte, hash MD5 pour detection changements.

### ClaudeService (`claude.service.ts`)
- RAG: recherche documents pertinents puis injection dans prompt systeme
- Gestion credits (1 credit = ~1000 tokens)
- Modele: claude-sonnet-4-20250514

### SearchService
Recherche FTS5 avec ranking BM25.

## Commandes

```bash
npm run dev          # Dev avec hot reload
npm run build        # Build production
npm run build:win    # Build Windows (NSIS)
npm run build:mac    # Build macOS (DMG)
npm run build:linux  # Build Linux (AppImage/deb)
npm run test         # Tests Vitest
npm run lint         # ESLint
npm run typecheck    # Verification types
```

## Conventions de code

- TypeScript strict
- Services suffixes `.service.ts`
- Extracteurs suffixes `.extractor.ts`
- IPC handlers suffixes `.ipc.ts`
- Stores Zustand suffixes `.store.ts`
- Composants React en PascalCase

## Points d'attention

1. **Cle API**: stockee chiffree via `safeStorage` d'Electron
2. **Credits**: verifier avant chaque appel Claude
3. **Indexation**: utiliser hash MD5 pour eviter re-indexation inutile
4. **IPC**: toujours asynchrone, jamais bloquer l'UI
5. **FTS5**: echapper caracteres speciaux dans les requetes

## Fichiers de configuration

- `electron-builder.yml`: packaging multi-plateforme
- `vite.config.ts`: bundler frontend
- `tsconfig.json`, `tsconfig.main.json`, `tsconfig.renderer.json`: TypeScript
- `.env`: ANTHROPIC_API_KEY (optionnel)
