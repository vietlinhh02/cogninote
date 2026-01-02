import App from './app.js';
import { logger } from './utils/logger.js';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { meetingBotScheduler } from './jobs/meeting-bot.job.js';

async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start meeting bot scheduler
    meetingBotScheduler.start();
    logger.info('Meeting bot scheduler started');

    // Start server
    const app = new App();
    app.listen();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  meetingBotScheduler.stop();
  process.exit(0);
});

bootstrap();
