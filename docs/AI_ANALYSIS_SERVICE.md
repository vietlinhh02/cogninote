# AI Analysis Service

Comprehensive AI-powered meeting analysis service using Google Gemini AI for content analysis, sentiment analysis, insight extraction, and meeting summarization.

## Features

### 1. Meeting Content Analysis
- Comprehensive conversation analysis
- Sentiment detection with confidence scores
- Key insight extraction with categorization
- Topic identification with relevance scoring

### 2. Sentiment Analysis
- Overall meeting sentiment classification (positive, neutral, negative, mixed)
- Emotional tone distribution
- Confidence-based sentiment scoring
- Context-aware reasoning

### 3. Insight Extraction
- Automated key insight identification
- Categorization (decision, agreement, concern, action, discussion)
- Speaker attribution for each insight
- Confidence scoring for each insight

### 4. Meeting Summary Generation
- Executive summary (2-3 sentences)
- Detailed comprehensive summary
- Key discussion points
- Action items with assignments and priorities
- Decisions made during meeting
- Speaker metrics and contributions
- Topic analysis

## Installation

The AI analysis service is already integrated into the CogniNote backend. Ensure you have the required dependencies:

```bash
npm install @google/genai
```

## Configuration

### Environment Variables

Add your Gemini API key to `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_DEFAULT_MODEL=gemini-1.5-pro
```

### Initialize AI Service

The AI service must be initialized before using the analysis service:

```typescript
import { aiService } from './services/ai';

// Initialize on application startup
await aiService.initialize();
```

## Usage

### Basic Usage

```typescript
import { aiAnalysisService } from './services/ai';

// Analyze meeting content
const analysis = await aiAnalysisService.analyzeMeetingContent('meeting-id-123');

// Analyze sentiment only
const sentiment = await aiAnalysisService.analyzeSentiment('meeting-id-123');

// Extract insights
const insights = await aiAnalysisService.extractInsights('meeting-id-123', 10);

// Generate comprehensive summary
const summary = await aiAnalysisService.generateMeetingSummary('meeting-id-123');
```

### Advanced Usage with Options

```typescript
import { aiAnalysisService, AnalysisType } from './services/ai';

// Content analysis with custom instructions
const analysis = await aiAnalysisService.analyzeMeetingContent('meeting-id-123', {
  customInstructions: 'Focus on technical decisions and architecture discussions',
});

// Generate summary with custom instructions
const summary = await aiAnalysisService.generateMeetingSummary('meeting-id-123', {
  customInstructions: 'Emphasize action items and deadlines',
});
```

## API Reference

### `analyzeMeetingContent(meetingId, options?)`

Performs comprehensive content analysis on a meeting.

**Parameters:**
- `meetingId` (string): The meeting ID to analyze
- `options` (AnalysisOptions, optional):
  - `customInstructions` (string): Additional instructions for the AI

**Returns:** `Promise<ContentAnalysisResult>`

**Example:**
```typescript
const result = await aiAnalysisService.analyzeMeetingContent('meeting-123');

console.log(result.sentiment.sentiment); // 'positive'
console.log(result.sentiment.confidence.value); // 0.85
console.log(result.insights.length); // 5
console.log(result.topics.length); // 3
```

**Result Structure:**
```typescript
{
  meetingId: string;
  analysisType: AnalysisType.CONTENT_ANALYSIS;
  sentiment: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    confidence: { value: number; level: 'low' | 'medium' | 'high' };
    reasoning: string;
    emotionalTone: { positive: number; neutral: number; negative: number };
  };
  insights: Array<{
    category: string;
    insight: string;
    confidence: ConfidenceScore;
    relatedSpeakers: string[];
  }>;
  topics: Array<{
    name: string;
    keywords: string[];
    frequency: number;
    relevance: number;
    confidence: ConfidenceScore;
  }>;
  confidence: ConfidenceScore;
  metadata: {
    analyzedAt: Date;
    transcriptionSegments: number;
    totalDuration: number;
    modelUsed: string;
  };
}
```

---

### `analyzeSentiment(meetingId)`

Analyzes the overall sentiment of a meeting.

**Parameters:**
- `meetingId` (string): The meeting ID to analyze

**Returns:** `Promise<SentimentAnalysis>`

**Example:**
```typescript
const sentiment = await aiAnalysisService.analyzeSentiment('meeting-123');

console.log(sentiment.sentiment); // 'positive'
console.log(sentiment.confidence.value); // 0.9
console.log(sentiment.reasoning); // 'Collaborative and constructive discussion'
console.log(sentiment.emotionalTone.positive); // 0.75
```

**Result Structure:**
```typescript
{
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  confidence: {
    value: number; // 0.0 to 1.0
    level: 'low' | 'medium' | 'high';
  };
  reasoning: string;
  emotionalTone: {
    positive: number; // 0-1
    neutral: number; // 0-1
    negative: number; // 0-1
  };
}
```

---

### `extractInsights(meetingId, maxInsights?)`

Extracts key insights from a meeting.

**Parameters:**
- `meetingId` (string): The meeting ID to analyze
- `maxInsights` (number, optional): Maximum number of insights to extract (default: 10)

**Returns:** `Promise<MeetingInsight[]>`

**Example:**
```typescript
const insights = await aiAnalysisService.extractInsights('meeting-123', 5);

insights.forEach(insight => {
  console.log(`[${insight.category}] ${insight.insight}`);
  console.log(`Confidence: ${insight.confidence.value}`);
  console.log(`Speakers: ${insight.relatedSpeakers.join(', ')}`);
});
```

**Result Structure:**
```typescript
Array<{
  category: string; // 'decision', 'agreement', 'concern', 'action', 'discussion'
  insight: string;
  confidence: {
    value: number;
    level: 'low' | 'medium' | 'high';
  };
  relatedSpeakers: string[];
}>
```

---

### `generateMeetingSummary(meetingId, options?)`

Generates a comprehensive meeting summary with speaker metrics.

**Parameters:**
- `meetingId` (string): The meeting ID to summarize
- `options` (AnalysisOptions, optional):
  - `customInstructions` (string): Additional instructions for the AI

**Returns:** `Promise<MeetingSummary>`

**Example:**
```typescript
const summary = await aiAnalysisService.generateMeetingSummary('meeting-123');

console.log(summary.title); // 'Feature Planning Discussion'
console.log(summary.executiveSummary);
console.log(summary.keyPoints);
console.log(summary.actionItems);
console.log(summary.speakerMetrics);
```

**Result Structure:**
```typescript
{
  meetingId: string;
  title: string;
  executiveSummary: string; // 2-3 sentences
  detailedSummary: string; // Comprehensive paragraph
  keyPoints: string[];
  actionItems: Array<{
    description: string;
    assignedTo: string[];
    priority: 'low' | 'medium' | 'high';
    confidence: ConfidenceScore;
    context: string;
  }>;
  decisions: string[];
  speakerMetrics: Array<{
    speakerName: string;
    totalWords: number;
    speakingTime: number; // in seconds
    speakingPercentage: number; // 0-100
    averageConfidence: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    keyContributions: string[];
  }>;
  sentiment: SentimentAnalysis;
  topics: MeetingTopic[];
  confidence: ConfidenceScore;
  metadata: {
    generatedAt: Date;
    duration: number;
    participantCount: number;
    modelUsed: string;
  };
}
```

## Type Definitions

### ConfidenceScore

```typescript
interface ConfidenceScore {
  value: number; // 0.0 to 1.0
  level: 'low' | 'medium' | 'high';
}
```

Confidence levels are categorized as:
- **Low**: 0.0 - 0.49
- **Medium**: 0.5 - 0.79
- **High**: 0.8 - 1.0

### AnalysisType

```typescript
enum AnalysisType {
  MEETING_SUMMARY = 'meeting_summary',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  CONTENT_ANALYSIS = 'content_analysis',
  SPEAKER_METRICS = 'speaker_metrics',
  ACTION_ITEMS = 'action_items',
}
```

### SentimentType

```typescript
enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  MIXED = 'mixed',
}
```

## Integration Example

### Complete Workflow

```typescript
import { aiService, aiAnalysisService } from './services/ai';
import { transcriptionService } from './services/transcription.service';

async function processMeeting(meetingId: string) {
  // 1. Initialize AI service (once at application startup)
  await aiService.initialize();

  // 2. Ensure transcription is finalized
  const session = await transcriptionService.getSession(sessionId);
  if (session.status !== 'completed') {
    await transcriptionService.finalizeSession(sessionId);
  }

  // 3. Run comprehensive analysis
  const [contentAnalysis, sentiment, summary] = await Promise.all([
    aiAnalysisService.analyzeMeetingContent(meetingId),
    aiAnalysisService.analyzeSentiment(meetingId),
    aiAnalysisService.generateMeetingSummary(meetingId),
  ]);

  // 4. Use results
  return {
    analysis: contentAnalysis,
    sentiment,
    summary,
  };
}
```

### Express Route Example

```typescript
import { Router } from 'express';
import { aiAnalysisService } from '../services/ai';

const router = Router();

router.post('/meetings/:meetingId/analyze', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const analysis = await aiAnalysisService.analyzeMeetingContent(meetingId, {
      customInstructions: req.body.instructions,
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/meetings/:meetingId/summary', async (req, res) => {
  try {
    const { meetingId } = req.params;

    const summary = await aiAnalysisService.generateMeetingSummary(meetingId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

## Performance Considerations

### Token Usage

The AI analysis service uses Gemini AI which has token limits. Approximate token usage:

- **Sentiment Analysis**: ~500-1000 tokens
- **Content Analysis**: ~2000-4000 tokens
- **Meeting Summary**: ~3000-5000 tokens

For long meetings (>1 hour), consider:
1. Chunking the transcription
2. Increasing `maxTokens` in options
3. Using batch processing for insights

### Caching

Analysis results are automatically stored in the database to avoid redundant processing. Retrieve cached results using:

```typescript
import { analysisResultRepository } from './repositories/analysis-result.repository';

// Get cached analysis
const cached = await analysisResultRepository.findByMeetingAndType(
  meetingId,
  AnalysisType.MEETING_SUMMARY
);

if (cached) {
  return cached;
}

// Generate new analysis if not cached
const summary = await aiAnalysisService.generateMeetingSummary(meetingId);
```

### Rate Limiting

Gemini API has rate limits. Implement queuing for batch processing:

```typescript
import { Queue } from 'bull';

const analysisQueue = new Queue('meeting-analysis');

analysisQueue.process(async (job) => {
  const { meetingId } = job.data;
  return await aiAnalysisService.generateMeetingSummary(meetingId);
});

// Add to queue
analysisQueue.add({ meetingId: 'meeting-123' });
```

## Error Handling

```typescript
import { AppError } from './middlewares/error-handler';

try {
  const summary = await aiAnalysisService.generateMeetingSummary(meetingId);
} catch (error) {
  if (error instanceof AppError) {
    if (error.statusCode === 404) {
      console.error('No transcriptions found');
    } else if (error.statusCode === 500) {
      console.error('AI processing error:', error.message);
    }
  }
  throw error;
}
```

## Testing

Run tests for the AI analysis service:

```bash
npm test -- ai-analysis.service.test.ts
```

### Test Coverage

The test suite covers:
- Content analysis with various scenarios
- Sentiment analysis accuracy
- Insight extraction and categorization
- Meeting summary generation
- Speaker metrics calculation
- Error handling and edge cases
- JSON parsing from AI responses
- Confidence score normalization

## Limitations

1. **Requires Transcriptions**: Analysis can only be performed after transcriptions are available
2. **Language Support**: Currently optimized for English conversations
3. **API Costs**: Gemini API usage incurs costs based on token consumption
4. **Processing Time**: Complex analysis may take 5-15 seconds depending on meeting length

## Future Enhancements

- Multi-language support
- Real-time analysis during meetings
- Custom analysis templates
- Comparative analysis across meetings
- AI-powered follow-up recommendations
- Integration with calendar systems for automated scheduling

## Support

For issues or questions:
- Check the [API documentation](./API.md)
- Review [test examples](../tests/ai-analysis.service.test.ts)
- Open an issue on GitHub

## License

MIT
