export const IPC_CHANNELS = {
  // Documents
  DOCUMENTS_GET_ALL: 'documents:getAll',
  DOCUMENTS_GET_BY_ID: 'documents:getById',
  DOCUMENTS_DELETE: 'documents:delete',
  DOCUMENTS_OPEN_EXTERNAL: 'documents:openExternal',

  // Indexation
  INDEXER_SELECT_FOLDER: 'indexer:selectFolder',
  INDEXER_INDEX_FOLDER: 'indexer:indexFolder',
  INDEXER_FORCE_REINDEX: 'indexer:forceReindex',
  INDEXER_CANCEL: 'indexer:cancel',
  INDEXER_PROGRESS: 'indexer:progress',

  // Recherche
  SEARCH_QUERY: 'search:query',

  // Chat
  CHAT_SEND: 'chat:send',
  CHAT_SUMMARIZE: 'chat:summarize',
  CHAT_TEST_API_KEY: 'chat:testApiKey',
  CHAT_IS_CONFIGURED: 'chat:isConfigured',

  // Credits
  CREDITS_GET: 'credits:get',
  CREDITS_PURCHASE: 'credits:purchase',

  // Parametres
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
