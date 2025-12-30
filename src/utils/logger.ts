import winston from 'winston';
import { config } from '../config/index.js';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage for correlation ID tracking
export const asyncLocalStorage = new AsyncLocalStorage<{ correlationId: string }>();

// Custom format to include correlation ID
const correlationIdFormat = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store?.correlationId) {
    info.correlationId = store.correlationId;
  }
  return info;
});

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  correlationIdFormat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  correlationIdFormat(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const correlationIdStr = correlationId ? `[${correlationId}] ` : '';
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${correlationIdStr}${message} ${metaStr}`;
  }),
);

export const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
