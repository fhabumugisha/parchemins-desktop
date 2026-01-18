import Anthropic from '@anthropic-ai/sdk';
import { getCredits, updateCredits, searchDocuments, getDocumentById, getAllDocuments } from './database.service';
import { retrieveApiKey, hasApiKey } from './secure-storage.service';
import type { ChatResponse } from '../../shared/types';
import { MAX_CONTEXT_DOCUMENTS, TOKENS_PER_CREDIT } from '../../shared/constants';
import { messages as i18n } from '../../shared/messages';
import { prompts, type SermonContext } from '../../shared/prompts';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = retrieveApiKey();
    if (!apiKey) {
      throw new Error(i18n.errors.apiKeyNotConfigured);
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function resetClaudeClient(): void {
  client = null;
}

export function isApiKeyConfigured(): boolean {
  return hasApiKey();
}

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const credits = getCredits();
  if (credits <= 0) {
    throw new Error('Credits insuffisants. Veuillez acheter des credits pour continuer.');
  }

  // Recherche par mots-clés
  let relevantDocs = searchDocuments(request.message, MAX_CONTEXT_DOCUMENTS);

  // Fallback: si aucun résultat, charger tous les documents
  if (relevantDocs.length === 0) {
    const allDocs = getAllDocuments().slice(0, MAX_CONTEXT_DOCUMENTS);
    relevantDocs = allDocs.map((doc) => ({
      ...doc,
      rank: 0,
      snippet: doc.content.substring(0, 200) + '...',
    }));
  }

  // Convertir les documents en SermonContext pour les prompts
  const sermonContexts: SermonContext[] = relevantDocs.map((doc) => ({
    title: doc.title,
    date: doc.date,
    bible_ref: doc.bible_ref,
    content: doc.content,
  }));

  const systemPrompt = prompts.chatSystem(sermonContexts);

  const messages: Anthropic.MessageParam[] = [
    ...(request.conversationHistory || []).map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: request.message },
  ];

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    const creditsUsed = Math.ceil(tokensUsed / TOKENS_PER_CREDIT);
    updateCredits(-creditsUsed);

    const textContent = response.content.find((c) => c.type === 'text');
    const responseText = textContent?.type === 'text' ? textContent.text : '';

    return {
      response: responseText,
      tokensUsed,
      sources: relevantDocs.map((d) => ({
        id: d.id,
        title: d.title,
        snippet: d.snippet || d.content.substring(0, 200) + '...',
      })),
    };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new Error(i18n.errors.apiKeyInvalid);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error(i18n.errors.rateLimitReached);
    }
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Erreur API Anthropic: ${error.message}`);
    }
    throw error;
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

  const response = await getClient().messages.create({
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

  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
  const creditsUsed = Math.ceil(tokensUsed / TOKENS_PER_CREDIT);
  updateCredits(-creditsUsed);

  const textContent = response.content.find((c) => c.type === 'text');
  return textContent?.type === 'text' ? textContent.text : '';
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const testClient = new Anthropic({ apiKey });
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
