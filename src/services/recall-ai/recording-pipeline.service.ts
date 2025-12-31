import { meetingBotService, MeetingBotService } from './meeting-bot.service.js';
import { meetingRepository } from '../../repositories/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middlewares/error-handler.js';
import { BotStatus } from './types/recall-ai.types.js';

/**
 * Recording Processing Pipeline
 * Handles automatic retrieval and processing of meeting recordings
 */
export class RecordingPipelineService {
  private botService: MeetingBotService;
  private isProcessing: boolean = false;

  constructor(botService?: MeetingBotService) {
    this.botService = botService || meetingBotService;
  }

  /**
   * Process completed meetings to retrieve recordings
   */
  async processCompletedMeetings(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Recording processing already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      logger.info('Starting recording processing pipeline');

      // Find meetings with completed bot status that haven't been processed
      const meetings = await this.findMeetingsAwaitingProcessing();

      logger.info(`Found ${meetings.length} meetings to process`);

      for (const meeting of meetings) {
        try {
          await this.processMeetingRecording(meeting.id);
        } catch (error) {
          logger.error('Failed to process meeting recording', {
            meetingId: meeting.id,
            error: String(error),
          });
        }
      }

      logger.info('Recording processing pipeline completed');
    } catch (error) {
      logger.error('Recording processing pipeline failed', {
        error: String(error),
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single meeting's recording
   */
  async processMeetingRecording(meetingId: string): Promise<void> {
    logger.info('Processing meeting recording', { meetingId });

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) {
      throw new AppError('Meeting not found', 404);
    }

    const metadata = meeting.metadata as any;
    const botId = metadata?.botId;

    if (!botId) {
      logger.warn('Meeting has no bot ID, skipping', { meetingId });
      return;
    }

    // Check if already processed
    if (metadata?.recordingProcessed) {
      logger.debug('Meeting recording already processed, skipping', {
        meetingId,
      });
      return;
    }

    // Sync bot status
    const botStatus = await this.botService.syncBotStatus(meetingId);

    // Only process if bot has completed
    if (botStatus.status !== BotStatus.COMPLETED) {
      logger.debug('Bot not yet completed, skipping', {
        meetingId,
        botStatus: botStatus.status,
      });
      return;
    }

    try {
      // Retrieve recording
      logger.info('Retrieving recording', { meetingId, botId });
      const recording = await this.botService.retrieveRecording(
        meetingId,
        meeting.userId
      );

      // Retrieve transcription
      logger.info('Retrieving transcription', { meetingId, botId });
      const transcription = await this.botService.retrieveTranscription(
        meetingId,
        meeting.userId
      );

      // Mark as processed
      await meetingRepository.update(meetingId, {
        metadata: {
          ...metadata,
          recordingProcessed: true,
          recordingProcessedAt: new Date().toISOString(),
          segmentCount: transcription.segments.length,
        },
      });

      logger.info('Meeting recording processed successfully', {
        meetingId,
        segmentCount: transcription.segments.length,
        hasAudio: !!recording.audioUrl,
        hasVideo: !!recording.videoUrl,
      });
    } catch (error) {
      logger.error('Failed to process meeting recording', {
        meetingId,
        error: String(error),
      });

      // Mark as processing failed
      await meetingRepository.update(meetingId, {
        metadata: {
          ...metadata,
          recordingProcessingFailed: true,
          recordingProcessingError: String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Find meetings awaiting recording processing
   */
  private async findMeetingsAwaitingProcessing(): Promise<any[]> {
    // Find completed meetings from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const meetings = await meetingRepository.findAll({
      where: {
        status: 'completed',
        endedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Filter for meetings with bots that haven't been processed
    return meetings.filter((meeting) => {
      const metadata = meeting.metadata as any;
      return (
        metadata?.botId &&
        metadata?.botStatus === BotStatus.COMPLETED &&
        !metadata?.recordingProcessed &&
        !metadata?.recordingProcessingFailed
      );
    });
  }

  /**
   * Retry failed recording processing
   */
  async retryFailedProcessing(): Promise<void> {
    logger.info('Retrying failed recording processing');

    const meetings = await meetingRepository.findAll({
      where: {
        status: 'completed',
      },
    });

    const failedMeetings = meetings.filter((meeting) => {
      const metadata = meeting.metadata as any;
      return metadata?.recordingProcessingFailed;
    });

    logger.info(`Found ${failedMeetings.length} failed recordings to retry`);

    for (const meeting of failedMeetings) {
      try {
        // Clear failed flag
        const metadata = meeting.metadata as any;
        await meetingRepository.update(meeting.id, {
          metadata: {
            ...metadata,
            recordingProcessingFailed: false,
            recordingProcessingError: null,
          },
        });

        // Retry processing
        await this.processMeetingRecording(meeting.id);
      } catch (error) {
        logger.error('Retry failed for meeting', {
          meetingId: meeting.id,
          error: String(error),
        });
      }
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    total: number;
    processed: number;
    pending: number;
    failed: number;
  }> {
    const meetings = await meetingRepository.findAll({
      where: {
        status: 'completed',
      },
    });

    const stats = {
      total: meetings.length,
      processed: 0,
      pending: 0,
      failed: 0,
    };

    for (const meeting of meetings) {
      const metadata = meeting.metadata as any;

      if (!metadata?.botId) continue;

      if (metadata?.recordingProcessed) {
        stats.processed++;
      } else if (metadata?.recordingProcessingFailed) {
        stats.failed++;
      } else {
        stats.pending++;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const recordingPipelineService = new RecordingPipelineService();
