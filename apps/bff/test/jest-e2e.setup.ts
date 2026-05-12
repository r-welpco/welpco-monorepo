// Global test setup for E2E tests
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.FRONTEND_URL = 'http://localhost:8080';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
// E2E tests: PostgreSQL must be running. Schema is not auto-synced in test (synchronize off).
// Ensure DB has schema (run migrations or seed once), or use a dedicated test DB.
