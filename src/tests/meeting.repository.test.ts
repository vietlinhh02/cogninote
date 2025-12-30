import { MeetingRepository } from '../repositories/meeting.repository';
import { prisma } from '../config/database';
import { Meeting } from '@prisma/client';

describe('MeetingRepository', () => {
  let repository: MeetingRepository;
  let testUserId: string;
  let testMeeting: Meeting;

  beforeAll(async () => {
    repository = new MeetingRepository();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'meetingtest@example.com',
        passwordHash: 'hashedpassword',
        fullName: 'Meeting Test User',
      },
    });
    testUserId = user.id;
  });

  beforeEach(async () => {
    // Create a test meeting before each test
    testMeeting = await repository.create({
      userId: testUserId,
      title: 'Test Meeting',
      description: 'Test Description',
      status: 'scheduled',
    });
  });

  afterEach(async () => {
    // Clean up meetings after each test
    await prisma.meeting.deleteMany({
      where: { userId: testUserId },
    });
  });

  afterAll(async () => {
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('create', () => {
    it('should create a new meeting', async () => {
      const meetingData = {
        userId: testUserId,
        title: 'New Meeting',
        description: 'New Description',
        platform: 'Zoom',
        status: 'scheduled',
      };

      const meeting = await repository.create(meetingData);

      expect(meeting).toBeDefined();
      expect(meeting.id).toBeDefined();
      expect(meeting.title).toBe(meetingData.title);
      expect(meeting.description).toBe(meetingData.description);
      expect(meeting.platform).toBe(meetingData.platform);
      expect(meeting.userId).toBe(testUserId);
    });
  });

  describe('findById', () => {
    it('should find a meeting by ID', async () => {
      const meeting = await repository.findById(testMeeting.id);

      expect(meeting).toBeDefined();
      expect(meeting?.id).toBe(testMeeting.id);
      expect(meeting?.title).toBe(testMeeting.title);
    });

    it('should return null for non-existent meeting', async () => {
      const meeting = await repository.findById('non-existent-id');
      expect(meeting).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all meetings for a user', async () => {
      // Create additional meetings
      await repository.create({
        userId: testUserId,
        title: 'Meeting 2',
        status: 'scheduled',
      });
      await repository.create({
        userId: testUserId,
        title: 'Meeting 3',
        status: 'scheduled',
      });

      const meetings = await repository.findByUserId(testUserId);

      expect(meetings).toBeDefined();
      expect(meetings.length).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      // Create additional meetings
      for (let i = 0; i < 5; i++) {
        await repository.create({
          userId: testUserId,
          title: `Meeting ${i}`,
          status: 'scheduled',
        });
      }

      const meetings = await repository.findByUserId(testUserId, {
        skip: 0,
        take: 3,
      });

      expect(meetings.length).toBe(3);
    });
  });

  describe('findByStatus', () => {
    it('should find meetings by status', async () => {
      await repository.create({
        userId: testUserId,
        title: 'Completed Meeting',
        status: 'completed',
      });

      const meetings = await repository.findByStatus('completed');

      expect(meetings).toBeDefined();
      expect(meetings.length).toBeGreaterThanOrEqual(1);
      expect(meetings.every((m) => m.status === 'completed')).toBe(true);
    });
  });

  describe('findUpcomingMeetings', () => {
    it('should find upcoming scheduled meetings', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await repository.create({
        userId: testUserId,
        title: 'Future Meeting',
        scheduledAt: futureDate,
        status: 'scheduled',
      });

      const meetings = await repository.findUpcomingMeetings(testUserId);

      expect(meetings).toBeDefined();
      expect(meetings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findPastMeetings', () => {
    it('should find past or completed meetings', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      await repository.create({
        userId: testUserId,
        title: 'Past Meeting',
        scheduledAt: pastDate,
        status: 'completed',
      });

      const meetings = await repository.findPastMeetings(testUserId);

      expect(meetings).toBeDefined();
      expect(meetings.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('update', () => {
    it('should update a meeting', async () => {
      const updatedData = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updated = await repository.update(testMeeting.id, updatedData);

      expect(updated.title).toBe(updatedData.title);
      expect(updated.description).toBe(updatedData.description);
    });
  });

  describe('updateStatus', () => {
    it('should update meeting status', async () => {
      const updated = await repository.updateStatus(testMeeting.id, 'in_progress');

      expect(updated.status).toBe('in_progress');
    });
  });

  describe('startMeeting', () => {
    it('should start a meeting', async () => {
      const started = await repository.startMeeting(testMeeting.id);

      expect(started.status).toBe('in_progress');
      expect(started.startedAt).toBeDefined();
    });
  });

  describe('endMeeting', () => {
    it('should end a meeting', async () => {
      const ended = await repository.endMeeting(testMeeting.id);

      expect(ended.status).toBe('completed');
      expect(ended.endedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a meeting', async () => {
      await repository.delete(testMeeting.id);

      const deleted = await repository.findById(testMeeting.id);
      expect(deleted).toBeNull();
    });
  });

  describe('countByUserId', () => {
    it('should count meetings for a user', async () => {
      const count = await repository.countByUserId(testUserId);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('countByStatus', () => {
    it('should count meetings by status', async () => {
      const count = await repository.countByStatus('scheduled');
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('exists', () => {
    it('should check if meeting exists', async () => {
      const exists = await repository.exists({ id: testMeeting.id });
      expect(exists).toBe(true);

      const notExists = await repository.exists({ id: 'non-existent-id' });
      expect(notExists).toBe(false);
    });
  });
});
