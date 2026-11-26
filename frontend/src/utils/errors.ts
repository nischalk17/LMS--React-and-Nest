import { isAxiosError } from 'axios';

/** Extract a readable message from an API error (Nest may return an array). */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const message = err.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
