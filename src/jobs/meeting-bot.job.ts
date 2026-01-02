import * as cron from 'node-cron';
import { meetingBotService } from '../services/recall-ai/meeting-bot.service.js';
import { logger } from '../utils/logger.js';

/**
 * Meeting Bot Scheduler
 * Automatically deploys bots for upcoming meetings
 */
export class MeetingBotScheduler {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the scheduler
   * Runs every 5 minutes to check for upcoming meetings
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Meeting bot scheduler is already running');
      return;
    }

    // Run every 5 minutes
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Running meeting bot auto-deploy job');
        await meetingBotService.autoDeployForScheduledMeetings();
      } catch (error) {
        logger.error('Meeting bot auto-deploy job failed', {
          error: String(error),
        });
      }
    });

    logger.info('Meeting bot scheduler started (runs every 5 minutes)');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Meeting bot scheduler stopped');
    }
  }

  /**
   * Run the job immediately (for testing)
   */
  async runNow(): Promise<void> {
    logger.info('Running meeting bot auto-deploy job manually');
    await meetingBotService.autoDeployForScheduledMeetings();
  }
}

// Export singleton instance
export const meetingBotScheduler = new MeetingBotScheduler();
