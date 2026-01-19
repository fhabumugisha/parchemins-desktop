import Anthropic from '@anthropic-ai/sdk';
import {
  getCredits,
  updateCredits,
  searchDocuments,
  searchDocumentsSemantic,
  searchDocumentsHybrid,
  getDocumentById,
  getDocumentCount,
  logUsage,
} from './database.service';
import { generateEmbedding, initializeEmbeddings } from './embedding.service';
import { retrieveApiKey, hasApiKey } from './secure-storage.service';
import type { ChatResponse } from '../../shared/types';
import { MAX_CONTEXT_DOCUMENTS, TOKENS_PER_CREDIT } from '../../shared/constants';
import { messages as i18n } from '../../shared/messages';
import { prompts, type SermonContext } from '../../shared/prompts';

/**
 * Create a new Anthropic client for each request
 * This ensures the API key is not cached in memory longer than necessary
 */
function createClient(): Anthropic {
  const apiKey = retrieveApiKey();
  if (!apiKey) {
    throw new Error(i18n.errors.apiKeyNotConfigured);
  }
  return new Anthropic({ apiKey });
}

/**
 * No-op for backwards compatibility
 * Client is no longer cached, so nothing to reset
 */
export function resetClaudeClient(): void {
  // No-op: client is now created fresh for each request
}

export function isApiKeyConfigured(): boolean {
  return hasApiKey();
}

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  referencedDocumentIds?: number[];
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const credits = getCredits();
  if (credits <= 0) {
    throw new Error('Credits insuffisants. Veuillez acheter des credits pour continuer.');
  }

  // Récupérer les sermons référencés (contenu intégral)
  const referencedSermons: SermonContext[] = [];
  const hasReferencedSermons = request.referencedDocumentIds && request.referencedDocumentIds.length > 0;

  if (hasReferencedSermons) {
    for (const docId of request.referencedDocumentIds!) {
      const doc = getDocumentById(docId);
      if (doc) {
        referencedSermons.push({
          title: doc.title,
          date: doc.date,
          bible_ref: doc.bible_ref,
          content: doc.content, // Contenu intégral
        });
      }
    }
  }

  // Si des sermons sont référencés, on les utilise EXCLUSIVEMENT (pas de recherche)
  // Sinon, recherche hybride (FTS5 + sémantique)
  let sermonContexts: SermonContext[] = [];
  let relevantDocsWithScore: Array<{ id: number; title: string; content: string; score: number }> = [];

  if (!hasReferencedSermons) {
    // Recherche hybride (FTS5 + sémantique)
    await initializeEmbeddings();
    const queryEmbedding = await generateEmbedding(request.message);

    const ftsResults = searchDocuments(request.message, MAX_CONTEXT_DOCUMENTS);
    const vectorResults = searchDocumentsSemantic(queryEmbedding, MAX_CONTEXT_DOCUMENTS);
    const relevantDocs = searchDocumentsHybrid(ftsResults, vectorResults, MAX_CONTEXT_DOCUMENTS);

    try {
      console.log('[Chat] Hybrid search results:', relevantDocs.map(d => ({
        id: d.id,
        title: d.title,
        score: d.score,
        matchType: d.matchType
      })));
    } catch {
      // Ignore EPIPE errors
    }

    // Tous les documents sont envoyés à Claude comme contexte
    sermonContexts = relevantDocs.map((doc) => ({
      title: doc.title,
      date: doc.date,
      bible_ref: doc.bible_ref,
      content: doc.content,
    }));

    // Conserver les docs avec leur score pour filtrer les sources
    relevantDocsWithScore = relevantDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      score: doc.score,
    }));
  }

  const totalDocumentCount = getDocumentCount();
  // Si sermons référencés: referencedSermons uniquement, sinon: sermonContexts de la recherche
  const systemPrompt = hasReferencedSermons
    ? prompts.chatSystemWithReferences(referencedSermons, totalDocumentCount)
    : prompts.chatSystem(sermonContexts, totalDocumentCount);

  const messages: Anthropic.MessageParam[] = [
    ...(request.conversationHistory || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: request.message },
  ];

  try {
    const client = createClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const usage = response.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const tokensUsed = inputTokens + outputTokens;
    const creditsUsed = Math.ceil(tokensUsed / TOKENS_PER_CREDIT);
    updateCredits(-creditsUsed);

    // Log usage for cost tracking
    logUsage(inputTokens, outputTokens);

    const textContent = response.content.find((c) => c.type === 'text');
    const rawResponseText = textContent && textContent.type === 'text' ? textContent.text : '';

    // Parser les sources utilisées par Claude
    const sourceMatch = rawResponseText.match(/\[SOURCES:\s*([^\]]+)\]/i);
    let usedIds: number[] = [];
    if (sourceMatch && sourceMatch[1].toLowerCase() !== 'aucune') {
      usedIds = sourceMatch[1]
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    }

    // Nettoyer la réponse (retirer le tag [SOURCES:...])
    const responseText = rawResponseText.replace(/\s*\[SOURCES:[^\]]*\]\s*/gi, '').trim();

    // Sources: sermons référencés OU résultats de recherche filtrés par IDs utilisés
    let sources;
    if (hasReferencedSermons) {
      sources = referencedSermons.map((s, index) => ({
        id: request.referencedDocumentIds![index],
        title: s.title,
        snippet: s.content.substring(0, 300) + '...',
      }));
    } else {
      // Filtrer par IDs utilisés par Claude (IDs sont 1-indexed)
      const usedDocs = relevantDocsWithScore.filter((_, index) => usedIds.includes(index + 1));

      sources = usedDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.content.substring(0, 200) + '...',
      }));
    }

    return {
      response: responseText,
      tokensUsed,
      sources,
    };
  } catch (error) {
    // Use generic error messages to avoid exposing implementation details
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error(i18n.errors.apiKeyInvalid);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error(i18n.errors.rateLimitReached);
    }
    if (error instanceof Anthropic.APIError) {
      // Generic message - don't expose API error details
      throw new Error(i18n.errors.aiServiceError);
    }
    throw new Error(i18n.errors.genericError);
  }
}

export async function summarizeDocument(documentId: number): Promise<string> {
  const credits = getCredits();
  if (credits <= 0) {
    throw new Error('Credits insuffisants.');
  }

  const doc = getDocumentById(documentId);
  if (!doc) {
    throw new Error('Document non trouve.');
  }

  try {
    const client = createClient();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: prompts.summarizeSystem,
      messages: [
        {
          role: 'user',
          content: prompts.summarizeUser(doc.title, doc.content),
        },
      ],
    });

    const usage = response.usage;
    const inputTokens = usage?.input_tokens ?? 0;
    const outputTokens = usage?.output_tokens ?? 0;
    const tokensUsed = inputTokens + outputTokens;
    const creditsUsed = Math.ceil(tokensUsed / TOKENS_PER_CREDIT);
    updateCredits(-creditsUsed);

    // Log usage for cost tracking
    logUsage(inputTokens, outputTokens);

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error(i18n.errors.apiKeyInvalid);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error(i18n.errors.rateLimitReached);
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(i18n.errors.aiServiceError);
    }
    throw new Error(i18n.errors.genericError);
  }
}

// Timeout for API key validation (30 seconds)
const API_KEY_TEST_TIMEOUT_MS = 30000;

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const testClient = new Anthropic({ apiKey, timeout: API_KEY_TEST_TIMEOUT_MS });
    await testClient.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    });
    return true;
  } catch {
    return false;
  }
}
