/**
 * Fails fast at boot instead of failing later in confusing ways.
 * Passed to ConfigModule.forRoot({ validate }).
 */
export function validateEnv(config: Record<string, unknown>) {
  const secret = config.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('JWT_SECRET is required (see backend/.env.example)');
  }
  if (config.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production. ' +
        "Generate one: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
  }
  return config;
}
