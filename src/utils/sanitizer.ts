
const SENSITIVE_KEYS = [
  'api_key',
  'apiKey',
  'apikey',
  'authorization',
  'token',
  'access_token',
  'refreshToken',
  'password',
  'secret',
  'client_secret',
  'connectionString',
];

const API_KEY_REGEX = /sk-[a-zA-Z0-9]{20,}/;

/**
 * Recursively sanitizes sensitive data from an object
 */
export const sanitizeLogData = (data: any): any => {
  if (!data) return data;

  if (typeof data === 'string') {
    // Check if string contains API key pattern
    if (API_KEY_REGEX.test(data)) {
        return data.replace(API_KEY_REGEX, '***');
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item));
  }

  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }

  return data;
};
