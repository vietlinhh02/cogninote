import dotenv from 'dotenv';

dotenv.config();

interface Config {
  env: string;
  port: number;
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  gemini: {
    apiKey: string;
  };
  openai: {
    apiKey?: string;
    endpoint?: string;
  };
  recallAI: {
    apiKey: string;
    endpoint: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    endpoint: process.env.OPENAI_ENDPOINT,
  },
  recallAI: {
    apiKey: process.env.RECALL_AI_API_KEY || '',
    endpoint: process.env.RECALL_AI_ENDPOINT || 'https://api.recall.ai/v1',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
