/**
 * Prompts Claude externalisés
 * Utilise des fonctions template pour gérer les variables dynamiques
 */

export interface SermonContext {
  title: string;
  date?: string | null;
  bible_ref?: string | null;
  content: string;
}

/**
 * Formate un sermon pour l'injection dans le contexte
 */
function formatSermon(doc: SermonContext, maxContentLength = 2500): string {
  const truncatedContent =
    doc.content.length > maxContentLength
      ? doc.content.substring(0, maxContentLength) + '...'
      : doc.content;

  return `---
<sermon>
<titre>${doc.title}</titre>
${doc.date ? `<date>${doc.date}</date>` : ''}
${doc.bible_ref ? `<reference>${doc.bible_ref}</reference>` : ''}
<contenu>
${truncatedContent}
</contenu>
</sermon>
---`;
}

/**
 * Formate le contexte complet avec plusieurs sermons
 */
function formatContext(sermons: SermonContext[]): string {
  return sermons.map((doc) => formatSermon(doc)).join('\n');
}

export const prompts = {
  /**
   * Prompt système pour le chat avec contexte de sermons
   */
  chatSystem: (sermons: SermonContext[] = [], totalDocumentCount?: number) => {
    const corpusInfo =
      totalDocumentCount !== undefined
        ? `INFORMATION CORPUS : L'utilisateur possède ${totalDocumentCount} sermon${totalDocumentCount > 1 ? 's' : ''} au total dans sa bibliothèque.${sermons.length > 0 ? ` Les ${sermons.length} sermons ci-dessous sont les plus pertinents pour la question posée.` : ''}\n\n`
        : '';

    const contextSection =
      sermons.length > 0
        ? `CONTEXTE - Sermons pertinents de l'utilisateur :

${formatContext(sermons)}

`
        : '';

    return `Tu es un assistant pour pasteurs protestants francophones. Tu aides à rechercher, analyser et exploiter leurs archives de sermons.

${corpusInfo}${contextSection}INSTRUCTIONS :
1. Base tes réponses prioritairement sur les sermons fournis quand c'est pertinent
2. Cite le titre du sermon quand tu t'en inspires (entre guillemets)
3. Si l'information n'est pas dans les sermons, indique-le clairement
4. Réponds en français, de manière pastorale et bienveillante
5. Sois concis mais complet
6. Pour les résumés, utilise des puces structurées
7. Pour les recherches, liste les sermons pertinents avec leurs dates
8. Pour les suggestions de préparation, propose des pistes concrètes

Tu es là pour aider, pas pour remplacer la réflexion théologique du pasteur.`;
  },

  /**
   * Prompt système pour la génération de résumé
   */
  summarizeSystem:
    'Tu es un assistant pour pasteurs. Résume les sermons de manière concise et structurée en français.',

  /**
   * Prompt utilisateur pour demander un résumé de sermon
   */
  summarizeUser: (title: string, content: string, maxContentLength = 8000) => {
    const truncatedContent =
      content.length > maxContentLength ? content.substring(0, maxContentLength) : content;

    return `Résume ce sermon intitulé "${title}" en 3-5 points clés :

${truncatedContent}`;
  },
} as const;

export type Prompts = typeof prompts;
