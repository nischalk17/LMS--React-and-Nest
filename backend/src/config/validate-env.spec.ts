import { validateEnv } from './validate-env';

describe('validateEnv', () => {
  it('requires JWT_SECRET', () => {
    expect(() => validateEnv({})).toThrow(/JWT_SECRET is required/);
  });

  it('rejects a short secret in production only', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', JWT_SECRET: 'short' }),
    ).toThrow(/at least 32/);
    expect(() =>
      validateEnv({ NODE_ENV: 'development', JWT_SECRET: 'short' }),
    ).not.toThrow();
  });

  it('accepts a long production secret', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(48) }),
    ).not.toThrow();
  });
});
