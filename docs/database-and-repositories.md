# Database Models and Repository Layer

## Overview

This document describes the database models, repository pattern implementation, and Redis integration for the CogniNote backend.

## Database Models

### Prisma Models

#### Meeting
Represents a meeting session with transcription and analysis capabilities.

**Fields:**
- `id` (String, UUID): Primary key
- `userId` (String): Foreign key to User
- `title` (String): Meeting title
- `description` (String, optional): Meeting description
- `meetingUrl` (String, optional): Meeting URL
- `platform` (String, optional): Platform (Zoom, Teams, etc.)
- `scheduledAt` (DateTime, optional): Scheduled start time
- `startedAt` (DateTime, optional): Actual start time
- `endedAt` (DateTime, optional): Actual end time
- `status` (String): Meeting status (scheduled, in_progress, completed)
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `user`: Belongs to User
- `transcriptions`: Has many Transcription records
- `analysisResults`: Has many AnalysisResult records

#### Transcription
Stores transcribed text segments from meetings.

**Fields:**
- `id` (String, UUID): Primary key
- `meetingId` (String): Foreign key to Meeting
- `speakerName` (String, optional): Speaker identifier
- `text` (String): Transcribed text
- `timestampStart` (DateTime, optional): Segment start time
- `timestampEnd` (DateTime, optional): Segment end time
- `confidence` (Decimal, optional): Transcription confidence score (0-1)
- `createdAt` (DateTime): Creation timestamp

**Relations:**
- `meeting`: Belongs to Meeting

#### AnalysisResult
Stores AI-generated analysis of meetings.

**Fields:**
- `id` (String, UUID): Primary key
- `meetingId` (String): Foreign key to Meeting
- `analysisType` (String): Type of analysis (summary, sentiment, etc.)
- `summary` (String, optional): Text summary
- `keyPoints` (JSON, optional): Key discussion points
- `actionItems` (JSON, optional): Action items identified
- `sentiment` (String, optional): Overall sentiment
- `topics` (JSON, optional): Discussion topics
- `participants` (JSON, optional): Participant information
- `metadata` (JSON, optional): Additional metadata
- `createdAt` (DateTime): Creation timestamp
- `updatedAt` (DateTime): Last update timestamp

**Relations:**
- `meeting`: Belongs to Meeting

## Repository Pattern

### Base Repository

The `BaseRepository` class provides common CRUD operations for all repositories:

**Methods:**
- `findById(id)`: Find single record by ID
- `findAll(options)`: Find multiple records with filtering
- `findOne(where, include)`: Find first matching record
- `create(data)`: Create new record
- `update(id, data)`: Update existing record
- `delete(id)`: Delete record by ID
- `count(where)`: Count matching records
- `exists(where)`: Check if record exists
- `createMany(data)`: Batch create records
- `updateMany(where, data)`: Batch update records
- `deleteMany(where)`: Batch delete records

### Meeting Repository

**Additional Methods:**
- `findByUserId(userId, options)`: Get user's meetings
- `findByStatus(status, options)`: Get meetings by status
- `findUpcomingMeetings(userId, options)`: Get future meetings
- `findPastMeetings(userId, options)`: Get past/completed meetings
- `findByIdWithTranscriptions(id)`: Get meeting with transcriptions
- `findByIdWithAnalysis(id)`: Get meeting with analysis results
- `findByIdWithRelations(id)`: Get meeting with all relations
- `updateStatus(id, status)`: Update meeting status
- `startMeeting(id)`: Mark meeting as started
- `endMeeting(id)`: Mark meeting as completed
- `countByUserId(userId)`: Count user's meetings
- `countByStatus(status)`: Count by status

**Usage Example:**
```typescript
import { meetingRepository } from './repositories';

// Create meeting
const meeting = await meetingRepository.create({
  userId: 'user-id',
  title: 'Team Standup',
  scheduledAt: new Date(),
  status: 'scheduled',
});

// Get meetings with transcriptions
const meetingWithData = await meetingRepository.findByIdWithTranscriptions(meeting.id);

// Start meeting
await meetingRepository.startMeeting(meeting.id);
```

### Transcription Repository

**Additional Methods:**
- `findByMeetingId(meetingId, options)`: Get meeting transcriptions
- `findBySpeaker(meetingId, speakerName, options)`: Get speaker's segments
- `findByTimeRange(meetingId, start, end)`: Get segments in time range
- `findLowConfidence(meetingId, threshold)`: Get low-confidence segments
- `getFullTranscript(meetingId)`: Get complete transcript text
- `countByMeetingId(meetingId)`: Count segments
- `getUniqueSpeakers(meetingId)`: Get list of speakers
- `deleteByMeetingId(meetingId)`: Delete all meeting transcriptions
- `bulkCreate(data)`: Batch create transcriptions
- `getAverageConfidence(meetingId)`: Get average confidence score

**Usage Example:**
```typescript
import { transcriptionRepository } from './repositories';

// Bulk create transcriptions
await transcriptionRepository.bulkCreate([
  {
    meetingId: 'meeting-id',
    speakerName: 'John',
    text: 'Hello everyone',
    timestampStart: new Date(),
    confidence: new Decimal(0.95),
  },
  // ... more segments
]);

// Get full transcript
const transcript = await transcriptionRepository.getFullTranscript('meeting-id');
```

### AnalysisResult Repository

**Additional Methods:**
- `findByMeetingId(meetingId, options)`: Get meeting analysis results
- `findByType(analysisType, options)`: Get results by type
- `findByMeetingAndType(meetingId, type)`: Get specific analysis
- `findLatestByMeetingId(meetingId)`: Get latest analysis
- `findAnalysisTypesByMeetingId(meetingId)`: Get available analysis types
- `existsForMeetingAndType(meetingId, type)`: Check if analysis exists
- `upsert(meetingId, type, data)`: Create or update analysis
- `deleteByMeetingId(meetingId)`: Delete all analyses
- `deleteByType(type)`: Delete by type
- `countByMeetingId(meetingId)`: Count analyses
- `getUniqueAnalysisTypes()`: Get all analysis types
- `findBySentiment(sentiment, options)`: Get by sentiment
- `getSummaryByMeetingId(meetingId)`: Get meeting summary

**Usage Example:**
```typescript
import { analysisResultRepository } from './repositories';

// Create or update analysis
await analysisResultRepository.upsert(
  'meeting-id',
  'summary',
  {
    summary: 'Meeting focused on Q4 planning...',
    keyPoints: ['Budget review', 'Timeline discussion'],
    actionItems: [{ task: 'Send Q4 report', assignee: 'John' }],
    sentiment: 'positive',
  }
);

// Get summary
const summary = await analysisResultRepository.getSummaryByMeetingId('meeting-id');
```

## Redis Integration

### Cache Service

Provides caching utilities with automatic serialization/deserialization.

**Methods:**
- `get<T>(key)`: Get cached value
- `set(key, value, ttl)`: Set cached value with optional TTL
- `delete(key)`: Delete cached value
- `deletePattern(pattern)`: Delete keys matching pattern
- `exists(key)`: Check if key exists
- `expire(key, ttl)`: Set expiration
- `ttl(key)`: Get time to live
- `increment(key, amount)`: Increment counter
- `decrement(key, amount)`: Decrement counter
- `getOrSet<T>(key, callback, ttl)`: Get or compute and cache
- `hSet(key, field, value)`: Store in hash
- `hGet<T>(key, field)`: Get from hash
- `hGetAll<T>(key)`: Get all hash fields
- `hDel(key, field)`: Delete hash field
- `sAdd(key, ...members)`: Add to set
- `sRem(key, ...members)`: Remove from set
- `sMembers(key)`: Get set members
- `sIsMember(key, member)`: Check set membership
- `flushAll()`: Clear all cache (use with caution)

**Usage Example:**
```typescript
import { cacheService } from './services/cache.service';

// Simple caching
await cacheService.set('user:123', userData, 300); // 5 minutes TTL
const user = await cacheService.get<User>('user:123');

// Get or compute
const meetings = await cacheService.getOrSet(
  'meetings:user:123',
  async () => await meetingRepository.findByUserId('123'),
  300
);

// Counters
await cacheService.increment('api:requests:count');
```

### Session Service

Manages user sessions with Redis.

**Methods:**
- `create(sessionId, data, ttl)`: Create new session
- `get(sessionId)`: Get session data
- `update(sessionId, updates)`: Update session
- `delete(sessionId)`: Delete session
- `extend(sessionId, ttl)`: Extend session expiration
- `getUserSessions(userId)`: Get all user sessions
- `deleteAllUserSessions(userId)`: Delete all user sessions
- `exists(sessionId)`: Check if session exists
- `countUserSessions(userId)`: Count active sessions
- `cleanupExpiredSessions()`: Remove expired sessions

**Session Data Interface:**
```typescript
interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  [key: string]: any; // Additional custom fields
}
```

**Usage Example:**
```typescript
import { sessionService } from './services/session.service';

// Create session
const session = await sessionService.create(
  'session-uuid',
  {
    userId: 'user-id',
    email: 'user@example.com',
    role: 'USER',
  },
  7 * 24 * 60 * 60 // 7 days
);

// Get session
const sessionData = await sessionService.get('session-uuid');

// Logout all devices
await sessionService.deleteAllUserSessions('user-id');
```

## Database Migrations

### Running Migrations

1. **Generate Prisma Client:**
```bash
npm run prisma:generate
```

2. **Create Migration:**
```bash
npm run prisma:migrate
# Enter migration name: add_analysis_result_model
```

3. **Apply Migration:**
```bash
npx prisma migrate deploy
```

4. **View Database:**
```bash
npm run prisma:studio
```

### Migration Files

Migrations are stored in `prisma/migrations/` directory. Each migration includes:
- SQL migration file
- Migration metadata

## Service Layer

### Meeting Service

Business logic layer using repositories with caching.

**Key Features:**
- Automatic cache invalidation on updates
- Authorization checks
- Meeting lifecycle management (start/end)
- Statistics aggregation

**Usage Example:**
```typescript
import { meetingService } from './services/meeting.service';

// Create meeting
const meeting = await meetingService.createMeeting({
  userId: 'user-id',
  title: 'Team Sync',
  scheduledAt: new Date(),
});

// Start meeting (with auth check)
await meetingService.startMeeting(meeting.id, 'user-id');

// Get with caching
const meetingData = await meetingService.getMeetingWithTranscriptions(meeting.id);

// Get statistics
const stats = await meetingService.getUserMeetingStats('user-id');
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- meeting.repository.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Structure

- `src/tests/meeting.repository.test.ts`: Meeting repository tests
- `src/tests/cache.service.test.ts`: Cache service tests
- Additional test files for other repositories and services

### Test Database

Tests use the same database as development. Ensure you:
1. Clean up test data in `afterEach` hooks
2. Use unique identifiers for test data
3. Never run tests against production database

## Best Practices

### Repository Pattern

1. **Use repositories in services, never directly in controllers**
2. **Keep business logic in services, not repositories**
3. **Use transactions for multi-step operations**
4. **Implement caching at service layer, not repository**

### Caching Strategy

1. **Cache frequently accessed, rarely changed data**
2. **Use appropriate TTL based on data volatility**
3. **Invalidate cache on updates**
4. **Use cache patterns (getOrSet) to prevent cache stampede**

### Session Management

1. **Use sessions for authenticated state**
2. **Set appropriate session expiration**
3. **Clean up sessions on logout**
4. **Support multi-device sessions per user**

## Environment Variables

Add to `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cogninote?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Redis Documentation](https://redis.io/docs)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
