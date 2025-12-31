import { sanitizeLogData } from '../utils/sanitizer.js';

describe('Log Sanitizer', () => {
  it('should sanitize known sensitive keys', () => {
    const sensitiveData = {
      apiKey: 'sk-1234567890abcdef',
      authorization: 'Bearer sk-1234567890abcdef',
      nested: {
        password: 'supersecretpassword',
        token: 'eyJhGci...'
      }
    };

    const sanitized = sanitizeLogData(sensitiveData);

    expect(sanitized.apiKey).toBe('***');
    expect(sanitized.authorization).toBe('***');
    expect(sanitized.nested.password).toBe('***');
    expect(sanitized.nested.token).toBe('***');
  });

  it('should sanitize strings looking like API keys in arbitrary fields', () => {
    const data = {
      message: 'Error with key sk-1234567890abcdef1234567890',
      details: 'Check sk-abcdef1234567890abcdef123456'
    };

    const sanitized = sanitizeLogData(data);

    expect(sanitized.message).toContain('***');
    expect(sanitized.message).not.toContain('sk-1234567890abcdef1234567890');
    expect(sanitized.details).toContain('***');
  });

  it('should handle arrays', () => {
    const list = [
      { apiKey: 'secret' },
      'normal string',
      'string with sk-1234567890abcdef1234567890'
    ];

    const sanitized = sanitizeLogData(list);

    expect(sanitized[0].apiKey).toBe('***');
    expect(sanitized[1]).toBe('normal string');
    expect(sanitized[2]).not.toContain('sk-1234567890abcdef1234567890');
  });

  it('should handle deeply nested objects', () => {
    const data = {
        level1: {
            level2: {
                level3: {
                    apiKey: 'secret'
                }
            }
        }
    };

    const sanitized = sanitizeLogData(data);
    expect(sanitized.level1.level2.level3.apiKey).toBe('***');
  });

  it('should preserve non-sensitive data', () => {
      const data = {
          name: 'John Doe',
          age: 30,
          config: {
              enabled: true
          }
      };

      const sanitized = sanitizeLogData(data);
      expect(sanitized).toEqual(data);
  });
});
