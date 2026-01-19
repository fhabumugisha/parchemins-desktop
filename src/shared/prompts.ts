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
function formatSermon(doc: SermonContext, id: number, maxContentLength = 2500): string {
  const truncatedContent =
    doc.content.length > maxContentLength
      ? doc.content.substring(0, maxContentLength) + '...'
      : doc.content;

  return `---
<sermon id="${id}">
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
 * Formate un sermon référencé (contenu complet, pas de truncation)
 */
function formatReferencedSermon(doc: SermonContext): string {
  return `---
<sermon_reference>
<titre>${doc.title}</titre>
${doc.date ? `<date>${doc.date}</date>` : ''}
${doc.bible_ref ? `<reference>${doc.bible_ref}</reference>` : ''}
<contenu>
${doc.content}
</contenu>
</sermon_reference>
---`;
}

/**
 * Formate le contexte complet avec plusieurs sermons
 * Chaque sermon reçoit un ID (1-indexed) pour traçabilité
 */
function formatContext(sermons: SermonContext[]): string {
  return sermons.map((doc, index) => formatSermon(doc, index + 1)).join('\n');
}

/**
 * Formate les sermons référencés (contenu complet)
 */
function formatReferencedContext(sermons: SermonContext[]): string {
  return sermons.map((doc) => formatReferencedSermon(doc)).join('\n');
}

export const prompts = {
  /**
   * Prompt système pour le chat avec recherche automatique de sermons pertinents
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
9. IMPORTANT: À la fin de ta réponse, indique les sermons que tu as utilisés avec le format exact: [SOURCES: 1, 3, 5] (liste les IDs des sermons cités ou utilisés, séparés par des virgules). Si tu n'as utilisé aucun sermon, écris [SOURCES: aucune]

Tu es là pour aider, pas pour remplacer la réflexion théologique du pasteur.`;
  },

  /**
   * Prompt système quand l'utilisateur référence explicitement des sermons avec @
   * Utilise UNIQUEMENT les sermons référencés avec leur contenu INTÉGRAL
   */
  chatSystemWithReferences: (referencedSermons: SermonContext[], totalDocumentCount?: number) => {
    const corpusInfo =
      totalDocumentCount !== undefined
        ? `INFORMATION CORPUS : L'utilisateur possède ${totalDocumentCount} sermon${totalDocumentCount > 1 ? 's' : ''} au total dans sa bibliothèque.\n\n`
        : '';

    const sermonsSection = `SERMONS SÉLECTIONNÉS PAR L'UTILISATEUR (contenu intégral) :

${formatReferencedContext(referencedSermons)}

`;

    return `Tu es un assistant pour pasteurs protestants francophones. Tu aides à rechercher, analyser et exploiter leurs archives de sermons.

${corpusInfo}${sermonsSection}INSTRUCTIONS :
1. L'utilisateur a explicitement sélectionné ${referencedSermons.length} sermon${referencedSermons.length > 1 ? 's' : ''} avec @
2. Tu dois te baser UNIQUEMENT sur ${referencedSermons.length > 1 ? 'ces sermons' : 'ce sermon'} pour ta réponse
3. Tu as accès au contenu INTÉGRAL ${referencedSermons.length > 1 ? 'de ces sermons' : 'de ce sermon'}
4. Cite le titre du sermon quand tu t'en inspires (entre guillemets)
5. Réponds en français, de manière pastorale et bienveillante
6. Sois complet et détaillé puisque tu as le contenu intégral
7. Pour les résumés, utilise des puces structurées
8. Pour les analyses, explore en profondeur le contenu fourni

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
