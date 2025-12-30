import {
  AIProvider,
  IAIProvider,
  AIModelConfig,
  AICompletionRequest,
  AIChatRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
  AIErrorType,
  AIRequestOptions,
} from '../types/ai.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Base AI Provider
 * Abstract base class for all AI providers with common functionality
 */
export abstract class BaseAIProvider implements IAIProvider {
  protected config: AIModelConfig;
  protected isInitialized: boolean = false;

  abstract readonly provider: AIProvider;
  protected abstract readonly defaultModel: string;

  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: AIModelConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    await this.validateConfig();
    this.isInitialized = true;
    logger.info(`${this.provider} provider initialized`, {
      provider: this.provider,
      model: this.config.model || this.defaultModel,
    });
  }

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean {
    return this.isInitialized && !!this.config.apiKey;
  }

  /**
   * Update provider configuration
   */
  updateConfig(config: Partial<AIModelConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info(`${this.provider} provider configuration updated`, {
      provider: this.provider,
    });
  }

  /**
   * Generate completion from prompt
   */
  abstract complete(request: AICompletionRequest): Promise<AIResponse>;

  /**
   * Generate chat completion from messages
   */
  abstract chat(request: AIChatRequest): Promise<AIResponse>;

  /**
   * Stream chat completion
   */
  abstract streamChat(
    request: AIChatRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void>;

  /**
   * Validate provider configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      throw new AIError(
        `API key not configured for ${this.provider}`,
        AIErrorType.AUTHENTICATION,
        this.provider
      );
    }
  }

  /**
   * Ensure provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new AIError(
        `${this.provider} provider not initialized`,
        AIErrorType.PROVIDER_ERROR,
        this.provider
      );
    }
  }

  /**
   * Get model name from request options or config
   */
  protected getModel(options?: AIRequestOptions): string {
    return options?.model || this.config.model || this.defaultModel;
  }

  /**
   * Get temperature from request options or config
   */
  protected getTemperature(options?: AIRequestOptions): number {
    return options?.temperature ?? this.config.temperature ?? 0.7;
  }

  /**
   * Get max tokens from request options or config
   */
  protected getMaxTokens(options?: AIRequestOptions): number | undefined {
    return options?.maxTokens ?? this.config.maxTokens;
  }

  /**
   * Handle provider-specific errors
   */
  protected handleError(error: any): AIError {
    logger.error(`${this.provider} provider error:`, {
      provider: this.provider,
      error: error.message || error,
      stack: error.stack,
    });

    // Authentication errors
    if (
      error.status === 401 ||
      error.statusCode === 401 ||
      error.message?.includes('authentication') ||
      error.message?.includes('unauthorized') ||
      error.message?.includes('invalid api key')
    ) {
      return new AIError(
        `Authentication failed for ${this.provider}`,
        AIErrorType.AUTHENTICATION,
        this.provider,
        error,
        401
      );
    }

    // Rate limit errors
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes('rate limit') ||
      error.message?.includes('quota exceeded')
    ) {
      return new AIError(
        `Rate limit exceeded for ${this.provider}`,
        AIErrorType.RATE_LIMIT,
        this.provider,
        error,
        429
      );
    }

    // Invalid request errors
    if (
      error.status === 400 ||
      error.statusCode === 400 ||
      error.message?.includes('invalid request') ||
      error.message?.includes('bad request')
    ) {
      return new AIError(
        `Invalid request to ${this.provider}: ${error.message}`,
        AIErrorType.INVALID_REQUEST,
        this.provider,
        error,
        400
      );
    }

    // Timeout errors
    if (
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout')
    ) {
      return new AIError(
        `Request to ${this.provider} timed out`,
        AIErrorType.TIMEOUT,
        this.provider,
        error
      );
    }

    // Network errors
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ENETUNREACH' ||
      error.message?.includes('network')
    ) {
      return new AIError(
        `Network error connecting to ${this.provider}`,
        AIErrorType.NETWORK_ERROR,
        this.provider,
        error
      );
    }

    // Generic provider error
    return new AIError(
      `${this.provider} error: ${error.message || 'Unknown error'}`,
      AIErrorType.PROVIDER_ERROR,
      this.provider,
      error,
      error.status || error.statusCode
    );
  }

  /**
   * Log request start
   */
  protected logRequest(type: string, options?: AIRequestOptions): void {
    logger.debug(`${this.provider} ${type} request started`, {
      provider: this.provider,
      model: this.getModel(options),
      temperature: this.getTemperature(options),
    });
  }

  /**
   * Log request completion
   */
  protected logResponse(type: string, response: AIResponse): void {
    logger.debug(`${this.provider} ${type} request completed`, {
      provider: this.provider,
      model: response.model,
      usage: response.usage,
      finishReason: response.finishReason,
    });
  }
}
