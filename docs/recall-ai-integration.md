# Recall AI Integration Documentation

## Overview

The Recall AI integration provides automated meeting bot functionality for CogniNote, enabling:
- Automatic bot deployment to scheduled meetings
- Meeting recording and transcription
- Real-time bot status monitoring
- Automated recording retrieval and processing

## Architecture

### Services

#### 1. RecallAIService
**Location:** `src/services/recall-ai/recall-ai.service.ts`

Low-level client for interacting with the Recall AI REST API.

**Key Methods:**
- `deployBot(request: DeployBotRequest)` - Deploy a bot to join a meeting
- `getBotStatus(botId: string)` - Get current bot status
- `stopBot(botId: string)` - Stop a bot and make it leave
- `getRecordingDownload(botId: string)` - Get recording download URLs
- `getTranscription(botId: string)` - Retrieve meeting transcription
- `isBotActive(botId: string)` - Check if bot is still active
- `waitForBotCompletion(botId: string, timeout: number)` - Wait for bot to complete

**Features:**
- Automatic retry with exponential backoff
- Error handling and logging
- API response mapping to internal types

#### 2. MeetingBotService
**Location:** `src/services/recall-ai/meeting-bot.service.ts`

High-level service for managing meeting bot lifecycle with database integration.

**Key Methods:**
- `deployBotToMeeting(meetingId, userId, options?)` - Deploy bot for a meeting
- `getBotStatus(botId)` - Get bot status (with caching)
- `stopBot(botId, userId)` - Stop a bot (with authorization)
- `retrieveRecording(meetingId, userId)` - Get meeting recording
- `retrieveTranscription(meetingId, userId)` - Get and store transcription
- `syncBotStatus(meetingId)` - Sync bot status with meeting
- `autoDeployForScheduledMeetings()` - Auto-deploy bots for upcoming meetings

**Features:**
- User authorization checks
- Meeting platform detection (Zoom, Google Meet, Teams, Webex)
- Automatic meeting status updates based on bot status
- Redis caching for bot data
- Transcription storage in database

#### 3. RecordingPipelineService
**Location:** `src/services/recall-ai/recording-pipeline.service.ts`

Automated pipeline for processing completed meeting recordings.

**Key Methods:**
- `processCompletedMeetings()` - Process all completed meetings
- `processMeetingRecording(meetingId)` - Process a single meeting
- `retryFailedProcessing()` - Retry failed recordings
- `getProcessingStats()` - Get processing statistics

**Features:**
- Automatic recording retrieval
- Transcription storage
- Error handling and retry mechanism
- Processing status tracking

## Data Models

### Bot Status Enum
```typescript
enum BotStatus {
  IDLE = 'idle',
  JOINING = 'joining',
  IN_MEETING = 'in_meeting',
  RECORDING = 'recording',
  LEAVING = 'leaving',
  COMPLETED = 'completed',
  FAILED = 'failed',
}
```

### Meeting Platform Enum
```typescript
enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  WEBEX = 'webex',
}
```

### Meeting Metadata Structure
Stored in `Meeting.metadata` JSON field:
```json
{
  "botId": "bot-abc123",
  "botStatus": "in_meeting",
  "botDeployedAt": "2024-01-01T10:00:00Z",
  "botStoppedAt": "2024-01-01T11:00:00Z",
  "recordingAudioUrl": "https://...",
  "recordingVideoUrl": "https://...",
  "recordingTranscriptUrl": "https://...",
  "recordingExpiresAt": "2024-01-02T10:00:00Z",
  "recordingProcessed": true,
  "recordingProcessedAt": "2024-01-01T11:05:00Z",
  "segmentCount": 145
}
```

## Usage Examples

### 1. Deploy a Bot to a Meeting

```typescript
import { meetingBotService } from './services/recall-ai';

// Deploy bot with default settings
const botData = await meetingBotService.deployBotToMeeting(
  'meeting-123',
  'user-456'
);

// Deploy bot with custom options
const botData = await meetingBotService.deployBotToMeeting(
  'meeting-123',
  'user-456',
  {
    botName: 'Custom Bot Name',
    recordAudio: true,
    recordVideo: false,
    recordTranscription: true,
  }
);

console.log('Bot deployed:', botData.botId);
```

### 2. Check Bot Status

```typescript
import { meetingBotService } from './services/recall-ai';

const status = await meetingBotService.getBotStatus('bot-abc123');

console.log('Bot status:', status.status);
console.log('Joined at:', status.joinedAt);
console.log('Platform:', status.platform);
```

### 3. Stop a Bot

```typescript
import { meetingBotService } from './services/recall-ai';

await meetingBotService.stopBot('bot-abc123', 'user-456');
console.log('Bot stopped');
```

### 4. Retrieve Recording

```typescript
import { meetingBotService } from './services/recall-ai';

const recording = await meetingBotService.retrieveRecording(
  'meeting-123',
  'user-456'
);

console.log('Audio URL:', recording.audioUrl);
console.log('Video URL:', recording.videoUrl);
console.log('Expires:', recording.expiresAt);
```

### 5. Retrieve Transcription

```typescript
import { meetingBotService } from './services/recall-ai';

const transcription = await meetingBotService.retrieveTranscription(
  'meeting-123',
  'user-456'
);

console.log('Segments:', transcription.segments.length);
console.log('Duration:', transcription.duration);

// Transcription segments are automatically stored in database
```

### 6. Auto-Deploy for Scheduled Meetings

```typescript
import { meetingBotService } from './services/recall-ai';

// Run this periodically (e.g., every 5 minutes via cron)
await meetingBotService.autoDeployForScheduledMeetings();
```

### 7. Process Completed Recordings

```typescript
import { recordingPipelineService } from './services/recall-ai';

// Run this periodically (e.g., every 10 minutes via cron)
await recordingPipelineService.processCompletedMeetings();

// Get processing statistics
const stats = await recordingPipelineService.getProcessingStats();
console.log('Processed:', stats.processed);
console.log('Pending:', stats.pending);
console.log('Failed:', stats.failed);
```

## Configuration

### Environment Variables

Add to `.env`:
```bash
# Recall AI
RECALL_AI_API_KEY=your-recall-ai-api-key
RECALL_AI_ENDPOINT=https://api.recall.ai/v1
```

### Configuration Object

Located in `src/config/index.ts`:
```typescript
recallAI: {
  apiKey: process.env.RECALL_AI_API_KEY || '',
  endpoint: process.env.RECALL_AI_ENDPOINT || 'https://api.recall.ai/v1',
}
```

## Database Schema Updates

### Migration: Add Metadata Field

File: `prisma/migrations/20251231_add_meeting_metadata/migration.sql`

```sql
ALTER TABLE "meetings" ADD COLUMN "metadata" JSONB;
```

Run migration:
```bash
npx prisma migrate deploy
```

### Updated Meeting Model

```prisma
model Meeting {
  id           String    @id @default(uuid())
  userId       String    @map("user_id")
  title        String
  description  String?
  meetingUrl   String?   @map("meeting_url")
  platform     String?
  scheduledAt  DateTime? @map("scheduled_at")
  startedAt    DateTime? @map("started_at")
  endedAt      DateTime? @map("ended_at")
  status       String    @default("scheduled")
  metadata     Json?     // NEW FIELD
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  transcriptions  Transcription[]
  analysisResults AnalysisResult[]

  @@index([userId])
  @@index([scheduledAt])
  @@map("meetings")
}
```

## Meeting Platform Detection

The service automatically detects meeting platforms from URLs:

| Platform | URL Pattern |
|----------|-------------|
| Zoom | `zoom.us`, `zoom.com` |
| Google Meet | `meet.google.com` |
| Microsoft Teams | `teams.microsoft.com` |
| Webex | `webex.com` |

Example:
```typescript
// Automatically detected as ZOOM
meetingUrl: "https://zoom.us/j/123456789"

// Automatically detected as GOOGLE_MEET
meetingUrl: "https://meet.google.com/abc-defg-hij"
```

## Error Handling

All services use the `AppError` class for consistent error handling:

```typescript
try {
  await meetingBotService.deployBotToMeeting(meetingId, userId);
} catch (error) {
  if (error instanceof AppError) {
    // Handle application errors
    console.error(`Error ${error.statusCode}:`, error.message);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

Common error codes:
- `404` - Meeting not found, Bot not found
- `403` - Unauthorized access
- `400` - Invalid request (missing URL, invalid platform)
- `500` - API or server errors

## Retry Logic

The `RecallAIService` implements automatic retry with exponential backoff:

- **Max retries:** 3
- **Initial delay:** 1000ms
- **Backoff:** Exponential (1s, 2s, 4s)
- **Retryable errors:** 5xx, 429 (rate limit)
- **Non-retryable:** 4xx (except 429)

## Caching

Bot status is cached in Redis for 5 minutes to reduce API calls:

```typescript
// Cache key format
bot:{botId}

// TTL: 300 seconds (5 minutes)
```

## Automated Workflows

### 1. Auto-Deploy Workflow

**Trigger:** Cron job every 5 minutes

**Process:**
1. Find meetings scheduled in next 15 minutes
2. Check if meeting has URL and no existing bot
3. Deploy bot automatically
4. Update meeting metadata

**Setup:**
```typescript
// In your scheduler (e.g., node-cron)
import cron from 'node-cron';
import { meetingBotService } from './services/recall-ai';

cron.schedule('*/5 * * * *', async () => {
  await meetingBotService.autoDeployForScheduledMeetings();
});
```

### 2. Recording Processing Workflow

**Trigger:** Cron job every 10 minutes

**Process:**
1. Find completed meetings from last 7 days
2. Check if bot completed and recording not processed
3. Retrieve recording URLs and transcription
4. Store transcription segments in database
5. Mark as processed

**Setup:**
```typescript
import cron from 'node-cron';
import { recordingPipelineService } from './services/recall-ai';

cron.schedule('*/10 * * * *', async () => {
  await recordingPipelineService.processCompletedMeetings();
});
```

## Testing

### Unit Tests

Location: `src/tests/`

Run tests:
```bash
npm test recall-ai
```

### Test Coverage

- `RecallAIService`: API client, retry logic, error handling
- `MeetingBotService`: Bot lifecycle, authorization, platform detection
- `RecordingPipelineService`: (Add tests as needed)

### Mock Services

Tests use Jest mocks for:
- Axios HTTP client
- Prisma database client
- Redis cache service

## Security Considerations

1. **API Key Storage:** Store Recall AI API key in environment variables, never in code
2. **User Authorization:** All bot operations verify user ownership of meeting
3. **Recording URLs:** Expire after set time period from Recall AI
4. **Input Validation:** Meeting URLs validated before bot deployment
5. **Rate Limiting:** Automatic retry respects rate limits

## Performance Optimization

1. **Caching:** Bot status cached for 5 minutes
2. **Batch Processing:** Recording pipeline processes multiple meetings
3. **Async Operations:** All API calls are asynchronous
4. **Retry Logic:** Prevents API call failures from cascading

## Troubleshooting

### Bot Not Joining Meeting

**Possible causes:**
- Invalid meeting URL
- Meeting requires authentication
- Platform not supported
- Rate limit exceeded

**Debug:**
```typescript
const status = await recallAIService.getBotStatus(botId);
console.log('Status:', status);
console.log('Error:', status.error);
```

### Recording Not Available

**Possible causes:**
- Bot hasn't completed yet
- Recording failed
- Meeting was too short
- Recording URLs expired

**Check:**
```typescript
const status = await meetingBotService.getBotStatus(botId);
if (status.status !== BotStatus.COMPLETED) {
  console.log('Bot not yet completed');
}
```

### Transcription Missing

**Possible causes:**
- No audio in meeting
- Transcription disabled
- Processing not complete

**Verify:**
```typescript
const meeting = await meetingRepository.findByIdWithTranscriptions(meetingId);
console.log('Transcription count:', meeting.transcriptions.length);
```

## API Reference

See type definitions in `src/services/recall-ai/types/recall-ai.types.ts` for complete API documentation.

## Future Enhancements

Potential improvements:
- Real-time bot status webhooks
- Speaker diarization improvements
- Custom bot branding
- Multi-language transcription
- Video highlights extraction
- Automatic meeting summaries via AI
