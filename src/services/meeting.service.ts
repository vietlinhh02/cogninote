import { Meeting } from '@prisma/client';
import {
  meetingRepository,
  CreateMeetingData,
  UpdateMeetingData,
} from '../repositories/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { cacheService } from './cache.service.js';

/**
 * Meeting Service
 * Business logic for meeting operations using repository pattern
 */
export class MeetingService {
  private readonly CACHE_PREFIX = 'meeting:';
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Get cache key for meeting
   */
  private getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}${id}`;
  }

  /**
   * Invalidate meeting cache
   */
  private async invalidateCache(id: string): Promise<void> {
    await cacheService.delete(this.getCacheKey(id));
    await cacheService.deletePattern(`${this.CACHE_PREFIX}list:*`);
  }

  /**
   * Create a new meeting
   */
  async createMeeting(data: CreateMeetingData): Promise<Meeting> {
    const meeting = await meetingRepository.create(data);
    await this.invalidateCache(meeting.id);
    return meeting;
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(id: string): Promise<Meeting> {
    const cached = await cacheService.get<Meeting>(this.getCacheKey(id));
    if (cached) return cached;

    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    await cacheService.set(this.getCacheKey(id), meeting, this.CACHE_TTL);
    return meeting;
  }

  /**
   * Get meeting with transcriptions
   */
  async getMeetingWithTranscriptions(id: string): Promise<Meeting> {
    const meeting = await meetingRepository.findByIdWithTranscriptions(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return meeting;
  }

  /**
   * Get meeting with analysis results
   */
  async getMeetingWithAnalysis(id: string): Promise<Meeting> {
    const meeting = await meetingRepository.findByIdWithAnalysis(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return meeting;
  }

  /**
   * Get meeting with all relations
   */
  async getMeetingWithRelations(id: string): Promise<Meeting> {
    const meeting = await meetingRepository.findByIdWithRelations(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }
    return meeting;
  }

  /**
   * Get meetings for a user
   */
  async getUserMeetings(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      status?: string;
    }
  ): Promise<{ meetings: Meeting[]; total: number }> {
    const cacheKey = `${this.CACHE_PREFIX}list:user:${userId}:${JSON.stringify(options)}`;
    const cached = await cacheService.get<{ meetings: Meeting[]; total: number }>(cacheKey);
    if (cached) return cached;

    let meetings: Meeting[];
    if (options?.status) {
      meetings = await meetingRepository.findAll({
        where: { userId, status: options.status },
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      meetings = await meetingRepository.findByUserId(userId, {
        skip: options?.skip,
        take: options?.take,
        orderBy: { createdAt: 'desc' },
      });
    }

    const total = await meetingRepository.countByUserId(userId);

    const result = { meetings, total };
    await cacheService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get upcoming meetings for a user
   */
  async getUpcomingMeetings(
    userId: string,
    options?: { skip?: number; take?: number }
  ): Promise<Meeting[]> {
    return meetingRepository.findUpcomingMeetings(userId, options);
  }

  /**
   * Get past meetings for a user
   */
  async getPastMeetings(
    userId: string,
    options?: { skip?: number; take?: number }
  ): Promise<Meeting[]> {
    return meetingRepository.findPastMeetings(userId, options);
  }

  /**
   * Update meeting
   */
  async updateMeeting(id: string, userId: string, data: UpdateMeetingData): Promise<Meeting> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to update this meeting', 403);
    }

    const updated = await meetingRepository.update(id, data);
    await this.invalidateCache(id);

    return updated;
  }

  /**
   * Start a meeting
   */
  async startMeeting(id: string, userId: string): Promise<Meeting> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to start this meeting', 403);
    }

    if (meeting.status === 'in_progress') {
      throw new AppError('Meeting is already in progress', 400);
    }

    const updated = await meetingRepository.startMeeting(id);
    await this.invalidateCache(id);

    return updated;
  }

  /**
   * End a meeting
   */
  async endMeeting(id: string, userId: string): Promise<Meeting> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to end this meeting', 403);
    }

    if (meeting.status === 'completed') {
      throw new AppError('Meeting is already completed', 400);
    }

    const updated = await meetingRepository.endMeeting(id);
    await this.invalidateCache(id);

    return updated;
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(id: string, userId: string): Promise<void> {
    const meeting = await meetingRepository.findById(id);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to delete this meeting', 403);
    }

    await meetingRepository.delete(id);
    await this.invalidateCache(id);
  }

  /**
   * Get meeting statistics for a user
   */
  async getUserMeetingStats(userId: string): Promise<{
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
  }> {
    const total = await meetingRepository.countByUserId(userId);
    const scheduled = await meetingRepository.count({ userId, status: 'scheduled' });
    const inProgress = await meetingRepository.count({ userId, status: 'in_progress' });
    const completed = await meetingRepository.count({ userId, status: 'completed' });

    return {
      total,
      scheduled,
      inProgress,
      completed,
    };
  }
}

// Export singleton instance
export const meetingService = new MeetingService();
