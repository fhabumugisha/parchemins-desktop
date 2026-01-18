import Anthropic from '@anthropic-ai/sdk';
import { getCredits, updateCredits, searchDocuments, getDocumentById } from './database.service';
import { retrieveApiKey, hasApiKey } from './secure-storage.service';
import type { ChatResponse } from '../../shared/types';
import { MAX_CONTEXT_DOCUMENTS, TOKENS_PER_CREDIT } from '../../shared/constants';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = retrieveApiKey();
    if (!apiKey) {
      throw new Error('Cle API Anthropic non configuree. Veuillez la configurer dans les parametres.');
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

  const relevantDocs = searchDocuments(request.message, MAX_CONTEXT_DOCUMENTS);

  const context = relevantDocs
    .map(
      (doc) => `
---
<sermon>
<titre>${doc.title}</titre>
${doc.date ? `<date>${doc.date}</date>` : ''}
${doc.bible_ref ? `<reference>${doc.bible_ref}</reference>` : ''}
<contenu>
${doc.content.substring(0, 2500)}${doc.content.length > 2500 ? '...' : ''}
</contenu>
</sermon>
---`
    )
    .join('\n');

  const systemPrompt = `Tu es un assistant pour pasteurs protestants francophones. Tu aides a rechercher, analyser et exploiter leurs archives de sermons.

${
  relevantDocs.length > 0
    ? `CONTEXTE - Sermons pertinents de l'utilisateur :

${context}

`
    : ''
}INSTRUCTIONS :
1. Base tes reponses prioritairement sur les sermons fournis quand c'est pertinent
2. Cite le titre du sermon quand tu t'en inspires (entre guillemets)
3. Si l'information n'est pas dans les sermons, indique-le clairement
4. Reponds en francais, de maniere pastorale et bienveillante
5. Sois concis mais complet
6. Pour les resumes, utilise des puces structurees
7. Pour les recherches, liste les sermons pertinents avec leurs dates
8. Pour les suggestions de preparation, propose des pistes concretes

Tu es la pour aider, pas pour remplacer la reflexion theologique du pasteur.`;

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
      throw new Error('Cle API invalide. Verifiez vos parametres.');
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new Error('Limite de requetes atteinte. Reessayez dans quelques instants.');
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
    system: 'Tu es un assistant pour pasteurs. Resume les sermons de maniere concise et structuree en francais.',
    messages: [
      {
        role: 'user',
        content: `Resume ce sermon intitule "${doc.title}" en 3-5 points cles :

${doc.content.substring(0, 8000)}`,
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
