import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  RecallAIConfig,
  DeployBotRequest,
  DeployBotResponse,
  BotStatusResponse,
  RecordingDownload,
  TranscriptionResponse,
  RecallAPIError,
  BotStatus,
  MeetingPlatform,
} from './types/recall-ai.types.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middlewares/error-handler.js';

/**
 * Recall AI Service
 * Client for interacting with Recall AI API for meeting bot functionality
 */
export class RecallAIService {
  private client: AxiosInstance;
  private apiKey: string;
  private endpoint: string;
  private retryConfig: { maxRetries: number; retryDelay: number };

  constructor(recallConfig?: RecallAIConfig) {
    const cfg = recallConfig || {
      apiKey: config.recallAI.apiKey,
      endpoint: config.recallAI.endpoint,
    };

    this.apiKey = cfg.apiKey;
    this.endpoint = cfg.endpoint;
    this.retryConfig = cfg.retryConfig || {
      maxRetries: 3,
      retryDelay: 1000,
    };

    if (!this.apiKey) {
      logger.error('Recall AI API key not configured');
      throw new Error('Recall AI API key is required');
    }

    this.client = axios.create({
      baseURL: this.endpoint,
      timeout: cfg.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    logger.info('Recall AI service initialized', { endpoint: this.endpoint });
  }

  /**
   * Deploy a bot to join a meeting
   */
  async deployBot(request: DeployBotRequest): Promise<DeployBotResponse> {
    try {
      logger.info('Deploying bot to meeting', {
        meetingId: request.meetingId,
        platform: request.platform,
        meetingUrl: request.meetingUrl,
      });

      const payload = {
        meeting_url: request.meetingUrl,
        platform: request.platform,
        bot_name: request.botName || 'CogniNote Bot',
        recording_mode: {
          audio: request.recordAudio !== false,
          video: request.recordVideo !== false,
          transcription: request.recordTranscription !== false,
        },
        auto_leave: request.autoLeave || {
          enabled: true,
          no_activity_timeout: 5,
          waiting_room_timeout: 2,
        },
        metadata: {
          meeting_id: request.meetingId,
          ...request.metadata,
        },
      };

      const response = await this.executeWithRetry(() =>
        this.client.post('/bots', payload)
      );

      const botResponse: DeployBotResponse = {
        botId: response.data.id,
        status: this.mapBotStatus(response.data.status),
        meetingUrl: response.data.meeting_url,
        platform: this.mapPlatform(response.data.platform),
        createdAt: response.data.created_at,
      };

      logger.info('Bot deployed successfully', {
        botId: botResponse.botId,
        meetingId: request.meetingId,
      });

      return botResponse;
    } catch (error) {
      logger.error('Failed to deploy bot', {
        meetingId: request.meetingId,
        error: this.formatError(error),
      });
      throw this.handleError(error, 'Failed to deploy meeting bot');
    }
  }

  /**
   * Get bot status
   */
  async getBotStatus(botId: string): Promise<BotStatusResponse> {
    try {
      logger.debug('Fetching bot status', { botId });

      const response = await this.executeWithRetry(() =>
        this.client.get(`/bots/${botId}`)
      );

      const statusResponse: BotStatusResponse = {
        botId: response.data.id,
        status: this.mapBotStatus(response.data.status),
        meetingUrl: response.data.meeting_url,
        platform: this.mapPlatform(response.data.platform),
        joinedAt: response.data.joined_at,
        leftAt: response.data.left_at,
        recordingStartedAt: response.data.recording_started_at,
        recordingEndedAt: response.data.recording_ended_at,
        participants: response.data.participants?.map((p: any) => ({
          id: p.id,
          name: p.name,
          joinedAt: p.joined_at,
          leftAt: p.left_at,
        })),
        error: response.data.error,
      };

      return statusResponse;
    } catch (error) {
      logger.error('Failed to get bot status', {
        botId,
        error: this.formatError(error),
      });
      throw this.handleError(error, 'Failed to get bot status');
    }
  }

  /**
   * Stop a bot and make it leave the meeting
   */
  async stopBot(botId: string): Promise<void> {
    try {
      logger.info('Stopping bot', { botId });

      await this.executeWithRetry(() =>
        this.client.post(`/bots/${botId}/leave`)
      );

      logger.info('Bot stop command sent', { botId });
    } catch (error) {
      logger.error('Failed to stop bot', {
        botId,
        error: this.formatError(error),
      });
      throw this.handleError(error, 'Failed to stop bot');
    }
  }

  /**
   * Get recording download URLs
   */
  async getRecordingDownload(botId: string): Promise<RecordingDownload> {
    try {
      logger.info('Fetching recording download URLs', { botId });

      const response = await this.executeWithRetry(() =>
        this.client.get(`/bots/${botId}/recording`)
      );

      const download: RecordingDownload = {
        audioUrl: response.data.audio_url,
        videoUrl: response.data.video_url,
        transcriptUrl: response.data.transcript_url,
        expiresAt: response.data.expires_at,
      };

      return download;
    } catch (error) {
      logger.error('Failed to get recording download URLs', {
        botId,
        error: this.formatError(error),
      });
      throw this.handleError(error, 'Failed to get recording');
    }
  }

  /**
   * Get meeting transcription
   */
  async getTranscription(botId: string): Promise<TranscriptionResponse> {
    try {
      logger.info('Fetching transcription', { botId });

      const response = await this.executeWithRetry(() =>
        this.client.get(`/bots/${botId}/transcript`)
      );

      const transcription: TranscriptionResponse = {
        botId,
        meetingId: response.data.metadata?.meeting_id || '',
        segments: response.data.segments.map((seg: any) => ({
          speaker: seg.speaker,
          text: seg.text,
          startTime: seg.start_time,
          endTime: seg.end_time,
          confidence: seg.confidence,
        })),
        language: response.data.language,
        duration: response.data.duration,
      };

      logger.info('Transcription fetched', {
        botId,
        segmentCount: transcription.segments.length,
      });

      return transcription;
    } catch (error) {
      logger.error('Failed to get transcription', {
        botId,
        error: this.formatError(error),
      });
      throw this.handleError(error, 'Failed to get transcription');
    }
  }

  /**
   * Check if bot is still active
   */
  async isBotActive(botId: string): Promise<boolean> {
    try {
      const status = await this.getBotStatus(botId);
      return [BotStatus.JOINING, BotStatus.IN_MEETING, BotStatus.RECORDING].includes(
        status.status
      );
    } catch (error) {
      logger.error('Failed to check bot active status', { botId });
      return false;
    }
  }

  /**
   * Wait for bot to complete (with timeout)
   */
  async waitForBotCompletion(
    botId: string,
    timeoutMs: number = 3600000
  ): Promise<BotStatusResponse> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getBotStatus(botId);

      if (
        [BotStatus.COMPLETED, BotStatus.FAILED].includes(status.status)
      ) {
        return status;
      }

      await this.sleep(pollInterval);
    }

    throw new Error(`Bot completion timeout after ${timeoutMs}ms`);
  }

  /**
   * Map Recall AI bot status to internal status
   */
  private mapBotStatus(status: string): BotStatus {
    const statusMap: Record<string, BotStatus> = {
      idle: BotStatus.IDLE,
      joining: BotStatus.JOINING,
      in_meeting: BotStatus.IN_MEETING,
      recording: BotStatus.RECORDING,
      leaving: BotStatus.LEAVING,
      completed: BotStatus.COMPLETED,
      failed: BotStatus.FAILED,
    };

    return statusMap[status] || BotStatus.IDLE;
  }

  /**
   * Map Recall AI platform to internal platform
   */
  private mapPlatform(platform: string): MeetingPlatform {
    const platformMap: Record<string, MeetingPlatform> = {
      zoom: MeetingPlatform.ZOOM,
      google_meet: MeetingPlatform.GOOGLE_MEET,
      microsoft_teams: MeetingPlatform.MICROSOFT_TEAMS,
      webex: MeetingPlatform.WEBEX,
    };

    return platformMap[platform] || MeetingPlatform.ZOOM;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status) {
          const status = error.response.status;
          if (status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === this.retryConfig.maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.retryConfig.retryDelay * Math.pow(2, attempt);
        logger.warn('Retrying Recall AI request', {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          delay,
        });

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, defaultMessage: string): AppError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<RecallAPIError>;

      if (axiosError.response?.data?.error) {
        const apiError = axiosError.response.data.error;
        return new AppError(
          apiError.message || defaultMessage,
          axiosError.response.status || 500
        );
      }

      if (axiosError.response?.status) {
        return new AppError(
          axiosError.message || defaultMessage,
          axiosError.response.status
        );
      }
    }

    logger.error('Unexpected error in Recall AI service', { error });
    return new AppError(defaultMessage, 500);
  }

  /**
   * Format error for logging
   */
  private formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return `${error.message} - ${JSON.stringify(error.response?.data)}`;
    }
    return String(error);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const recallAIService = new RecallAIService();
