import { PasswordUtil } from '../utils/password.util.js';

describe('PasswordUtil', () => {
  describe('hash', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordUtil.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await PasswordUtil.hash(password);
      const hash2 = await PasswordUtil.hash(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('compare', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordUtil.hash(password);
      const isMatch = await PasswordUtil.compare(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123';
      const hash = await PasswordUtil.hash(password);
      const isMatch = await PasswordUtil.compare('WrongPassword', hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validate', () => {
    it('should accept valid password', () => {
      const result = PasswordUtil.validate('ValidPass123');

      expect(result.valid).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = PasswordUtil.validate('Short1');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters long');
    });

    it('should reject empty password', () => {
      const result = PasswordUtil.validate('');

      expect(result.valid).toBe(false);
    });
  });
});
