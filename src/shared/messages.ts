/**
 * Messages et libellés de l'interface utilisateur
 * Centralisés pour faciliter la maintenance et une future internationalisation
 */

export const messages = {
  // Commun
  common: {
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    modify: 'Modifier',
    continue: 'Continuer',
    skip: 'Passer',
    back: 'Retour',
    close: 'Fermer',
    reduce: 'Réduire',
    search: 'Rechercher',
    copy: 'Copier',
    copied: 'Copié !',
  },

  // Navigation
  nav: {
    chat: 'Chat',
    documents: 'Documents',
    settings: 'Paramètres',
  },

  // Documents
  documents: {
    selectDocument: 'Sélectionnez un document',
    selectDocumentInList: 'Sélectionnez un document dans la liste',
    noResult: 'Aucun résultat',
    noDocumentIndexed: 'Aucun document indexé',
    words: 'mots',
    unknownDate: 'Date inconnue',
    summarize: 'Résumer',
    openFile: 'Ouvrir le fichier',
    deleteFromIndex: "Supprimer de l'index",
    confirmDelete: (title: string) => `Supprimer "${title}" de l'index ?`,
    openInApp: "Ouvrir dans l'application",
    sermonsCount: (count: number) => `${count} sermon${count > 1 ? 's' : ''}`,
  },

  // Dossiers
  folders: {
    selectFolder: 'Sélectionner un dossier',
    changeFolder: 'Changer de dossier',
    indexing: 'Indexation...',
    noFolderConfigured: 'Aucun dossier configuré',
    sermonsFolder: 'Dossier de sermons',
    searchInSermons: 'Rechercher dans les sermons...',
    indexingFile: (file: string, current: number, total: number) =>
      `Indexation de ${file} (${current}/${total})`,
    preparation: 'Préparation...',
    forceReindex: 'Forcer la ré-indexation',
    forceReindexDescription: 'Ré-extraire le contenu de tous les documents (utile après une mise à jour)',
    reindexSuccess: (updated: number) => `${updated} document${updated > 1 ? 's' : ''} mis à jour`,
  },

  // Paramètres
  settings: {
    title: 'Paramètres',

    // Clé API
    apiKey: {
      title: 'Clé API Anthropic',
      configured: 'Clé API configurée',
      securelyStored: 'Stockée de manière sécurisée',
      configure: 'Configurer la clé API',
      savedSuccess: 'Clé API enregistrée avec succès',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer la clé API ?',
      description:
        "Pour utiliser l'assistant IA, vous devez configurer votre clé API Anthropic. Obtenez-en une sur",
      configLater: 'Vous pourrez configurer la clé API plus tard dans les paramètres.',
    },

    // Affichage
    display: {
      title: 'Affichage',
      textSize: 'Taille du texte',
      small: 'Petit',
      medium: 'Moyen',
      large: 'Grand',
    },

    // Crédits
    credits: {
      title: 'Crédits',
      count: (n: number) => `${n} crédit${n > 1 ? 's' : ''}`,
      description: "1 crédit = 1 question à l'assistant IA",
      buyCredits: 'Acheter des crédits (bientôt disponible)',
      warning: (n: number) => `Attention : il vous reste seulement ${n} crédit${n > 1 ? 's' : ''}.`,
      exhausted: "Crédits épuisés. Achetez des crédits pour continuer à utiliser l'assistant.",
    },

    // À propos
    about: {
      title: 'À propos',
      version: 'Version',
      electron: 'Electron',
      chrome: 'Chrome',
      nodejs: 'Node.js',
      subtitle: 'Parchemins - Dialoguez avec vos sermons',
      poweredBy: "Utilise l'API Claude d'Anthropic",
    },
  },

  // Chat
  chat: {
    configRequired: 'Configuration requise',
    configRequiredDesc:
      "Pour utiliser l'assistant IA, vous devez configurer votre clé API Anthropic dans les paramètres.",
    thinking: 'Réflexion en cours...',
    sourcesUsed: 'Sources utilisées :',
    welcome: {
      title: 'Bienvenue, cher pasteur',
      description:
        'Posez-moi vos questions sur vos sermons. Je peux rechercher, résumer, comparer et vous aider à préparer vos prédications.',
      suggestions: {
        searchGrace: 'Trouve mes sermons sur la grâce',
        summarizeLast: 'Résume mon dernier sermon',
        easterThemes: 'Quels thèmes pour Pâques ?',
        forgivenessCheck: 'Ai-je déjà parlé du pardon ?',
      },
    },
    inputPlaceholder: 'Posez votre question...',
  },

  // Onboarding
  onboarding: {
    welcome: {
      title: 'Bienvenue dans Parchemins',
      description:
        "Dialoguez avec vos sermons grâce à l'intelligence artificielle. Configurons votre application en quelques étapes.",
    },
    apiKey: {
      title: 'Clé API Anthropic',
      description:
        "Pour utiliser l'IA, vous avez besoin d'une clé API Anthropic. Vous pouvez l'obtenir gratuitement sur console.anthropic.com",
    },
    sermons: {
      title: 'Vos sermons',
      description:
        'Sélectionnez le dossier contenant vos sermons. Les formats PDF, Word, Markdown et ODT sont supportés.',
    },
    start: 'Commencer',
    configureLater: 'Configurer plus tard',
  },

  // Erreurs
  errors: {
    apiKeyNotConfigured: 'Clé API Anthropic non configurée. Veuillez la configurer dans les paramètres.',
    apiKeyInvalid: 'Clé API invalide. Vérifiez et réessayez.',
    rateLimitReached: 'Limite de requêtes atteinte. Réessayez dans quelques instants.',
    genericError: 'Une erreur est survenue',
    unknownError: 'Erreur inconnue',
    reload: "Recharger l'application",
  },
} as const;

export type Messages = typeof messages;
