import { Transcription } from '@prisma/client';
import { BaseRepository } from './base.repository.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTranscriptionData {
  meetingId: string;
  speakerName?: string;
  text: string;
  timestampStart?: Date;
  timestampEnd?: Date;
  confidence?: Decimal;
}

export interface UpdateTranscriptionData {
  speakerName?: string;
  text?: string;
  timestampStart?: Date;
  timestampEnd?: Date;
  confidence?: Decimal;
}

/**
 * Transcription Repository
 * Handles all database operations for transcriptions
 */
export class TranscriptionRepository extends BaseRepository<Transcription> {
  protected modelName = 'transcription';

  /**
   * Find transcriptions by meeting ID
   */
  async findByMeetingId(
    meetingId: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    }
  ): Promise<Transcription[]> {
    return this.findAll({
      where: { meetingId },
      orderBy: options?.orderBy || { timestampStart: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Find transcriptions by speaker
   */
  async findBySpeaker(
    meetingId: string,
    speakerName: string,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<Transcription[]> {
    return this.findAll({
      where: {
        meetingId,
        speakerName,
      },
      orderBy: {
        timestampStart: 'asc',
      },
      ...options,
    });
  }

  /**
   * Find transcriptions within time range
   */
  async findByTimeRange(
    meetingId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Transcription[]> {
    return this.findAll({
      where: {
        meetingId,
        timestampStart: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: {
        timestampStart: 'asc',
      },
    });
  }

  /**
   * Find transcriptions with low confidence
   */
  async findLowConfidence(
    meetingId: string,
    threshold: Decimal = new Decimal(0.7)
  ): Promise<Transcription[]> {
    return this.findAll({
      where: {
        meetingId,
        confidence: {
          lt: threshold,
        },
      },
      orderBy: {
        confidence: 'asc',
      },
    });
  }

  /**
   * Get full transcript for a meeting
   */
  async getFullTranscript(meetingId: string): Promise<string> {
    const transcriptions = await this.findByMeetingId(meetingId, {
      orderBy: { timestampStart: 'asc' },
    });

    return transcriptions
      .map((t) => `${t.speakerName || 'Unknown'}: ${t.text}`)
      .join('\n');
  }

  /**
   * Count transcriptions by meeting
   */
  async countByMeetingId(meetingId: string): Promise<number> {
    return this.count({ meetingId });
  }

  /**
   * Get unique speakers for a meeting
   */
  async getUniqueSpeakers(meetingId: string): Promise<string[]> {
    const result = await this.prisma.transcription.findMany({
      where: {
        meetingId,
        speakerName: { not: null },
      },
      select: {
        speakerName: true,
      },
      distinct: ['speakerName'],
    });

    return result.map((r) => r.speakerName as string).filter(Boolean);
  }

  /**
   * Delete all transcriptions for a meeting
   */
  async deleteByMeetingId(meetingId: string): Promise<{ count: number }> {
    return this.deleteMany({ meetingId });
  }

  /**
   * Bulk create transcriptions
   */
  async bulkCreate(data: CreateTranscriptionData[]): Promise<{ count: number }> {
    return this.createMany(data);
  }

  /**
   * Get average confidence for a meeting
   */
  async getAverageConfidence(meetingId: string): Promise<number> {
    const result = await this.prisma.transcription.aggregate({
      where: {
        meetingId,
        confidence: { not: null },
      },
      _avg: {
        confidence: true,
      },
    });

    return result._avg.confidence ? Number(result._avg.confidence) : 0;
  }
}

// Export singleton instance
export const transcriptionRepository = new TranscriptionRepository();
