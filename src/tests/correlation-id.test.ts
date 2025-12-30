import request from 'supertest';
import express, { Application } from 'express';
import { correlationIdMiddleware } from '../middlewares/correlation-id.js';
import { logger, asyncLocalStorage } from '../utils/logger.js';

describe('Correlation ID Middleware', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(correlationIdMiddleware);
    app.get('/test', (_req, res) => {
      const store = asyncLocalStorage.getStore();
      res.json({ correlationId: store?.correlationId });
    });
  });

  it('should generate a correlation ID when none is provided', async () => {
    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.headers['x-correlation-id']).toBeDefined();
    expect(response.body.correlationId).toBeDefined();
    expect(typeof response.body.correlationId).toBe('string');
  });

  it('should use provided correlation ID from header', async () => {
    const testCorrelationId = 'test-correlation-id-123';

    const response = await request(app)
      .get('/test')
      .set('X-Correlation-ID', testCorrelationId);

    expect(response.status).toBe(200);
    expect(response.headers['x-correlation-id']).toBe(testCorrelationId);
    expect(response.body.correlationId).toBe(testCorrelationId);
  });

  it('should set correlation ID in response header', async () => {
    const response = await request(app).get('/test');

    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('should maintain correlation ID throughout request lifecycle', async () => {
    const testCorrelationId = 'test-lifecycle-123';
    let capturedCorrelationId: string | undefined;

    app.get('/lifecycle', (_req, res) => {
      const store = asyncLocalStorage.getStore();
      capturedCorrelationId = store?.correlationId;

      // Simulate async operation
      setTimeout(() => {
        const asyncStore = asyncLocalStorage.getStore();
        expect(asyncStore?.correlationId).toBe(testCorrelationId);
        res.json({ success: true });
      }, 10);
    });

    await request(app)
      .get('/lifecycle')
      .set('X-Correlation-ID', testCorrelationId);

    expect(capturedCorrelationId).toBe(testCorrelationId);
  });

  it('should generate unique correlation IDs for concurrent requests', async () => {
    const responses = await Promise.all([
      request(app).get('/test'),
      request(app).get('/test'),
      request(app).get('/test'),
    ]);

    const correlationIds = responses.map(r => r.headers['x-correlation-id']);

    // All should be defined
    correlationIds.forEach(id => expect(id).toBeDefined());

    // All should be unique
    const uniqueIds = new Set(correlationIds);
    expect(uniqueIds.size).toBe(3);
  });
});
