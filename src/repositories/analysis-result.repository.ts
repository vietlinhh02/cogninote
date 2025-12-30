import { AnalysisResult } from '@prisma/client';
import { BaseRepository } from './base.repository.js';

export interface CreateAnalysisResultData {
  meetingId: string;
  analysisType: string;
  summary?: string;
  keyPoints?: any;
  actionItems?: any;
  sentiment?: string;
  topics?: any;
  participants?: any;
  metadata?: any;
}

export interface UpdateAnalysisResultData {
  summary?: string;
  keyPoints?: any;
  actionItems?: any;
  sentiment?: string;
  topics?: any;
  participants?: any;
  metadata?: any;
}

/**
 * AnalysisResult Repository
 * Handles all database operations for analysis results
 */
export class AnalysisResultRepository extends BaseRepository<AnalysisResult> {
  protected modelName = 'analysisResult';

  /**
   * Find analysis results by meeting ID
   */
  async findByMeetingId(
    meetingId: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    }
  ): Promise<AnalysisResult[]> {
    return this.findAll({
      where: { meetingId },
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Find analysis results by type
   */
  async findByType(
    analysisType: string,
    options?: {
      skip?: number;
      take?: number;
      orderBy?: any;
    }
  ): Promise<AnalysisResult[]> {
    return this.findAll({
      where: { analysisType },
      orderBy: options?.orderBy || { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  /**
   * Find analysis result by meeting and type
   */
  async findByMeetingAndType(
    meetingId: string,
    analysisType: string
  ): Promise<AnalysisResult | null> {
    return this.findOne({
      meetingId,
      analysisType,
    });
  }

  /**
   * Find latest analysis for a meeting
   */
  async findLatestByMeetingId(meetingId: string): Promise<AnalysisResult | null> {
    return this.findOne(
      { meetingId },
      undefined
    );
  }

  /**
   * Find all analysis types for a meeting
   */
  async findAnalysisTypesByMeetingId(meetingId: string): Promise<string[]> {
    const results = await this.findByMeetingId(meetingId);
    return [...new Set(results.map((r) => r.analysisType))];
  }

  /**
   * Check if analysis exists for meeting and type
   */
  async existsForMeetingAndType(
    meetingId: string,
    analysisType: string
  ): Promise<boolean> {
    return this.exists({
      meetingId,
      analysisType,
    });
  }

  /**
   * Create or update analysis result
   */
  async upsert(
    meetingId: string,
    analysisType: string,
    data: Omit<CreateAnalysisResultData, 'meetingId' | 'analysisType'>
  ): Promise<AnalysisResult> {
    const existing = await this.findByMeetingAndType(meetingId, analysisType);

    if (existing) {
      return this.update(existing.id, data);
    }

    return this.create({
      meetingId,
      analysisType,
      ...data,
    });
  }

  /**
   * Delete all analysis results for a meeting
   */
  async deleteByMeetingId(meetingId: string): Promise<{ count: number }> {
    return this.deleteMany({ meetingId });
  }

  /**
   * Delete analysis results by type
   */
  async deleteByType(analysisType: string): Promise<{ count: number }> {
    return this.deleteMany({ analysisType });
  }

  /**
   * Count analysis results by meeting
   */
  async countByMeetingId(meetingId: string): Promise<number> {
    return this.count({ meetingId });
  }

  /**
   * Count analysis results by type
   */
  async countByType(analysisType: string): Promise<number> {
    return this.count({ analysisType });
  }

  /**
   * Get all unique analysis types
   */
  async getUniqueAnalysisTypes(): Promise<string[]> {
    const results = await this.prisma.analysisResult.findMany({
      select: {
        analysisType: true,
      },
      distinct: ['analysisType'],
    });

    return results.map((r) => r.analysisType);
  }

  /**
   * Find analysis results with sentiment
   */
  async findBySentiment(
    sentiment: string,
    options?: {
      skip?: number;
      take?: number;
    }
  ): Promise<AnalysisResult[]> {
    return this.findAll({
      where: {
        sentiment,
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...options,
    });
  }

  /**
   * Get summary for a meeting
   */
  async getSummaryByMeetingId(meetingId: string): Promise<string | null> {
    const result = await this.findOne({
      meetingId,
      summary: { not: null },
    });

    return result?.summary || null;
  }
}

// Export singleton instance
export const analysisResultRepository = new AnalysisResultRepository();
