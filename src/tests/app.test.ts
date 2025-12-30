import request from 'supertest';
import App from '../app.js';

describe('Application', () => {
  let app: App;

  beforeAll(() => {
    app = new App();
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app.app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('documentation');
      expect(response.body.name).toBe('CogniNote Backend API');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app.app)
        .get('/api/non-existent-route')
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Middleware Setup', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app.app)
        .options('/')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should parse JSON body', async () => {
      const response = await request(app.app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' })
        .set('Content-Type', 'application/json');

      expect(response.status).not.toBe(400);
    });
  });
});
