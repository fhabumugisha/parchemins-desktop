export const APP_NAME = 'Parchemins';

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.md', '.txt', '.odt'];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DEFAULT_CREDITS = 100;

export const TOKENS_PER_CREDIT = 1000;

export const MAX_CONTEXT_TOKENS = 4000;

export const MAX_CONTEXT_DOCUMENTS = 5;

// Liens externes
export const EXTERNAL_LINKS = {
  FEEDBACK_FORM: 'https://forms.gle/8Lof7r2o4xxuxokS8',
  ANTHROPIC_CONSOLE: 'https://console.anthropic.com/',
} as const;
