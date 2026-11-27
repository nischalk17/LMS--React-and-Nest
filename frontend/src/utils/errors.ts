import { isAxiosError } from 'axios';

const NETWORK_MESSAGE =
  'Cannot reach the server. If it was idle it may be waking up; wait a few seconds and try again.';

/**
 * Turns anything thrown into a readable message:
 * - API errors (Nest may return an array of validation messages)
 * - plain strings (Redux thunks reject with the message string)
 * - network failures / timeouts (no response at all)
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'string' && err) return err;
  if (isAxiosError(err)) {
    if (!err.response) return NETWORK_MESSAGE;
    const message = err.response.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message) return message;
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
