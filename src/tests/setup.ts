// Test setup file
import { config } from '../config/index.js';

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
}));

// Global teardown
afterAll(async () => {
  // Close all connections
  await new Promise((resolve) => setTimeout(resolve, 500));
});
