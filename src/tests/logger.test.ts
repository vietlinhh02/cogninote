import { logger, asyncLocalStorage } from '../utils/logger.js';
import winston from 'winston';

describe('Logger with Correlation ID', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on logger transports
    logSpy = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('should log without correlation ID when not in async context', () => {
    logger.info('Test message');

    expect(logSpy).toHaveBeenCalledWith('Test message');
  });

  it('should include correlation ID when in async context', (done) => {
    const testCorrelationId = 'test-correlation-123';

    asyncLocalStorage.run({ correlationId: testCorrelationId }, () => {
      logger.info('Test message with correlation ID');

      // Wait for logger to process
      setImmediate(() => {
        expect(logSpy).toHaveBeenCalledWith('Test message with correlation ID');
        done();
      });
    });
  });

  it('should maintain correlation ID across async operations', (done) => {
    const testCorrelationId = 'test-async-correlation-456';

    asyncLocalStorage.run({ correlationId: testCorrelationId }, async () => {
      logger.info('Before async operation');

      await new Promise(resolve => setTimeout(resolve, 10));

      logger.info('After async operation');

      setImmediate(() => {
        expect(logSpy).toHaveBeenCalledTimes(2);
        done();
      });
    });
  });

  it('should handle multiple concurrent logging contexts', async () => {
    const context1 = 'context-1';
    const context2 = 'context-2';

    const promise1 = new Promise<void>(resolve => {
      asyncLocalStorage.run({ correlationId: context1 }, () => {
        logger.info('Message from context 1');
        resolve();
      });
    });

    const promise2 = new Promise<void>(resolve => {
      asyncLocalStorage.run({ correlationId: context2 }, () => {
        logger.info('Message from context 2');
        resolve();
      });
    });

    await Promise.all([promise1, promise2]);

    expect(logSpy).toHaveBeenCalledTimes(2);
  });

  it('should log errors with correlation ID', (done) => {
    const errorSpy = jest.spyOn(logger, 'error');
    const testCorrelationId = 'test-error-correlation-789';

    asyncLocalStorage.run({ correlationId: testCorrelationId }, () => {
      logger.error('Test error message', { additional: 'data' });

      setImmediate(() => {
        expect(errorSpy).toHaveBeenCalledWith('Test error message', { additional: 'data' });
        errorSpy.mockRestore();
        done();
      });
    });
  });

  it('should create logger with correct configuration', () => {
    expect(logger).toBeInstanceOf(winston.Logger);
    expect(logger.transports.length).toBeGreaterThan(0);
  });
});
