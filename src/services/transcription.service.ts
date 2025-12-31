import { Transcription } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { transcriptionRepository } from '../repositories/index.js';
import { meetingRepository } from '../repositories/index.js';
import { AppError } from '../middlewares/error-handler.js';
import { logger } from '../utils/logger.js';
import { cacheService } from './cache.service.js';
import {
  TranscriptionSegment,
  TranscriptionResponse,
} from './recall-ai/types/recall-ai.types.js';

/**
 * Transcription session state
 */
export enum TranscriptionSessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Transcription session metadata
 */
export interface TranscriptionSession {
  meetingId: string;
  sessionId: string;
  status: TranscriptionSessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  completedAt?: Date;
  totalSegments: number;
  totalDuration: number;
  speakers: Set<string>;
  averageConfidence: number;
}

/**
 * Audio chunk for processing
 */
export interface AudioChunk {
  chunkId: string;
  meetingId: string;
  audioData?: Buffer;
  timestamp: number;
  duration: number;
  speaker?: string;
}

/**
 * Processed transcription segment with metadata
 */
export interface ProcessedTranscriptionSegment {
  meetingId: string;
  speakerName: string;
  text: string;
  timestampStart: Date;
  timestampEnd: Date;
  confidence: number;
  chunkId?: string;
}

/**
 * Transcription finalization result
 */
export interface TranscriptionFinalizationResult {
  meetingId: string;
  totalSegments: number;
  totalDuration: number;
  speakers: string[];
  averageConfidence: number;
  transcriptionText: string;
  metadata: {
    startedAt: Date;
    completedAt: Date;
    processingTime: number;
  };
}

/**
 * Transcription Service
 * Handles real-time transcription processing, session management, and storage
 */
export class TranscriptionService {
  private readonly SESSION_CACHE_PREFIX = 'transcription_session:';
  private readonly SESSION_CACHE_TTL = 3600; // 1 hour

  /**
   * Create a new transcription session
   */
  async createSession(meetingId: string): Promise<TranscriptionSession> {
    logger.info('Creating transcription session', { meetingId });

    // Verify meeting exists
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const sessionId = `session_${meetingId}_${Date.now()}`;
    const session: TranscriptionSession = {
      meetingId,
      sessionId,
      status: TranscriptionSessionStatus.ACTIVE,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      totalSegments: 0,
      totalDuration: 0,
      speakers: new Set(),
      averageConfidence: 0,
    };

    // Cache session
    await this.cacheSession(sessionId, session);

    logger.info('Transcription session created', { sessionId, meetingId });

    return session;
  }

  /**
   * Get active transcription session
   */
  async getSession(sessionId: string): Promise<TranscriptionSession | null> {
    const cached = await this.getCachedSession(sessionId);
    if (cached) {
      return cached;
    }

    logger.warn('Transcription session not found', { sessionId });
    return null;
  }

  /**
   * Process audio chunk and generate transcription segment
   */
  async processAudioChunk(
    chunk: AudioChunk,
    transcriptionText: string,
    confidence: number,
    speaker?: string
  ): Promise<ProcessedTranscriptionSegment> {
    logger.debug('Processing audio chunk', {
      chunkId: chunk.chunkId,
      meetingId: chunk.meetingId,
      timestamp: chunk.timestamp,
    });

    // Calculate timestamps
    const timestampStart = new Date(chunk.timestamp * 1000);
    const timestampEnd = new Date((chunk.timestamp + chunk.duration) * 1000);

    const segment: ProcessedTranscriptionSegment = {
      meetingId: chunk.meetingId,
      speakerName: speaker || chunk.speaker || 'Unknown Speaker',
      text: transcriptionText,
      timestampStart,
      timestampEnd,
      confidence,
      chunkId: chunk.chunkId,
    };

    // Store segment immediately
    await this.storeSegment(segment);

    logger.debug('Audio chunk processed', {
      chunkId: chunk.chunkId,
      speaker: segment.speakerName,
      duration: chunk.duration,
    });

    return segment;
  }

  /**
   * Process multiple audio chunks in batch
   */
  async processAudioChunkBatch(
    chunks: AudioChunk[],
    transcriptionSegments: TranscriptionSegment[]
  ): Promise<ProcessedTranscriptionSegment[]> {
    if (chunks.length !== transcriptionSegments.length) {
      throw new AppError(
        'Chunk count must match transcription segment count',
        400
      );
    }

    logger.info('Processing audio chunk batch', {
      chunkCount: chunks.length,
      meetingId: chunks[0]?.meetingId,
    });

    const processedSegments: ProcessedTranscriptionSegment[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const segment = transcriptionSegments[i];

      const processed = await this.processAudioChunk(
        chunk,
        segment.text,
        segment.confidence,
        segment.speaker
      );

      processedSegments.push(processed);
    }

    logger.info('Audio chunk batch processed', {
      processedCount: processedSegments.length,
    });

    return processedSegments;
  }

  /**
   * Process real-time transcription from Recall AI
   */
  async processRealtimeTranscription(
    meetingId: string,
    transcriptionResponse: TranscriptionResponse
  ): Promise<void> {
    logger.info('Processing real-time transcription', {
      meetingId,
      segmentCount: transcriptionResponse.segments.length,
    });

    // Get or create session
    let session = await this.getSessionByMeetingId(meetingId);
    if (!session) {
      session = await this.createSession(meetingId);
    }

    // Process segments
    const segments = transcriptionResponse.segments;

    for (const segment of segments) {
      const timestampStart = new Date(segment.startTime * 1000);
      const timestampEnd = new Date(segment.endTime * 1000);

      const processedSegment: ProcessedTranscriptionSegment = {
        meetingId,
        speakerName: segment.speaker || 'Unknown Speaker',
        text: segment.text,
        timestampStart,
        timestampEnd,
        confidence: segment.confidence,
      };

      await this.storeSegment(processedSegment);

      // Update session
      session.totalSegments++;
      session.totalDuration = segment.endTime;
      session.speakers.add(segment.speaker);
      session.lastActivityAt = new Date();
      session.averageConfidence =
        (session.averageConfidence * (session.totalSegments - 1) +
          segment.confidence) /
        session.totalSegments;
    }

    // Update cached session
    await this.cacheSession(session.sessionId, session);

    logger.info('Real-time transcription processed', {
      meetingId,
      totalSegments: session.totalSegments,
    });
  }

  /**
   * Pause transcription session
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new AppError('Transcription session not found', 404);
    }

    logger.info('Pausing transcription session', { sessionId });

    session.status = TranscriptionSessionStatus.PAUSED;
    session.lastActivityAt = new Date();

    await this.cacheSession(sessionId, session);
  }

  /**
   * Resume transcription session
   */
  async resumeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new AppError('Transcription session not found', 404);
    }

    if (session.status !== TranscriptionSessionStatus.PAUSED) {
      throw new AppError('Session is not paused', 400);
    }

    logger.info('Resuming transcription session', { sessionId });

    session.status = TranscriptionSessionStatus.ACTIVE;
    session.lastActivityAt = new Date();

    await this.cacheSession(sessionId, session);
  }

  /**
   * Finalize transcription session
   */
  async finalizeSession(
    sessionId: string
  ): Promise<TranscriptionFinalizationResult> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new AppError('Transcription session not found', 404);
    }

    logger.info('Finalizing transcription session', {
      sessionId,
      meetingId: session.meetingId,
    });

    // Mark session as completed
    session.status = TranscriptionSessionStatus.COMPLETED;
    session.completedAt = new Date();

    // Get all transcriptions for the meeting
    const transcriptions = await transcriptionRepository.findByMeetingId(
      session.meetingId
    );

    // Get unique speakers
    const speakers = await transcriptionRepository.getUniqueSpeakers(
      session.meetingId
    );

    // Calculate average confidence
    const averageConfidence =
      await transcriptionRepository.getAverageConfidence(session.meetingId);

    // Generate full transcript text
    const transcriptionText = await transcriptionRepository.getFullTranscript(
      session.meetingId
    );

    // Calculate duration from timestamps
    const firstSegment = transcriptions[0];
    const lastSegment = transcriptions[transcriptions.length - 1];

    const totalDuration = lastSegment?.timestampEnd && firstSegment?.timestampStart
      ? (lastSegment.timestampEnd.getTime() -
          firstSegment.timestampStart.getTime()) /
        1000
      : session.totalDuration;

    const result: TranscriptionFinalizationResult = {
      meetingId: session.meetingId,
      totalSegments: transcriptions.length,
      totalDuration,
      speakers,
      averageConfidence,
      transcriptionText,
      metadata: {
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        processingTime:
          (session.completedAt.getTime() - session.startedAt.getTime()) / 1000,
      },
    };

    // Update meeting with finalization data
    await this.updateMeetingWithTranscriptionMetadata(result);

    // Update cached session
    await this.cacheSession(sessionId, session);

    logger.info('Transcription session finalized', {
      sessionId,
      meetingId: session.meetingId,
      totalSegments: result.totalSegments,
      speakers: result.speakers.length,
    });

    return result;
  }

  /**
   * Get transcription by meeting ID
   */
  async getTranscriptionByMeetingId(
    meetingId: string
  ): Promise<Transcription[]> {
    logger.debug('Fetching transcription for meeting', { meetingId });

    const transcriptions = await transcriptionRepository.findByMeetingId(
      meetingId
    );

    return transcriptions;
  }

  /**
   * Get transcription with pagination
   */
  async getTranscriptionWithPagination(
    meetingId: string,
    options: {
      page?: number;
      limit?: number;
      speaker?: string;
    }
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    logger.debug('Fetching paginated transcription', {
      meetingId,
      page,
      limit,
    });

    let transcriptions: Transcription[];

    if (options.speaker) {
      transcriptions = await transcriptionRepository.findBySpeaker(
        meetingId,
        options.speaker,
        { skip, take: limit }
      );
    } else {
      transcriptions = await transcriptionRepository.findByMeetingId(
        meetingId,
        { skip, take: limit }
      );
    }

    const total = await transcriptionRepository.countByMeetingId(meetingId);

    return { transcriptions, total };
  }

  /**
   * Delete transcription for meeting
   */
  async deleteTranscription(
    meetingId: string,
    userId: string
  ): Promise<void> {
    // Verify meeting ownership
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to delete transcription', 403);
    }

    logger.info('Deleting transcription', { meetingId, userId });

    await transcriptionRepository.deleteByMeetingId(meetingId);

    logger.info('Transcription deleted', { meetingId });
  }

  /**
   * Store transcription segment
   */
  private async storeSegment(
    segment: ProcessedTranscriptionSegment
  ): Promise<Transcription> {
    return await transcriptionRepository.create({
      meetingId: segment.meetingId,
      speakerName: segment.speakerName,
      text: segment.text,
      timestampStart: segment.timestampStart,
      timestampEnd: segment.timestampEnd,
      confidence: new Decimal(segment.confidence),
    });
  }

  /**
   * Get session by meeting ID
   */
  private async getSessionByMeetingId(
    meetingId: string
  ): Promise<TranscriptionSession | null> {
    // This is a simplified implementation
    // In production, you might want to store session IDs in the database
    // or maintain a mapping in cache
    const sessionId = `session_${meetingId}`;
    return await this.getSession(sessionId);
  }

  /**
   * Update meeting with transcription metadata
   */
  private async updateMeetingWithTranscriptionMetadata(
    result: TranscriptionFinalizationResult
  ): Promise<void> {
    const meeting = await meetingRepository.findById(result.meetingId);
    if (!meeting) {
      return;
    }

    await meetingRepository.update(result.meetingId, {
      metadata: {
        ...(meeting.metadata as object),
        transcription: {
          totalSegments: result.totalSegments,
          totalDuration: result.totalDuration,
          speakers: result.speakers,
          averageConfidence: result.averageConfidence,
          completedAt: result.metadata.completedAt,
        },
      },
    });
  }

  /**
   * Cache transcription session
   */
  private async cacheSession(
    sessionId: string,
    session: TranscriptionSession
  ): Promise<void> {
    // Convert Set to Array for JSON serialization
    const sessionData = {
      ...session,
      speakers: Array.from(session.speakers),
    };

    await cacheService.set(
      `${this.SESSION_CACHE_PREFIX}${sessionId}`,
      sessionData,
      this.SESSION_CACHE_TTL
    );
  }

  /**
   * Get cached transcription session
   */
  private async getCachedSession(
    sessionId: string
  ): Promise<TranscriptionSession | null> {
    const cached = await cacheService.get<any>(
      `${this.SESSION_CACHE_PREFIX}${sessionId}`
    );

    if (!cached) {
      return null;
    }

    // Convert Array back to Set
    return {
      ...cached,
      speakers: new Set(cached.speakers),
      startedAt: new Date(cached.startedAt),
      lastActivityAt: new Date(cached.lastActivityAt),
      completedAt: cached.completedAt ? new Date(cached.completedAt) : undefined,
    };
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
