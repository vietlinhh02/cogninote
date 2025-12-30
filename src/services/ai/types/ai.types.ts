/**
 * AI Service Types
 * Type definitions for AI service integration layer
 */

/**
 * Supported AI providers
 */
export enum AIProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  apiKey?: string;
  endpoint?: string;
}

/**
 * AI request options
 */
export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * AI message role
 */
export enum AIMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

/**
 * AI message
 */
export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

/**
 * AI chat request
 */
export interface AIChatRequest {
  messages: AIMessage[];
  options?: AIRequestOptions;
}

/**
 * AI completion request
 */
export interface AICompletionRequest {
  prompt: string;
  options?: AIRequestOptions;
}

/**
 * AI usage statistics
 */
export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * AI response
 */
export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: AIUsage;
  finishReason?: string;
  metadata?: Record<string, any>;
}

/**
 * AI streaming chunk
 */
export interface AIStreamChunk {
  content: string;
  provider: AIProvider;
  isComplete: boolean;
  usage?: AIUsage;
}

/**
 * AI error types
 */
export enum AIErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  INVALID_REQUEST = 'invalid_request',
  PROVIDER_ERROR = 'provider_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * AI error
 */
export class AIError extends Error {
  constructor(
    message: string,
    public type: AIErrorType,
    public provider: AIProvider,
    public originalError?: Error,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AIError';
    Object.setPrototypeOf(this, AIError.prototype);
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  retryableErrors: AIErrorType[];
}

/**
 * Fallback configuration
 */
export interface FallbackConfig {
  enabled: boolean;
  primaryProvider: AIProvider;
  fallbackProvider: AIProvider;
  fallbackOnErrors: AIErrorType[];
}

/**
 * Gemini provider configuration
 */
export interface GeminiProviderConfig {
  apiKey: string;
  defaultModel?: string;
}

/**
 * OpenAI provider configuration
 */
export interface OpenAIProviderConfig {
  apiKey?: string;
  defaultModel?: string;
  endpoint?: string;
}

/**
 * Provider configuration map
 * Maps each AIProvider enum to its specific configuration type
 */
export type ProviderConfigMap = {
  [AIProvider.GEMINI]: GeminiProviderConfig;
  [AIProvider.OPENAI]: OpenAIProviderConfig;
};

/**
 * Type-safe provider update helper
 * Ensures updates match the provider's configuration type
 */
export type ProviderConfigUpdate<P extends AIProvider> = Partial<ProviderConfigMap[P]>;

/**
 * AI service configuration
 */
export interface AIServiceConfig {
  defaultProvider: AIProvider;
  providers: ProviderConfigMap;
  retry: RetryConfig;
  fallback: FallbackConfig;
  timeout: number;
  enableHotReload: boolean;
}

/**
 * AI provider interface
 */
export interface IAIProvider {
  readonly provider: AIProvider;

  /**
   * Initialize the provider
   */
  initialize(config: AIModelConfig): Promise<void>;

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Generate completion from prompt
   */
  complete(request: AICompletionRequest): Promise<AIResponse>;

  /**
   * Generate chat completion from messages
   */
  chat(request: AIChatRequest): Promise<AIResponse>;

  /**
   * Stream chat completion
   */
  streamChat(
    request: AIChatRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<AIModelConfig>): void;
}
