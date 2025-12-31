import { Meeting } from '@prisma/client';
import { recallAIService, RecallAIService } from './recall-ai.service.js';
import {
  DeployBotRequest,
  BotStatus,
  MeetingPlatform,
  BotStorageData,
  RecordingDownload,
  TranscriptionResponse,
} from './types/recall-ai.types.js';
import { meetingRepository } from '../../repositories/index.js';
import { AppError } from '../../middlewares/error-handler.js';
import { logger } from '../../utils/logger.js';
import { cacheService } from '../cache.service.js';

/**
 * Meeting Bot Service
 * Manages meeting bot lifecycle, deployment, and recording retrieval
 */
export class MeetingBotService {
  private readonly CACHE_PREFIX = 'bot:';
  private readonly CACHE_TTL = 300; // 5 minutes
  private recallService: RecallAIService;

  constructor(recallService?: RecallAIService) {
    this.recallService = recallService || recallAIService;
  }

  /**
   * Deploy a bot to a meeting
   */
  async deployBotToMeeting(
    meetingId: string,
    userId: string,
    options?: {
      botName?: string;
      recordAudio?: boolean;
      recordVideo?: boolean;
      recordTranscription?: boolean;
    }
  ): Promise<BotStorageData> {
    // Get meeting details
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    // Verify user ownership
    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to deploy bot for this meeting', 403);
    }

    // Validate meeting URL
    if (!meeting.meetingUrl) {
      throw new AppError('Meeting URL is required to deploy bot', 400);
    }

    // Determine platform
    const platform = this.detectPlatform(meeting.meetingUrl);
    if (!platform) {
      throw new AppError('Unable to detect meeting platform from URL', 400);
    }

    logger.info('Deploying bot to meeting', {
      meetingId,
      platform,
      userId,
    });

    // Deploy bot via Recall AI
    const deployRequest: DeployBotRequest = {
      meetingId,
      meetingUrl: meeting.meetingUrl,
      platform,
      botName: options?.botName || 'CogniNote Bot',
      recordAudio: options?.recordAudio,
      recordVideo: options?.recordVideo,
      recordTranscription: options?.recordTranscription,
      metadata: {
        userId,
        meetingTitle: meeting.title,
      },
    };

    const botResponse = await this.recallService.deployBot(deployRequest);

    // Store bot data
    const botData: BotStorageData = {
      botId: botResponse.botId,
      meetingId,
      status: botResponse.status,
      platform: botResponse.platform,
      meetingUrl: meeting.meetingUrl,
      deployedAt: new Date(botResponse.createdAt),
    };

    // Update meeting with bot ID
    await meetingRepository.update(meetingId, {
      metadata: {
        ...(meeting.metadata as object),
        botId: botResponse.botId,
        botStatus: botResponse.status,
        botDeployedAt: botResponse.createdAt,
      },
    });

    // Cache bot data
    await this.cacheBotData(botResponse.botId, botData);

    logger.info('Bot deployed successfully', {
      meetingId,
      botId: botResponse.botId,
    });

    return botData;
  }

  /**
   * Get bot status
   */
  async getBotStatus(botId: string): Promise<BotStorageData> {
    // Try cache first
    const cached = await this.getCachedBotData(botId);
    if (cached) {
      return cached;
    }

    // Fetch from Recall AI
    const statusResponse = await this.recallService.getBotStatus(botId);

    const botData: BotStorageData = {
      botId: statusResponse.botId,
      meetingId: '', // Will be populated from metadata or DB
      status: statusResponse.status,
      platform: statusResponse.platform,
      meetingUrl: statusResponse.meetingUrl,
      deployedAt: new Date(),
      joinedAt: statusResponse.joinedAt ? new Date(statusResponse.joinedAt) : undefined,
      leftAt: statusResponse.leftAt ? new Date(statusResponse.leftAt) : undefined,
      error: statusResponse.error,
    };

    // Cache updated status
    await this.cacheBotData(botId, botData);

    return botData;
  }

  /**
   * Stop a bot
   */
  async stopBot(botId: string, userId: string): Promise<void> {
    // Get meeting associated with bot
    const meeting = await this.getMeetingByBotId(botId);
    if (!meeting) {
      throw new AppError('Meeting not found for bot', 404);
    }

    // Verify user ownership
    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to stop this bot', 403);
    }

    logger.info('Stopping bot', { botId, meetingId: meeting.id, userId });

    await this.recallService.stopBot(botId);

    // Update meeting metadata
    await meetingRepository.update(meeting.id, {
      metadata: {
        ...(meeting.metadata as object),
        botStatus: BotStatus.LEAVING,
        botStoppedAt: new Date().toISOString(),
      },
    });

    // Invalidate cache
    await this.invalidateBotCache(botId);

    logger.info('Bot stopped', { botId, meetingId: meeting.id });
  }

  /**
   * Retrieve and process meeting recording
   */
  async retrieveRecording(
    meetingId: string,
    userId: string
  ): Promise<RecordingDownload> {
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to retrieve recording', 403);
    }

    const botId = this.getBotIdFromMeeting(meeting);
    if (!botId) {
      throw new AppError('No bot associated with this meeting', 404);
    }

    logger.info('Retrieving recording', { meetingId, botId });

    const recording = await this.recallService.getRecordingDownload(botId);

    // Update meeting with recording URLs
    await meetingRepository.update(meetingId, {
      metadata: {
        ...(meeting.metadata as object),
        recordingAudioUrl: recording.audioUrl,
        recordingVideoUrl: recording.videoUrl,
        recordingTranscriptUrl: recording.transcriptUrl,
        recordingExpiresAt: recording.expiresAt,
      },
    });

    return recording;
  }

  /**
   * Retrieve and store meeting transcription
   */
  async retrieveTranscription(
    meetingId: string,
    userId: string
  ): Promise<TranscriptionResponse> {
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    if (meeting.userId !== userId) {
      throw new AppError('Unauthorized to retrieve transcription', 403);
    }

    const botId = this.getBotIdFromMeeting(meeting);
    if (!botId) {
      throw new AppError('No bot associated with this meeting', 404);
    }

    logger.info('Retrieving transcription', { meetingId, botId });

    const transcription = await this.recallService.getTranscription(botId);

    // Store transcription segments in database
    await this.storeTranscriptionSegments(meetingId, transcription);

    logger.info('Transcription stored', {
      meetingId,
      segmentCount: transcription.segments.length,
    });

    return transcription;
  }

  /**
   * Check bot status and sync with meeting
   */
  async syncBotStatus(meetingId: string): Promise<BotStorageData> {
    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const botId = this.getBotIdFromMeeting(meeting);
    if (!botId) {
      throw new AppError('No bot associated with this meeting', 404);
    }

    const botStatus = await this.getBotStatus(botId);

    // Update meeting status based on bot status
    await this.updateMeetingFromBotStatus(meeting, botStatus);

    return botStatus;
  }

  /**
   * Auto-deploy bot for scheduled meetings
   */
  async autoDeployForScheduledMeetings(): Promise<void> {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    logger.info('Checking for meetings to auto-deploy bots', {
      timeWindow: `${now.toISOString()} to ${fifteenMinutesFromNow.toISOString()}`,
    });

    // Find scheduled meetings starting soon
    const upcomingMeetings = await meetingRepository.findAll({
      where: {
        status: 'scheduled',
        scheduledAt: {
          gte: now,
          lte: fifteenMinutesFromNow,
        },
      },
    });

    logger.info(`Found ${upcomingMeetings.length} meetings to process`);

    for (const meeting of upcomingMeetings) {
      try {
        // Check if bot already deployed
        const botId = this.getBotIdFromMeeting(meeting);
        if (botId) {
          logger.debug('Bot already deployed for meeting', {
            meetingId: meeting.id,
            botId,
          });
          continue;
        }

        // Check if meeting has URL
        if (!meeting.meetingUrl) {
          logger.warn('Meeting has no URL, skipping auto-deploy', {
            meetingId: meeting.id,
          });
          continue;
        }

        // Deploy bot
        await this.deployBotToMeeting(meeting.id, meeting.userId, {
          botName: 'CogniNote Auto-Bot',
        });

        logger.info('Auto-deployed bot for meeting', {
          meetingId: meeting.id,
        });
      } catch (error) {
        logger.error('Failed to auto-deploy bot', {
          meetingId: meeting.id,
          error: String(error),
        });
      }
    }
  }

  /**
   * Detect meeting platform from URL
   */
  private detectPlatform(meetingUrl: string): MeetingPlatform | null {
    const url = meetingUrl.toLowerCase();

    if (url.includes('zoom.us') || url.includes('zoom.com')) {
      return MeetingPlatform.ZOOM;
    }
    if (url.includes('meet.google.com')) {
      return MeetingPlatform.GOOGLE_MEET;
    }
    if (url.includes('teams.microsoft.com')) {
      return MeetingPlatform.MICROSOFT_TEAMS;
    }
    if (url.includes('webex.com')) {
      return MeetingPlatform.WEBEX;
    }

    return null;
  }

  /**
   * Get bot ID from meeting metadata
   */
  private getBotIdFromMeeting(meeting: Meeting): string | null {
    const metadata = meeting.metadata as any;
    return metadata?.botId || null;
  }

  /**
   * Get meeting by bot ID
   */
  private async getMeetingByBotId(botId: string): Promise<Meeting | null> {
    const meetings = await meetingRepository.findAll({
      where: {
        metadata: {
          path: ['botId'],
          equals: botId,
        },
      },
    });

    return meetings[0] || null;
  }

  /**
   * Store transcription segments
   */
  private async storeTranscriptionSegments(
    meetingId: string,
    transcription: TranscriptionResponse
  ): Promise<void> {
    // Note: This uses a placeholder transcription creation method
    // You'll need to implement this in the transcription repository
    for (const segment of transcription.segments) {
      await meetingRepository.createTranscription(meetingId, {
        speakerName: segment.speaker,
        text: segment.text,
        timestampStart: new Date(segment.startTime * 1000),
        timestampEnd: new Date(segment.endTime * 1000),
        confidence: segment.confidence,
      });
    }
  }

  /**
   * Update meeting based on bot status
   */
  private async updateMeetingFromBotStatus(
    meeting: Meeting,
    botStatus: BotStorageData
  ): Promise<void> {
    const updates: any = {
      metadata: {
        ...(meeting.metadata as object),
        botStatus: botStatus.status,
      },
    };

    // Update meeting status based on bot status
    if (botStatus.status === BotStatus.IN_MEETING && meeting.status === 'scheduled') {
      updates.status = 'in_progress';
      updates.startedAt = botStatus.joinedAt || new Date();
    }

    if (botStatus.status === BotStatus.COMPLETED && meeting.status !== 'completed') {
      updates.status = 'completed';
      updates.endedAt = botStatus.leftAt || new Date();
    }

    await meetingRepository.update(meeting.id, updates);
  }

  /**
   * Cache bot data
   */
  private async cacheBotData(
    botId: string,
    data: BotStorageData
  ): Promise<void> {
    await cacheService.set(`${this.CACHE_PREFIX}${botId}`, data, this.CACHE_TTL);
  }

  /**
   * Get cached bot data
   */
  private async getCachedBotData(
    botId: string
  ): Promise<BotStorageData | null> {
    return await cacheService.get<BotStorageData>(`${this.CACHE_PREFIX}${botId}`);
  }

  /**
   * Invalidate bot cache
   */
  private async invalidateBotCache(botId: string): Promise<void> {
    await cacheService.delete(`${this.CACHE_PREFIX}${botId}`);
  }
}

// Export singleton instance
export const meetingBotService = new MeetingBotService();
