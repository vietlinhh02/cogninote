import { config } from '../config/index.js';

describe('Configuration', () => {
  describe('Environment Variables', () => {
    it('should load environment configuration', () => {
      expect(config).toBeDefined();
      expect(config.env).toBe('test');
    });

    it('should have database configuration', () => {
      expect(config.database).toBeDefined();
      expect(config.database.host).toBeDefined();
      expect(config.database.port).toBeDefined();
      expect(config.database.name).toBeDefined();
    });

    it('should have redis configuration', () => {
      expect(config.redis).toBeDefined();
      expect(config.redis.host).toBeDefined();
      expect(config.redis.port).toBeDefined();
    });

    it('should have JWT configuration', () => {
      expect(config.jwt).toBeDefined();
      expect(config.jwt.secret).toBeDefined();
      expect(config.jwt.expiresIn).toBeDefined();
    });

    it('should have port configured', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
    });
  });

  describe('Security Configuration', () => {
    it('should have JWT secret', () => {
      expect(config.jwt.secret).toBeTruthy();
      expect(config.jwt.secret.length).toBeGreaterThan(10);
    });

    it('should have CORS configuration', () => {
      expect(config.cors).toBeDefined();
      expect(config.cors.origin).toBeDefined();
    });
  });

  describe('External Services Configuration', () => {
    it('should have Gemini AI configuration', () => {
      expect(config.gemini).toBeDefined();
    });

    it('should have Recall AI configuration', () => {
      expect(config.recallAI).toBeDefined();
      expect(config.recallAI.endpoint).toBeDefined();
    });

    it('should have rate limiting configuration', () => {
      expect(config.rateLimit).toBeDefined();
      expect(config.rateLimit.windowMs).toBeDefined();
      expect(config.rateLimit.max).toBeDefined();
    });
  });
});
