export const IPC_CHANNELS = {
  // Documents
  DOCUMENTS_GET_ALL: 'documents:getAll',
  DOCUMENTS_GET_BY_ID: 'documents:getById',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_OPEN_EXTERNAL: 'documents:openExternal',
  DOCUMENTS_UPDATE_TITLE: 'documents:updateTitle',

  // Indexation
  INDEXER_SELECT_FOLDER: 'indexer:selectFolder',
  INDEXER_INDEX_FOLDER: 'indexer:indexFolder',
  INDEXER_FORCE_REINDEX: 'indexer:forceReindex',
  INDEXER_CANCEL: 'indexer:cancel',
  INDEXER_PROGRESS: 'indexer:progress',

  // Recherche
  SEARCH_QUERY: 'search:query',
  SEARCH_SEMANTIC: 'search:semantic',
  SEARCH_HYBRID: 'search:hybrid',

  // Embeddings
  EMBEDDINGS_INDEX_MISSING: 'embeddings:indexMissing',
  EMBEDDINGS_GET_STATS: 'embeddings:getStats',

  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_SUMMARIZE: 'chat:summarize',
  CHAT_TEST_API_KEY: 'chat:testApiKey',
  CHAT_IS_CONFIGURED: 'chat:isConfigured',

  // Credits
  CREDITS_GET: 'credits:get',
  CREDITS_PURCHASE: 'credits:purchase',
  CREDITS_RESET: 'credits:reset',

  // Usage stats
  USAGE_GET_STATS: 'usage:getStats',
  USAGE_GET_BY_MONTH: 'usage:getByMonth',
  USAGE_GET_TODAY: 'usage:getToday',

  // Parametres
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
  SETTINGS_SAVE_API_KEY: 'settings:saveApiKey',
  SETTINGS_DELETE_API_KEY: 'settings:deleteApiKey',
  SETTINGS_HAS_API_KEY: 'settings:hasApiKey',
  SETTINGS_GET_APP_INFO: 'settings:getAppInfo',
  SETTINGS_OPEN_EXTERNAL: 'settings:openExternal',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
