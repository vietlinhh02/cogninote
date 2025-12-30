import { CacheService } from '../services/cache.service';
import { getRedis, connectRedis, closeRedis } from '../config/redis';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeAll(async () => {
    await connectRedis();
    cacheService = new CacheService();
  });

  afterAll(async () => {
    await closeRedis();
  });

  beforeEach(async () => {
    // Clean up test keys before each test
    const redis = getRedis();
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  });

  describe('get and set', () => {
    it('should set and get a value', async () => {
      const key = 'test:simple';
      const value = { name: 'Test', count: 42 };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('test:nonexistent');
      expect(result).toBeNull();
    });

    it('should set value with TTL', async () => {
      const key = 'test:ttl';
      const value = { data: 'expires soon' };

      await cacheService.set(key, value, 2);

      let result = await cacheService.get(key);
      expect(result).toEqual(value);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 2100));

      result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      const key = 'test:delete';
      await cacheService.set(key, { data: 'to be deleted' });

      const deleted = await cacheService.delete(key);
      expect(deleted).toBe(true);

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });
  });

  describe('deletePattern', () => {
    it('should delete keys matching pattern', async () => {
      await cacheService.set('test:pattern:1', { id: 1 });
      await cacheService.set('test:pattern:2', { id: 2 });
      await cacheService.set('test:other', { id: 3 });

      const count = await cacheService.deletePattern('test:pattern:*');
      expect(count).toBe(2);

      const result1 = await cacheService.get('test:pattern:1');
      const result2 = await cacheService.get('test:pattern:2');
      const result3 = await cacheService.get('test:other');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toEqual({ id: 3 });
    });
  });

  describe('exists', () => {
    it('should check if key exists', async () => {
      const key = 'test:exists';

      let exists = await cacheService.exists(key);
      expect(exists).toBe(false);

      await cacheService.set(key, { data: 'test' });

      exists = await cacheService.exists(key);
      expect(exists).toBe(true);
    });
  });

  describe('expire', () => {
    it('should set expiration on existing key', async () => {
      const key = 'test:expire';
      await cacheService.set(key, { data: 'test' });

      await cacheService.expire(key, 1);

      // Check TTL
      const ttl = await cacheService.ttl(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });
  });

  describe('increment and decrement', () => {
    it('should increment counter', async () => {
      const key = 'test:counter';

      let count = await cacheService.increment(key);
      expect(count).toBe(1);

      count = await cacheService.increment(key, 5);
      expect(count).toBe(6);
    });

    it('should decrement counter', async () => {
      const key = 'test:counter';
      await cacheService.increment(key, 10);

      let count = await cacheService.decrement(key);
      expect(count).toBe(9);

      count = await cacheService.decrement(key, 3);
      expect(count).toBe(6);
    });
  });

  describe('getOrSet', () => {
    it('should get cached value if exists', async () => {
      const key = 'test:getOrSet';
      const cachedValue = { data: 'cached' };
      await cacheService.set(key, cachedValue);

      let callbackCalled = false;
      const result = await cacheService.getOrSet(key, async () => {
        callbackCalled = true;
        return { data: 'new' };
      });

      expect(result).toEqual(cachedValue);
      expect(callbackCalled).toBe(false);
    });

    it('should execute callback and cache result if not exists', async () => {
      const key = 'test:getOrSet:new';
      const newValue = { data: 'new' };

      const result = await cacheService.getOrSet(key, async () => newValue);

      expect(result).toEqual(newValue);

      const cached = await cacheService.get(key);
      expect(cached).toEqual(newValue);
    });
  });

  describe('Hash operations', () => {
    it('should set and get hash field', async () => {
      const key = 'test:hash';
      const field = 'user:1';
      const value = { name: 'John', age: 30 };

      await cacheService.hSet(key, field, value);
      const result = await cacheService.hGet(key, field);

      expect(result).toEqual(value);
    });

    it('should get all hash fields', async () => {
      const key = 'test:hash:all';
      await cacheService.hSet(key, 'user:1', { name: 'John' });
      await cacheService.hSet(key, 'user:2', { name: 'Jane' });

      const result = await cacheService.hGetAll(key);

      expect(result['user:1']).toEqual({ name: 'John' });
      expect(result['user:2']).toEqual({ name: 'Jane' });
    });

    it('should delete hash field', async () => {
      const key = 'test:hash:del';
      const field = 'user:1';
      await cacheService.hSet(key, field, { name: 'John' });

      await cacheService.hDel(key, field);
      const result = await cacheService.hGet(key, field);

      expect(result).toBeNull();
    });
  });

  describe('Set operations', () => {
    it('should add and get set members', async () => {
      const key = 'test:set';

      await cacheService.sAdd(key, 'member1', 'member2', 'member3');
      const members = await cacheService.sMembers(key);

      expect(members).toHaveLength(3);
      expect(members).toContain('member1');
      expect(members).toContain('member2');
      expect(members).toContain('member3');
    });

    it('should check if member exists in set', async () => {
      const key = 'test:set:member';
      await cacheService.sAdd(key, 'member1');

      const exists = await cacheService.sIsMember(key, 'member1');
      const notExists = await cacheService.sIsMember(key, 'member2');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should remove member from set', async () => {
      const key = 'test:set:rem';
      await cacheService.sAdd(key, 'member1', 'member2');

      await cacheService.sRem(key, 'member1');
      const members = await cacheService.sMembers(key);

      expect(members).toHaveLength(1);
      expect(members).not.toContain('member1');
    });
  });
});
