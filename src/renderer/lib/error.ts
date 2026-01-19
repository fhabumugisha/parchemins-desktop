/**
 * Safely extract error message from unknown error type.
 * Use this instead of unsafe `(error as Error).message` casting.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}
