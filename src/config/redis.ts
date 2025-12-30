import { createClient, RedisClientType } from 'redis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType> => {
  try {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    });

    redisClient.on('error', (error) => {
      logger.error('Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

export const getRedis = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
