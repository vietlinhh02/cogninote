/**
 * AI Service Module
 * Export all AI service components
 */

// Main service
export { AIService, aiService } from './ai.service.js';

// Analysis service
export { AIAnalysisService, aiAnalysisService } from './ai-analysis.service.js';

// Configuration
export { AIConfigService, aiConfigService } from './config/ai-config.service.js';

// Providers
export { BaseAIProvider } from './providers/base.provider.js';
export { GeminiAIProvider } from './providers/gemini.provider.js';
export { OpenAIProvider } from './providers/openai.provider.js';

// Types
export {
  AIProvider,
  AIModelConfig,
  AIRequestOptions,
  AIMessageRole,
  AIMessage,
  AIChatRequest,
  AICompletionRequest,
  AIUsage,
  AIResponse,
  AIStreamChunk,
  AIErrorType,
  AIError,
  RetryConfig,
  FallbackConfig,
  AIServiceConfig,
  IAIProvider,
  GeminiProviderConfig,
  OpenAIProviderConfig,
  ProviderConfigMap,
  ProviderConfigUpdate,
} from './types/ai.types.js';

// Analysis types
export {
  AnalysisType,
  SentimentType,
  ConfidenceScore,
  SentimentAnalysis,
  MeetingInsight,
  ActionItem,
  MeetingTopic,
  SpeakerMetrics,
  ContentAnalysisResult,
  MeetingSummary,
  AnalysisOptions,
  AnalysisSchema,
  AnalysisStatus,
  AnalysisJob,
} from './types/analysis.types.js';
