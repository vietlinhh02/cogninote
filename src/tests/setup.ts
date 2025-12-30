// Test setup file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

// Increase timeout for tests
jest.setTimeout(10000);

// Mock logger to prevent console output during tests
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  asyncLocalStorage: {
    getStore: jest.fn(),
    run: jest.fn((_context, callback) => callback()),
  },
}));

// Global teardown
afterAll(async () => {
  // Close all connections
  await new Promise((resolve) => setTimeout(resolve, 500));
});
