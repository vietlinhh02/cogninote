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
        Authorization: `Token ${this.apiKey}`,
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

      // Recall.ai API payload structure based on official docs
      const payload = {
        meeting_url: request.meetingUrl,
        bot_name: request.botName || 'CogniNote Bot',
        recording_config: {
          transcript: {
            provider: {
              recallai_streaming: {
                language_code: 'auto',
              },
            },
          },
        },
        chat: {
          on_bot_join: {
            send_to: 'everyone',
            message: 'CogniNote bot has joined to record this meeting',
          },
        },
        automatic_leave: {
          waiting_room_timeout: 120,
          noone_joined_timeout: 120,
          everyone_left_timeout: 120,
        },
      };

      const response = await this.executeWithRetry(() =>
        this.client.post('/bot', payload)
      );

      const botResponse: DeployBotResponse = {
        botId: response.data.id,
        status: this.mapBotStatus(response.data.status_changes?.[0]?.code || 'ready'),
        meetingUrl: response.data.meeting_url,
        platform: this.mapPlatform(request.platform),
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
        this.client.get(`/bot/${botId}`)
      );

      const statusResponse: BotStatusResponse = {
        botId: response.data.id,
        status: this.mapBotStatus(response.data.status_changes?.[0]?.code || 'ready'),
        meetingUrl: response.data.meeting_url,
        platform: MeetingPlatform.GOOGLE_MEET, // Default, will be updated from meeting data
        joinedAt: response.data.join_at,
        leftAt: response.data.leave_at,
        recordingStartedAt: response.data.recording?.start_time,
        recordingEndedAt: response.data.recording?.end_time,
        participants: response.data.calendar_meetings?.[0]?.participants?.map((p: any) => ({
          id: p.id,
          name: p.name,
          events: p.events,
        })),
        error: response.data.status_changes?.find((s: any) => s.code === 'fatal')?.message,
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
        this.client.delete(`/bot/${botId}`)
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
        this.client.get(`/bot/${botId}`)
      );

      // Extract video and audio URLs from the bot data
      const download: RecordingDownload = {
        audioUrl: response.data.video_url, // Recall.ai provides combined video URL
        videoUrl: response.data.video_url,
        transcriptUrl: undefined, // Transcripts are accessed separately
        expiresAt: undefined,
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
        this.client.get(`/bot/${botId}/transcript`)
      );

      const transcription: TranscriptionResponse = {
        botId,
        meetingId: response.data.metadata?.meeting_id || '',
        segments: (response.data.words || []).map((word: any) => ({
          speaker: word.speaker_id,
          text: word.text,
          startTime: word.start_time,
          endTime: word.end_time,
          confidence: 1.0,
        })),
        language: response.data.language || 'vi',
        duration: 0,
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
      ready: BotStatus.IDLE,
      joining_call: BotStatus.JOINING,
      in_waiting_room: BotStatus.JOINING,
      in_call_not_recording: BotStatus.IN_MEETING,
      in_call_recording: BotStatus.RECORDING,
      call_ended: BotStatus.COMPLETED,
      fatal: BotStatus.FAILED,
      done: BotStatus.COMPLETED,
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
