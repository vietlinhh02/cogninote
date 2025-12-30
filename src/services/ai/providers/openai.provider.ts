import OpenAI from 'openai';
import { BaseAIProvider } from './base.provider.js';
import {
  AIProvider,
  AICompletionRequest,
  AIChatRequest,
  AIResponse,
  AIStreamChunk,
  AIMessageRole,
  AIError,
  AIErrorType,
} from '../types/ai.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * OpenAI Provider
 * Implementation for OpenAI API with configurable endpoint
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly provider = AIProvider.OPENAI;
  protected readonly defaultModel = 'gpt-4o-mini';

  private client: OpenAI | null = null;

  /**
   * Initialize OpenAI provider
   */
  async initialize(config: typeof this.config): Promise<void> {
    await super.initialize(config);

    try {
      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.endpoint || 'https://api.openai.com/v1',
      });

      logger.info('OpenAI provider initialized successfully', {
        model: this.getModel(),
        endpoint: this.config.endpoint || 'https://api.openai.com/v1',
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if provider is configured
   */
  isConfigured(): boolean {
    return this.isInitialized && !!this.config.apiKey;
  }

  /**
   * Generate completion from prompt
   */
  async complete(request: AICompletionRequest): Promise<AIResponse> {
    this.ensureInitialized();
    this.logRequest('completion', request.options);

    try {
      const response = await this.client!.completions.create({
        model: this.getModel(request.options),
        prompt: request.prompt,
        temperature: this.getTemperature(request.options),
        max_tokens: this.getMaxTokens(request.options),
        top_p: request.options?.topP,
      });

      const choice = response.choices[0];
      const aiResponse: AIResponse = {
        content: choice.text,
        provider: this.provider,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason || undefined,
      };

      this.logResponse('completion', aiResponse);
      return aiResponse;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate chat completion from messages
   */
  async chat(request: AIChatRequest): Promise<AIResponse> {
    this.ensureInitialized();
    this.logRequest('chat', request.options);

    try {
      const messages = request.messages.map((msg) => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      }));

      const response = await this.client!.chat.completions.create({
        model: this.getModel(request.options),
        messages: messages as any,
        temperature: this.getTemperature(request.options),
        max_tokens: this.getMaxTokens(request.options),
        top_p: request.options?.topP,
      });

      const choice = response.choices[0];
      const aiResponse: AIResponse = {
        content: choice.message.content || '',
        provider: this.provider,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason || undefined,
      };

      this.logResponse('chat', aiResponse);
      return aiResponse;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Stream chat completion
   */
  async streamChat(
    request: AIChatRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    this.ensureInitialized();
    this.logRequest('stream chat', request.options);

    try {
      const messages = request.messages.map((msg) => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      }));

      const stream = await this.client!.chat.completions.create({
        model: this.getModel(request.options),
        messages: messages as any,
        temperature: this.getTemperature(request.options),
        max_tokens: this.getMaxTokens(request.options),
        top_p: request.options?.topP,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        const content = delta?.content || '';

        if (content) {
          onChunk({
            content,
            provider: this.provider,
            isComplete: false,
          });
        }

        // Check if stream is complete
        if (chunk.choices[0]?.finish_reason) {
          onChunk({
            content: '',
            provider: this.provider,
            isComplete: true,
            usage: chunk.usage
              ? {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                }
              : undefined,
          });
        }
      }

      logger.debug('OpenAI stream chat completed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Map AI message role to OpenAI role
   */
  private mapRole(role: AIMessageRole): 'system' | 'user' | 'assistant' {
    switch (role) {
      case AIMessageRole.SYSTEM:
        return 'system';
      case AIMessageRole.USER:
        return 'user';
      case AIMessageRole.ASSISTANT:
        return 'assistant';
      default:
        return 'user';
    }
  }

  /**
   * Override error handler for OpenAI-specific errors
   */
  protected handleError(error: any): AIError {
    // OpenAI SDK errors have specific structure
    if (error instanceof OpenAI.APIError) {
      logger.error('OpenAI API error:', {
        status: error.status,
        message: error.message,
        type: error.type,
      });

      // Map OpenAI error types
      if (error.status === 401) {
        return new AIError(
          'Invalid OpenAI API key',
          AIErrorType.AUTHENTICATION,
          this.provider,
          error,
          401
        );
      }

      if (error.status === 429) {
        return new AIError(
          'OpenAI rate limit exceeded',
          AIErrorType.RATE_LIMIT,
          this.provider,
          error,
          429
        );
      }

      if (error.status === 400) {
        return new AIError(
          `Invalid OpenAI request: ${error.message}`,
          AIErrorType.INVALID_REQUEST,
          this.provider,
          error,
          400
        );
      }

      return new AIError(
        `OpenAI API error: ${error.message}`,
        AIErrorType.PROVIDER_ERROR,
        this.provider,
        error,
        error.status
      );
    }

    return super.handleError(error);
  }

  /**
   * Validate OpenAI configuration
   */
  protected async validateConfig(): Promise<void> {
    if (!this.config.apiKey) {
      logger.warn('OpenAI API key not configured, provider will be disabled');
      return;
    }

    if (this.config.endpoint) {
      logger.info('Using custom OpenAI endpoint', {
        endpoint: this.config.endpoint,
      });
    }
  }
}
