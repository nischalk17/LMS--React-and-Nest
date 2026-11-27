/** True when Postgres rejected the write for a unique-constraint violation (23505). */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { driverError?: { code?: string } }).driverError?.code === '23505'
  );
}

/** Escapes backslash, % and _ so user input matches literally inside an ILIKE pattern. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (ch: string) => '\\' + ch);
}
