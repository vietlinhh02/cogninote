import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limit during hot reloads
type PrismaClientWithLogs = PrismaClient<{
  log: [
    { level: 'query'; emit: 'event' },
    { level: 'error'; emit: 'event' },
    { level: 'warn'; emit: 'event' },
  ];
}>;

const globalForPrisma = global as unknown as { prisma: PrismaClientWithLogs };

export const prisma: PrismaClientWithLogs =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

// Log Prisma queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

prisma.$on('warn', (e: any) => {
  logger.warn(`Prisma Warning: ${e.message}`);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Prisma connected to database successfully');
  } catch (error) {
    logger.error('Prisma connection failed:', error);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected from database');
  } catch (error) {
    logger.error('Error disconnecting Prisma:', error);
  }
};

// Export for backward compatibility
export const getDatabase = () => prisma;
