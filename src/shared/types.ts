export interface Document {
  id: number;
  path: string;
  title: string;
  content: string;
  date: string | null;
  bible_ref: string | null;
  word_count: number;
  hash: string;
  indexed_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number;
  created_at: string;
}

export interface Settings {
  anthropic_api_key?: string;
  sermons_folder?: string;
  font_size?: 'small' | 'medium' | 'large';
}

export interface IndexingProgress {
  total: number;
  current: number;
  currentFile: string;
}

export interface ChatResponse {
  response: string;
  tokensUsed: number;
  sources: Array<{
    id: number;
    title: string;
    snippet: string;
  }>;
}

export interface IndexingResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}
