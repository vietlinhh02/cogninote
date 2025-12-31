import request from 'supertest';
import express from 'express';
import meetingRoutes from '../routes/meeting.routes.js';
import authRoutes from '../routes/auth.routes.js';
import { errorHandler } from '../middlewares/error-handler.js';
import { authenticate } from '../middlewares/auth.middleware.js';

// Create a mock app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use(errorHandler);

let accessToken: string;
let userId: string;

describe('Meeting API Endpoints', () => {
  // Setup: Register and login to get a valid token
  beforeAll(async () => {
    // Clean up potentially existing user from previous runs
    // In a real env, we'd truncate DB tables here

    // Register a new user
    const email = `test.meeting.${Date.now()}@example.com`;
    const password = 'SecurePassword123';

    const registerResponse = await request(app).post('/api/auth/register').send({
      email,
      password,
      fullName: 'Meeting Test User',
    });

    // If user already exists (e.g. from failed previous run), try login
    if (registerResponse.status === 409) {
      const loginResponse = await request(app).post('/api/auth/login').send({
        email,
        password,
      });
      accessToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    } else {
      accessToken = registerResponse.body.data.tokens.accessToken;
      userId = registerResponse.body.data.user.id;
    }
  });

  describe('POST /api/meetings', () => {
    it('should create a new meeting', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Meeting',
          description: 'This is a test meeting',
          scheduledAt: new Date().toISOString(),
          platform: 'Zoom',
          meetingUrl: 'https://zoom.us/j/123456789'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Meeting');
      expect(response.body.userId).toBe(userId);

      // Store ID for later tests if needed, but better to create fresh ones
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/meetings')
        .send({
          title: 'Unauthenticated Meeting'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/meetings', () => {
    it('should get all meetings for the user', async () => {
      // Create a few meetings first
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Meeting 1' });

      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Meeting 2' });

      const response = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meetings');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.meetings)).toBe(true);
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter meetings by status', async () => {
      // Create a meeting and start it
      const createResponse = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'In Progress Meeting' });

      const meetingId = createResponse.body.id;

      await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .get('/api/meetings?status=in_progress')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(1);
      expect(response.body.meetings[0].status).toBe('in_progress');
    });

    it('should filter meetings by platform', async () => {
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Zoom Meeting', platform: 'Zoom' });

      const response = await request(app)
        .get('/api/meetings?platform=Zoom')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(1);
      response.body.meetings.forEach((m: any) => {
        if (m.platform) {
          expect(m.platform).toBe('Zoom');
        }
      });
    });

    it('should search meetings by keyword', async () => {
      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Quarterly Review Meeting',
          description: 'Discuss Q4 performance'
        });

      const response = await request(app)
        .get('/api/meetings?search=Quarterly')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meetings.length).toBeGreaterThanOrEqual(1);
      const found = response.body.meetings.some((m: any) =>
        m.title.includes('Quarterly') || (m.description && m.description.includes('Quarterly'))
      );
      expect(found).toBe(true);
    });

    it('should filter meetings by date range', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Future Meeting',
          scheduledAt: futureDate.toISOString()
        });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);

      const response = await request(app)
        .get(`/api/meetings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      response.body.meetings.forEach((m: any) => {
        if (m.scheduledAt) {
          const scheduled = new Date(m.scheduledAt);
          expect(scheduled >= startDate && scheduled <= endDate).toBe(true);
        }
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/meetings?skip=0&take=2')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meetings.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Meeting Lifecycle Operations', () => {
    let meetingId: string;

    beforeEach(async () => {
      // Create a fresh meeting for each test
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Lifecycle Test Meeting' });
      meetingId = response.body.id;
    });

    it('should start a meeting', async () => {
      const response = await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
      expect(response.body.startedAt).toBeTruthy();
    });

    it('should pause a started meeting', async () => {
      // Start first
      await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .post(`/api/meetings/${meetingId}/pause`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('paused');
    });

    it('should resume a paused meeting', async () => {
      // Start and pause first
      await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app)
        .post(`/api/meetings/${meetingId}/pause`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .post(`/api/meetings/${meetingId}/resume`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('in_progress');
    });

    it('should end a meeting', async () => {
        // Start first
      await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .post(`/api/meetings/${meetingId}/end`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body.endedAt).toBeTruthy();
    });
  });

  describe('GET /api/meetings/:id', () => {
    let meetingId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Detail Test Meeting' });
      meetingId = response.body.id;
    });

    it('should get meeting details', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(meetingId);
    });

    it('should return 404 for non-existent meeting', async () => {
      const response = await request(app)
        .get('/api/meetings/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/meetings/:id', () => {
    let meetingId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Update Test Meeting' });
      meetingId = response.body.id;
    });

    it('should update meeting details', async () => {
      const response = await request(app)
        .put(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description'
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });
  });

  describe('DELETE /api/meetings/:id', () => {
    let meetingId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Delete Test Meeting' });
      meetingId = response.body.id;
    });

    it('should delete a meeting', async () => {
      const response = await request(app)
        .delete(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      // Verify it's gone
      const getResponse = await request(app)
        .get(`/api/meetings/${meetingId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe('Export Meeting', () => {
    let meetingId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            title: 'Export Test Meeting',
            description: 'Meeting to export'
        });
      meetingId = response.body.id;
    });

    it('should export as JSON by default', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}/export`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/json/);
      expect(response.body.id).toBe(meetingId);
    });

    it('should export as TXT', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}/export?format=txt`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/text\/plain/);
      expect(response.text).toContain('Title: Export Test Meeting');
    });

    it('should export as CSV', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}/export?format=csv`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/text\/csv/);
      expect(response.text).toContain('Timestamp,Speaker,Text,Confidence');
    });

    it('should export as Markdown', async () => {
      const response = await request(app)
        .get(`/api/meetings/${meetingId}/export?format=md`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toMatch(/text\/markdown/);
      expect(response.text).toContain('# Export Test Meeting');
      expect(response.text).toContain('## Transcriptions');
      expect(response.text).toContain('## Analysis Results');
    });
  });
});
