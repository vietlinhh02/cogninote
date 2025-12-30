import request from 'supertest';
import App from '../app.js';

describe('Health Endpoint', () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app.app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
    });

    it('should include database status', async () => {
      const response = await request(app.app).get('/api/health');

      expect(response.body.services).toHaveProperty('database');
    });

    it('should include redis status', async () => {
      const response = await request(app.app).get('/api/health');

      expect(response.body.services).toHaveProperty('redis');
    });
  });
});
