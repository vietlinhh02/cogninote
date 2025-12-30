import { Meeting } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export interface CreateMeetingData {
  userId: string;
  title: string;
  description?: string;
  meetingUrl?: string;
  platform?: string;
  scheduledAt?: Date;
  status?: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  meetingUrl?: string;
  platform?: string;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  status?: string;
}

/**
 * Meeting Repository
 * Handles all database operations for meetings
 */
export class MeetingRepository extends BaseRepository<Meeting> {
  protected modelName = 'meeting';

  /**
   * Find meetings by user ID
   */
  async findByUserId(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
      include?: any;
    }
  ): Promise<Meeting[]> {
    return this.findAll({
      where: { userId },
      ...options,
    });
  }

  /**
   * Find meetings by status
   */
  async findByStatus(
    status: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    }
  ): Promise<Meeting[]> {
    return this.findAll({
      where: { status },
      ...options,
    });
  }

  /**
   * Find upcoming meetings for a user
   */
  async findUpcomingMeetings(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<Meeting[]> {
    return this.findAll({
      where: {
        userId,
        scheduledAt: {
          gte: new Date(),
        },
        status: {
          in: ['scheduled', 'in_progress'],
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      ...options,
    });
  }

  /**
   * Find past meetings for a user
   */
  async findPastMeetings(
    userId: string,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<Meeting[]> {
    return this.findAll({
      where: {
        userId,
        OR: [
          {
            scheduledAt: {
              lt: new Date(),
            },
          },
          {
            status: 'completed',
          },
        ],
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      ...options,
    });
  }

  /**
   * Find meeting with transcriptions
   */
  async findByIdWithTranscriptions(id: string): Promise<Meeting | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        transcriptions: {
          orderBy: {
            timestampStart: 'asc',
          },
        },
      },
    });
  }

  /**
   * Find meeting with analysis results
   */
  async findByIdWithAnalysis(id: string): Promise<Meeting | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        analysisResults: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Find meeting with all related data
   */
  async findByIdWithRelations(id: string): Promise<Meeting | null> {
    return this.model.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        transcriptions: {
          orderBy: {
            timestampStart: 'asc',
          },
        },
        analysisResults: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Update meeting status
   */
  async updateStatus(id: string, status: string): Promise<Meeting> {
    return this.update(id, { status });
  }

  /**
   * Start a meeting
   */
  async startMeeting(id: string): Promise<Meeting> {
    return this.update(id, {
      status: 'in_progress',
      startedAt: new Date(),
    });
  }

  /**
   * End a meeting
   */
  async endMeeting(id: string): Promise<Meeting> {
    return this.update(id, {
      status: 'completed',
      endedAt: new Date(),
    });
  }

  /**
   * Count meetings by user
   */
  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId });
  }

  /**
   * Count meetings by status
   */
  async countByStatus(status: string): Promise<number> {
    return this.count({ status });
  }
}

// Export singleton instance
export const meetingRepository = new MeetingRepository();
