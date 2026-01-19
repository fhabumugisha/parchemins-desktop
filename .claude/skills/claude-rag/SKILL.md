---
name: claude-rag
description: Anthropic SDK RAG (Retrieval-Augmented Generation) best practices for 2025 covering clean code, security, resilience, maintainability, and readability patterns. Use when implementing RAG with Claude API, building retrieval pipelines, or reviewing RAG code for best practices.
---

# Claude RAG Best Practices (2025)

Comprehensive guide for implementing Retrieval-Augmented Generation with the Anthropic SDK following clean code, security, resilience, maintainability, and readability principles.

## Overview

This skill provides best practices for building production-ready RAG systems with Claude. RAG enhances Claude's responses by retrieving relevant context from your data sources before generation.

**Key Principle**: RAG is not just about retrieval—it's about delivering the right context at the right time with the right structure.

---

## Clean Code Practices

### 1. Single Responsibility Agents

Separate retrieval, ranking, and generation into distinct components.

```typescript
// GOOD: Single responsibility components
class DocumentRetriever {
  async retrieve(query: string, limit: number): Promise<Document[]> {
    return this.vectorStore.similaritySearch(query, limit);
  }
}

class ContextRanker {
  async rank(documents: Document[], query: string): Promise<RankedDocument[]> {
    return this.reranker.rerank(documents, query);
  }
}

class ResponseGenerator {
  async generate(context: string, query: string): Promise<string> {
    return this.claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      messages: [{ role: 'user', content: query }],
      system: this.buildSystemPrompt(context)
    });
  }
}

// BAD: Monolithic RAG handler
class RAGHandler {
  async handleQuery(query: string) {
    // 200 lines doing retrieval, ranking, generation, caching...
  }
}
```

### 2. Contextual RAG with Chunk Enrichment

Add context to chunks before indexing for better retrieval.

```typescript
// GOOD: Enrich chunks with document-level context
interface EnrichedChunk {
  content: string;
  documentTitle: string;
  documentSummary: string;
  sectionHeader: string;
  chunkIndex: number;
  totalChunks: number;
}

async function enrichChunk(chunk: string, doc: Document, index: number): Promise<EnrichedChunk> {
  return {
    content: chunk,
    documentTitle: doc.title,
    documentSummary: doc.summary,
    sectionHeader: extractSectionHeader(chunk, doc),
    chunkIndex: index,
    totalChunks: doc.chunks.length
  };
}
```

### 3. Hybrid Search Strategy

Combine semantic and keyword search for robust retrieval.

```typescript
// GOOD: Hybrid search with configurable weights
interface HybridSearchConfig {
  semanticWeight: number;  // 0.0 - 1.0
  keywordWeight: number;   // 0.0 - 1.0
  minScore: number;
}

async function hybridSearch(
  query: string,
  config: HybridSearchConfig = { semanticWeight: 0.7, keywordWeight: 0.3, minScore: 0.5 }
): Promise<SearchResult[]> {
  const [semanticResults, keywordResults] = await Promise.all([
    vectorStore.similaritySearch(query),
    ftsIndex.search(query)  // Full-text search (e.g., FTS5)
  ]);

  return mergeAndRank(semanticResults, keywordResults, config);
}
```

---

## Secure Code Practices

### 1. API Key Management

Never hardcode keys. Use secure storage and environment isolation.

```typescript
// GOOD: Secure key management with Electron safeStorage
import { safeStorage } from 'electron';

class SecureKeyStore {
  private readonly KEY_NAME = 'anthropic_api_key';

  async storeKey(apiKey: string): Promise<void> {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure storage not available');
    }
    const encrypted = safeStorage.encryptString(apiKey);
    await this.storage.set(this.KEY_NAME, encrypted.toString('base64'));
  }

  async getKey(): Promise<string> {
    const encrypted = await this.storage.get(this.KEY_NAME);
    if (!encrypted) throw new Error('API key not configured');
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'));
  }
}

// BAD: Hardcoded or plaintext storage
const client = new Anthropic({ apiKey: 'sk-ant-...' });
localStorage.setItem('apiKey', userApiKey);
```

### 2. Input Sanitization for RAG Queries

Prevent prompt injection through retrieved content.

```typescript
// GOOD: Sanitize retrieved content before injection
function sanitizeForContext(content: string): string {
  // Remove potential prompt injection patterns
  return content
    .replace(/\[INST\]|\[\/INST\]/gi, '')
    .replace(/<<SYS>>|<<\/SYS>>/gi, '')
    .replace(/Human:|Assistant:/gi, '')
    .replace(/<\|im_start\|>|<\|im_end\|>/gi, '')
    .trim();
}

function buildSystemPrompt(retrievedDocs: Document[]): string {
  const sanitizedContext = retrievedDocs
    .map(doc => sanitizeForContext(doc.content))
    .join('\n\n---\n\n');

  return `You are a helpful assistant. Answer based on the following context:

<context>
${sanitizedContext}
</context>

If the context doesn't contain relevant information, say so.`;
}
```

### 3. Least Privilege for Document Access

Implement document-level access control in RAG.

```typescript
// GOOD: Filter retrieval by user permissions
interface RAGQuery {
  query: string;
  userId: string;
  allowedCollections: string[];
}

async function secureRetrieve(ragQuery: RAGQuery): Promise<Document[]> {
  const results = await vectorStore.similaritySearch(ragQuery.query, {
    filter: {
      collection: { $in: ragQuery.allowedCollections },
      accessLevel: { $lte: getUserAccessLevel(ragQuery.userId) }
    }
  });
  return results;
}
```

---

## Resilient Code Practices

### 1. Circuit Breaker Pattern

Prevent cascade failures when Claude API is unavailable.

```typescript
// GOOD: Circuit breaker for API calls
class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
const response = await breaker.execute(() => claude.messages.create({...}));
```

### 2. Graceful Degradation with Fallbacks

Provide useful responses even when RAG fails.

```typescript
// GOOD: Multi-level fallback strategy
async function ragWithFallback(query: string): Promise<RAGResponse> {
  try {
    // Level 1: Full RAG with reranking
    const docs = await retriever.retrieve(query);
    const ranked = await reranker.rank(docs, query);
    return await generateWithContext(query, ranked);
  } catch (retrievalError) {
    console.warn('Retrieval failed, trying cache:', retrievalError);

    try {
      // Level 2: Cached similar queries
      const cached = await cache.getSimilar(query);
      if (cached) return cached;
    } catch (cacheError) {
      console.warn('Cache failed:', cacheError);
    }

    // Level 3: Direct Claude without RAG
    return await generateWithoutContext(query, {
      disclaimer: 'Responding without access to your documents.'
    });
  }
}
```

### 3. Streaming for Long Responses

Use streaming to improve perceived performance and handle timeouts.

```typescript
// GOOD: Stream responses for better UX
async function* streamRAGResponse(
  query: string,
  context: string
): AsyncGenerator<string> {
  const stream = await claude.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: buildSystemPrompt(context),
    messages: [{ role: 'user', content: query }]
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

// Usage in renderer
for await (const chunk of streamRAGResponse(query, context)) {
  appendToUI(chunk);
}
```

---

## Maintainable Code Practices

### 1. Service Layer Architecture

Isolate RAG logic in dedicated services.

```typescript
// GOOD: Clean service layer
// src/main/services/rag.service.ts
export class RAGService {
  constructor(
    private readonly retriever: DocumentRetriever,
    private readonly claude: ClaudeService,
    private readonly config: RAGConfig
  ) {}

  async query(input: RAGInput): Promise<RAGResponse> {
    const documents = await this.retriever.retrieve(input.query, this.config.topK);
    const context = this.formatContext(documents);
    const response = await this.claude.generate(input.query, context);

    return {
      answer: response.content,
      sources: documents.map(d => d.metadata),
      tokensUsed: response.usage.total_tokens
    };
  }

  private formatContext(docs: Document[]): string {
    return docs
      .map((doc, i) => `[Source ${i + 1}: ${doc.title}]\n${doc.content}`)
      .join('\n\n');
  }
}
```

### 2. Typed Schemas for RAG Pipelines

Use TypeScript interfaces for all RAG data structures.

```typescript
// GOOD: Comprehensive type definitions
// src/shared/types/rag.types.ts
export interface RAGConfig {
  topK: number;
  minScore: number;
  maxContextTokens: number;
  chunkOverlap: number;
  chunkSize: number;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  score: number;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  title: string;
  path: string;
  indexedAt: Date;
  wordCount: number;
  bibleReferences?: string[];
}

export interface RAGResponse {
  answer: string;
  sources: DocumentMetadata[];
  tokensUsed: number;
  retrievalTimeMs: number;
  generationTimeMs: number;
}
```

### 3. Configuration as Code

Externalize RAG parameters for easy tuning.

```typescript
// GOOD: Externalized configuration
// config/rag.config.ts
export const ragConfig: RAGConfig = {
  retrieval: {
    topK: 5,
    minScore: 0.7,
    hybridWeights: { semantic: 0.7, keyword: 0.3 }
  },
  chunking: {
    size: 1000,
    overlap: 200,
    strategy: 'semantic'  // 'fixed' | 'semantic' | 'sentence'
  },
  generation: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    temperature: 0.3,
    systemPromptTemplate: 'prompts/rag-system.txt'
  },
  caching: {
    enabled: true,
    ttlSeconds: 3600,
    maxEntries: 1000
  }
};
```

---

## Readable Code Practices

### 1. Explicit Pipeline Stages

Make RAG pipeline stages visible and traceable.

```typescript
// GOOD: Explicit, traceable pipeline
async function executeRAGPipeline(query: string): Promise<RAGResult> {
  const trace: PipelineTrace = { stages: [] };

  // Stage 1: Query Enhancement
  const enhancedQuery = await traceStage(trace, 'enhance', () =>
    queryEnhancer.enhance(query)
  );

  // Stage 2: Document Retrieval
  const documents = await traceStage(trace, 'retrieve', () =>
    retriever.retrieve(enhancedQuery, config.topK)
  );

  // Stage 3: Relevance Filtering
  const relevant = await traceStage(trace, 'filter', () =>
    documents.filter(d => d.score >= config.minScore)
  );

  // Stage 4: Context Assembly
  const context = await traceStage(trace, 'assemble', () =>
    contextBuilder.build(relevant, config.maxTokens)
  );

  // Stage 5: Response Generation
  const response = await traceStage(trace, 'generate', () =>
    generator.generate(query, context)
  );

  return { response, trace };
}

async function traceStage<T>(
  trace: PipelineTrace,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  trace.stages.push({ name, durationMs: performance.now() - start });
  return result;
}
```

### 2. Structured System Prompts

Use clear, well-organized system prompts with XML tags.

```typescript
// GOOD: Structured system prompt with clear sections
function buildSystemPrompt(context: RetrievedDocument[], userPrefs: UserPrefs): string {
  return `You are a helpful assistant for pastoral work. Answer questions based on the provided sermon context.

<role>
- Provide accurate, contextual answers from the retrieved sermons
- Cite sources using [Source N] format
- If context is insufficient, acknowledge limitations
- Respect the theological perspective of the source material
</role>

<context>
${context.map((doc, i) => `
<source id="${i + 1}" title="${doc.metadata.title}" date="${doc.metadata.date}">
${doc.content}
</source>
`).join('\n')}
</context>

<response_format>
- Use clear, pastoral language
- Include relevant Bible references when present in sources
- Structure longer answers with headings
- Language: ${userPrefs.language}
</response_format>`;
}
```

### 3. Rich Error Messages

Provide actionable error information.

```typescript
// GOOD: Rich, actionable errors
class RAGError extends Error {
  constructor(
    message: string,
    public readonly code: RAGErrorCode,
    public readonly stage: string,
    public readonly recoverable: boolean,
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = 'RAGError';
  }
}

enum RAGErrorCode {
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  NO_RELEVANT_DOCS = 'NO_RELEVANT_DOCS',
  CONTEXT_TOO_LARGE = 'CONTEXT_TOO_LARGE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS'
}

// Usage
throw new RAGError(
  'No documents found with relevance score above threshold',
  RAGErrorCode.NO_RELEVANT_DOCS,
  'filter',
  true,
  'Try broadening your search terms or lowering the minimum relevance score.'
);
```

---

## Quick Reference Table

| Category | Practice | Key Benefit |
|----------|----------|-------------|
| **Clean Code** | Single responsibility agents | Testable, reusable components |
| **Clean Code** | Contextual RAG (chunk enrichment) | Better retrieval accuracy |
| **Clean Code** | Hybrid search | Robust retrieval across query types |
| **Security** | Encrypted key storage | Prevents credential leaks |
| **Security** | Input sanitization | Prevents prompt injection |
| **Security** | Least privilege retrieval | Document-level access control |
| **Resilience** | Circuit breaker | Prevents cascade failures |
| **Resilience** | Multi-level fallback | Graceful degradation |
| **Resilience** | Streaming responses | Better UX, timeout handling |
| **Maintainability** | Service layer architecture | Clean separation of concerns |
| **Maintainability** | Typed schemas | Type safety across pipeline |
| **Maintainability** | Configuration as code | Easy tuning without code changes |
| **Readability** | Explicit pipeline stages | Traceable, debuggable flow |
| **Readability** | Structured prompts (XML) | Clear context boundaries |
| **Readability** | Rich error messages | Faster debugging, better UX |

---

## Sources

- [Anthropic Documentation - Retrieval Augmented Generation](https://docs.anthropic.com/en/docs/build-with-claude/retrieval-augmented-generation)
- [Anthropic Cookbook - Contextual Retrieval](https://github.com/anthropics/anthropic-cookbook/blob/main/skills/retrieval_augmented_generation/guide.ipynb)
- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
