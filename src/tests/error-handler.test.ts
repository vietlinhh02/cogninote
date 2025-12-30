import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../middlewares/error-handler.js';
import { correlationIdMiddleware } from '../middlewares/correlation-id.js';

describe('Error Handler with Correlation ID', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(correlationIdMiddleware);
    app.use(express.json());
  });

  it('should handle AppError and include correlation ID in response', async () => {
    app.get('/app-error', () => {
      throw new AppError('Test application error', 400);
    });
    app.use(errorHandler);

    const response = await request(app).get('/app-error');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Test application error',
    });
    expect(response.body.correlationId).toBeDefined();
  });

  it('should handle generic errors and include correlation ID', async () => {
    app.get('/generic-error', () => {
      throw new Error('Generic error');
    });
    app.use(errorHandler);

    const response = await request(app).get('/generic-error');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Internal server error',
    });
    expect(response.body.correlationId).toBeDefined();
  });

  it('should use provided correlation ID from header', async () => {
    const testCorrelationId = 'test-error-correlation-123';

    app.get('/error-with-id', () => {
      throw new AppError('Test error', 400);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/error-with-id')
      .set('X-Correlation-ID', testCorrelationId);

    expect(response.status).toBe(400);
    expect(response.body.correlationId).toBe(testCorrelationId);
  });

  it('should create AppError with correct properties', () => {
    const error = new AppError('Test message', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
    expect(error.stack).toBeDefined();
  });

  it('should handle errors in async routes', async () => {
    app.get('/async-error', async (_req: Request, _res: Response) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      throw new AppError('Async error', 500);
    });
    app.use(errorHandler);

    const response = await request(app).get('/async-error');

    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Async error',
    });
    expect(response.body.correlationId).toBeDefined();
  });

  it('should handle errors from middleware', async () => {
    app.use((_req: Request, _res: Response, next: NextFunction) => {
      next(new AppError('Middleware error', 403));
    });
    app.use(errorHandler);

    const response = await request(app).get('/any-route');

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      status: 'error',
      message: 'Middleware error',
    });
  });

  it('should preserve correlation ID across error handling', async () => {
    const testCorrelationId = 'preserve-test-123';

    app.get('/preserve-id', () => {
      throw new AppError('Preservation test', 400);
    });
    app.use(errorHandler);

    const response = await request(app)
      .get('/preserve-id')
      .set('X-Correlation-ID', testCorrelationId);

    expect(response.headers['x-correlation-id']).toBe(testCorrelationId);
    expect(response.body.correlationId).toBe(testCorrelationId);
  });
});
