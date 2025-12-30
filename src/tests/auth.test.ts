import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.routes.js';
import { errorHandler } from '../middlewares/error-handler.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'SecurePassword123',
        fullName: 'Test User',
      });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with weak password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: '123',
      });

      expect(response.status).toBe(400);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'SecurePassword123',
      });

      expect(response.status).toBe(400);
    });

    it('should fail when user already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123',
      };

      await request(app).post('/api/auth/register').send(userData);

      const response = await request(app).post('/api/auth/register').send(userData);

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'logintest@example.com',
        password: 'SecurePassword123',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'SecurePassword123',
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'logintest@example.com',
        password: 'WrongPassword123',
      });

      expect(response.status).toBe(401);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SecurePassword123',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'refresh@example.com',
        password: 'SecurePassword123',
      });

      const refreshToken = registerResponse.body.data.tokens.refreshToken;

      const response = await request(app).post('/api/auth/refresh').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid refresh token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'logout@example.com',
        password: 'SecurePassword123',
      });

      const refreshToken = registerResponse.body.data.tokens.refreshToken;

      const response = await request(app).post('/api/auth/logout').send({
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid access token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'profile@example.com',
        password: 'SecurePassword123',
        fullName: 'Profile Test',
      });

      const accessToken = registerResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('profile@example.com');
      expect(response.body.data.user.fullName).toBe('Profile Test');
    });

    it('should fail without access token', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
    });

    it('should fail with invalid access token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices with valid access token', async () => {
      const registerResponse = await request(app).post('/api/auth/register').send({
        email: 'logoutall@example.com',
        password: 'SecurePassword123',
      });

      const accessToken = registerResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out from all devices');
    });
  });
});
