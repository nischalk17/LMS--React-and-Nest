// E2E tests run against a throwaway database whose schema is auto-created.
// Point TEST_DB_* at any empty Postgres database (CI service container, local, ...).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.DB_HOST = process.env.TEST_DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT ?? '5432';
process.env.DB_USERNAME = process.env.TEST_DB_USERNAME ?? 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD ?? 'postgres';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'lms_test';
process.env.DB_SYNCHRONIZE = 'true';
delete process.env.DATABASE_URL;
