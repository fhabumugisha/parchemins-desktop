const isDev = process.env.NODE_ENV === 'development';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: string, message: string, data?: unknown): string {
  const timestamp = formatTimestamp();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
}

export const logger = {
  info(message: string, data?: unknown): void {
    const formatted = formatMessage('info', message, data);
    if (isDev) {
      console.log(formatted);
    }
  },

  warn(message: string, data?: unknown): void {
    const formatted = formatMessage('warn', message, data);
    if (isDev) {
      console.warn(formatted);
    }
  },

  error(message: string, data?: unknown): void {
    const formatted = formatMessage('error', message, data);
    console.error(formatted);
  },
};
