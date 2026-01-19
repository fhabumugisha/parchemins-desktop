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
    confirm: 'Confirmer',
    delete: 'Supprimer',
    modify: 'Modifier',
    continue: 'Continuer',
    skip: 'Passer',
    back: 'Retour',
    close: 'Fermer',
    reduce: 'Réduire',
    expand: 'Étendre',
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
    editTitle: 'Modifier le titre',
  },

  // Dossiers
  folders: {
    selectFolder: 'Sélectionner un dossier',
    changeFolder: 'Changer de dossier',
    indexing: 'Indexation...',
    cancelIndexing: 'Annuler',
    indexingCancelled: 'Indexation annulée',
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
      title: "Clé d'accès IA",
      configured: 'Accès configuré',
      securelyStored: 'Stockée de manière sécurisée',
      configure: "Configurer l'accès",
      savedSuccess: 'Clé enregistrée avec succès',
      confirmDelete: "Êtes-vous sûr de vouloir supprimer la clé d'accès ?",
      description:
        "Pour utiliser l'assistant IA, vous devez configurer votre clé d'accès IA. Obtenez-en une sur",
      configLater: "Vous pourrez configurer la clé d'accès plus tard dans les paramètres.",
      encryptionUnavailable: "Le stockage sécurisé n'est pas disponible sur ce système. La fonctionnalité IA est désactivée.",
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
      title: 'Crédits & Usage',
      count: (n: number) => `${n} crédit${n > 1 ? 's' : ''}`,
      description: "1 crédit = 1 question à l'assistant IA",
      buyCredits: 'Obtenir des crédits',
      buyCreditsComingSoon: 'Bientôt disponible',
      resetCredits: 'Réinitialiser les crédits',
      resetSuccess: 'Crédits réinitialisés à 100',
      warning: (n: number) => `Attention : il vous reste seulement ${n} crédit${n > 1 ? 's' : ''}.`,
      exhausted: 'Crédits épuisés',
      exhaustedDesc: "Vous pouvez toujours rechercher et consulter vos sermons. L'assistant IA sera disponible dès que vous aurez des crédits.",
      searchStillWorks: 'La recherche dans vos sermons reste disponible',
      usageTitle: 'Utilisation (30 derniers jours)',
      totalCost: (cost: number) => `Coût total : ${cost.toFixed(4)} $`,
      totalQuestions: (n: number) => `${n} question${n > 1 ? 's' : ''} posée${n > 1 ? 's' : ''}`,
      avgCost: (cost: number) => `Moy. ${cost.toFixed(4)} $/question`,
    },

    // À propos
    about: {
      title: 'À propos',
      version: 'Version',
      subtitle: 'Parchemins - Dialoguez avec vos sermons',
      poweredBy: "Propulsé par l'intelligence artificielle",
    },

    // Feedback
    feedback: {
      title: 'Retours & Suggestions',
      description: 'Aidez-nous à améliorer Parchemins en partageant vos retours, suggestions ou bugs rencontrés.',
      button: 'Donner mon avis',
    },
  },

  // Chat
  chat: {
    configRequired: 'Configuration requise',
    configRequiredDesc:
      "Pour utiliser l'assistant IA, vous devez configurer votre clé d'accès IA dans les paramètres.",
    goToSettings: 'Aller aux paramètres',
    thinking: 'Réflexion en cours...',
    sourcesUsed: 'Sources utilisées :',
    newChat: 'Nouvelle conversation',
    confirmNewChat: 'Commencer une nouvelle conversation ? L\'historique actuel sera effacé.',
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
    summarizing: (title: string) => `Résumé de "${title}" en cours...`,
    summarized: (title: string) => `Résumé généré depuis "${title}"`,
  },

  // Onboarding
  onboarding: {
    welcome: {
      title: 'Bienvenue dans Parchemins',
      description:
        "Dialoguez avec vos sermons grâce à l'intelligence artificielle. Configurons votre application en quelques étapes.",
    },
    apiKey: {
      title: "Connexion à l'assistant IA",
      description:
        "Pour dialoguer avec vos sermons, l'application utilise une intelligence artificielle.",
      whatIsApiKey: "Qu'est-ce qu'une clé d'accès ?",
      apiKeyExplanation:
        "C'est comme un mot de passe qui permet à l'application de communiquer avec l'assistant IA. Vous en obtenez une gratuitement en créant un compte sur le site du fournisseur.",
      steps: {
        step1: 'Créez un compte gratuit sur le site du fournisseur',
        step2: 'Cliquez sur "API Keys" puis "Create Key"',
        step3: 'Copiez la clé et collez-la ci-dessous',
      },
      getKey: "Obtenir ma clé d'accès",
      skipForNow: 'Plus tard (recherche locale uniquement)',
      securityNote: 'Votre clé est stockée de manière sécurisée sur votre ordinateur uniquement.',
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
    apiKeyNotConfigured: "Clé d'accès IA non configurée. Veuillez la configurer dans les paramètres.",
    apiKeyInvalid: "Clé d'accès invalide. Vérifiez et réessayez.",
    rateLimitReached: 'Limite de requêtes atteinte. Réessayez dans quelques instants.',
    encryptionUnavailable: "Le stockage sécurisé n'est pas disponible sur ce système. Impossible d'enregistrer la clé.",
    securityError: 'Erreur de sécurité. Veuillez réessayer.',
    aiServiceError: "Le service IA est temporairement indisponible. Réessayez plus tard.",
    genericError: 'Une erreur est survenue',
    unknownError: 'Erreur inconnue',
    reload: "Recharger l'application",
  },
} as const;

export type Messages = typeof messages;
