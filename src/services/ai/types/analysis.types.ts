/**
 * AI Analysis Service Types
 * Type definitions for meeting content analysis, sentiment analysis, and summary generation
 */

/**
 * Analysis type enum
 */
export enum AnalysisType {
  MEETING_SUMMARY = 'meeting_summary',
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  CONTENT_ANALYSIS = 'content_analysis',
  SPEAKER_METRICS = 'speaker_metrics',
  ACTION_ITEMS = 'action_items',
}

/**
 * Sentiment classification
 */
export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
  MIXED = 'mixed',
}

/**
 * Confidence score for analysis results
 */
export interface ConfidenceScore {
  value: number; // 0.0 to 1.0
  level: 'low' | 'medium' | 'high';
}

/**
 * Sentiment analysis result with confidence
 */
export interface SentimentAnalysis {
  sentiment: SentimentType;
  confidence: ConfidenceScore;
  reasoning: string;
  emotionalTone: {
    positive: number; // 0-1
    neutral: number; // 0-1
    negative: number; // 0-1
  };
}

/**
 * Key insight extracted from meeting
 */
export interface MeetingInsight {
  category: string;
  insight: string;
  confidence: ConfidenceScore;
  relatedSpeakers: string[];
  timestamp?: {
    start: Date;
    end: Date;
  };
}

/**
 * Action item extracted from meeting
 */
export interface ActionItem {
  description: string;
  assignedTo?: string[];
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  confidence: ConfidenceScore;
  context: string;
}

/**
 * Topic detected in meeting
 */
export interface MeetingTopic {
  name: string;
  keywords: string[];
  frequency: number;
  relevance: number; // 0-1
  confidence: ConfidenceScore;
}

/**
 * Speaker metrics and statistics
 */
export interface SpeakerMetrics {
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
}

/**
 * Meeting content analysis result
 */
export interface ContentAnalysisResult {
  meetingId: string;
  analysisType: AnalysisType;
  sentiment: SentimentAnalysis;
  insights: MeetingInsight[];
  topics: MeetingTopic[];
  confidence: ConfidenceScore;
  metadata: {
    analyzedAt: Date;
    transcriptionSegments: number;
    totalDuration: number;
    modelUsed: string;
  };
}

/**
 * Meeting summary with structured output
 */
export interface MeetingSummary {
  meetingId: string;
  title: string;
  executiveSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  speakerMetrics: SpeakerMetrics[];
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

/**
 * Analysis request options
 */
export interface AnalysisOptions {
  analysisTypes: AnalysisType[];
  includeTimestamps?: boolean;
  minConfidenceThreshold?: number; // 0.0 to 1.0
  maxInsights?: number;
  maxActionItems?: number;
  customInstructions?: string;
}

/**
 * Structured output schema for Gemini
 */
export interface AnalysisSchema {
  type: 'object';
  properties: Record<string, any>;
  required: string[];
}

/**
 * Analysis processing status
 */
export enum AnalysisStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Analysis job tracking
 */
export interface AnalysisJob {
  jobId: string;
  meetingId: string;
  status: AnalysisStatus;
  analysisTypes: AnalysisType[];
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: ContentAnalysisResult | MeetingSummary;
}
