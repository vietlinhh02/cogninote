import { GoogleGenAI } from '@google/genai';
import { BaseAIProvider } from './base.provider.js';
import {
  AIProvider,
  AICompletionRequest,
  AIChatRequest,
  AIResponse,
  AIStreamChunk,
  AIMessageRole,
  AIRequestOptions,
  AIError,
  AIErrorType,
} from '../types/ai.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * Gemini AI Provider
 * Implementation for Google's Gemini AI using @google/genai
 */
export class GeminiAIProvider extends BaseAIProvider {
  readonly provider = AIProvider.GEMINI;
  protected readonly defaultModel = 'gemini-1.5-pro';

  private client: GoogleGenAI | null = null;

  /**
   * Initialize Gemini provider
   */
  async initialize(config: typeof this.config): Promise<void> {
    await super.initialize(config);

    try {
      this.client = new GoogleGenAI({ apiKey: this.config.apiKey! });

      logger.info('Gemini AI provider initialized successfully', {
        model: this.getModel(),
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate completion from prompt
   */
  async complete(request: AICompletionRequest): Promise<AIResponse> {
    this.ensureInitialized();
    this.logRequest('completion', request.options);

    try {
      const modelName = this.getModel(request.options);
      const config = this.buildGenerationConfig(request.options);

      const result = await this.client!.models.generateContent({
        model: modelName,
        contents: request.prompt,
        config: config,
      });

      const aiResponse: AIResponse = {
        content: result.text || '',
        provider: this.provider,
        model: modelName,
        usage: this.extractUsage(result),
        finishReason: this.mapFinishReason(result),
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
      const modelName = this.getModel(request.options);
      const config = this.buildGenerationConfig(request.options);

      // Extract system instruction if present
      const systemInstruction = request.messages.find(
        (msg) => msg.role === AIMessageRole.SYSTEM
      )?.content;

      // Filter out system messages for Gemini
      const chatMessages = request.messages.filter(
        (msg) => msg.role !== AIMessageRole.SYSTEM
      );

      // Build messages in the format expected by @google/genai
      const contents = chatMessages.map((msg) => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      }));

      const params: any = {
        model: modelName,
        contents: contents,
        config: config,
      };

      if (systemInstruction) {
        params.systemInstruction = systemInstruction;
      }

      const result = await this.client!.models.generateContent(params);

      const aiResponse: AIResponse = {
        content: result.text || '',
        provider: this.provider,
        model: modelName,
        usage: this.extractUsage(result),
        finishReason: this.mapFinishReason(result),
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
      const modelName = this.getModel(request.options);
      const config = this.buildGenerationConfig(request.options);

      // Extract system instruction if present
      const systemInstruction = request.messages.find(
        (msg) => msg.role === AIMessageRole.SYSTEM
      )?.content;

      // Filter out system messages for Gemini
      const chatMessages = request.messages.filter(
        (msg) => msg.role !== AIMessageRole.SYSTEM
      );

      // Build messages
      const contents = chatMessages.map((msg) => ({
        role: this.mapRole(msg.role),
        content: msg.content,
      }));

      const params: any = {
        model: modelName,
        contents: contents,
        config: config,
      };

      if (systemInstruction) {
        params.systemInstruction = systemInstruction;
      }

      const stream = await this.client!.models.generateContentStream(params);

      let lastUsage: any = undefined;

      for await (const chunk of stream) {
        if (chunk.text) {
          onChunk({
            content: chunk.text,
            provider: this.provider,
            isComplete: false,
          });
        }

        // Track usage metadata if available
        if (chunk.usageMetadata) {
          lastUsage = chunk.usageMetadata;
        }
      }

      // Send final chunk with usage info
      onChunk({
        content: '',
        provider: this.provider,
        isComplete: true,
        usage: lastUsage
          ? {
              promptTokens: lastUsage.promptTokenCount || 0,
              completionTokens: lastUsage.candidatesTokenCount || 0,
              totalTokens: lastUsage.totalTokenCount || 0,
            }
          : undefined,
      });

      logger.debug('Gemini stream chat completed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build generation configuration
   */
  private buildGenerationConfig(options?: AIRequestOptions) {
    const config: any = {
      temperature: this.getTemperature(options),
    };

    const maxTokens = this.getMaxTokens(options);
    if (maxTokens) {
      config.maxOutputTokens = maxTokens;
    }

    if (options?.topP !== undefined || this.config.topP !== undefined) {
      config.topP = options?.topP ?? this.config.topP;
    }

    if (options?.topK !== undefined || this.config.topK !== undefined) {
      config.topK = options?.topK ?? this.config.topK;
    }

    return config;
  }

  /**
   * Map AI message role to Gemini role
   */
  private mapRole(role: AIMessageRole): string {
    switch (role) {
      case AIMessageRole.USER:
        return 'user';
      case AIMessageRole.ASSISTANT:
        return 'model';
      default:
        return 'user';
    }
  }

  /**
   * Extract usage information from Gemini response
   */
  private extractUsage(result: any) {
    if (!result.usageMetadata) {
      return undefined;
    }

    return {
      promptTokens: result.usageMetadata.promptTokenCount || 0,
      completionTokens: result.usageMetadata.candidatesTokenCount || 0,
      totalTokens: result.usageMetadata.totalTokenCount || 0,
    };
  }

  /**
   * Map Gemini finish reason to standard format
   */
  private mapFinishReason(result: any): string | undefined {
    if (!result.finishReason) {
      return undefined;
    }

    // Gemini finish reasons: STOP, MAX_TOKENS, SAFETY, RECITATION, OTHER
    return result.finishReason.toLowerCase();
  }

  /**
   * Override error handler for Gemini-specific errors
   */
  protected handleError(error: any): AIError {
    // Handle Gemini-specific error patterns
    if (
      error.message?.includes('API_KEY_INVALID') ||
      error.message?.includes('API key not valid')
    ) {
      return new AIError(
        'Invalid Gemini API key',
        AIErrorType.AUTHENTICATION,
        this.provider,
        error,
        401
      );
    }

    if (error.message?.includes('SAFETY') || error.message?.includes('safety')) {
      return new AIError(
        'Content blocked by Gemini safety filters',
        AIErrorType.INVALID_REQUEST,
        this.provider,
        error,
        400
      );
    }

    if (error.status === 429 || error.message?.includes('quota')) {
      return new AIError(
        'Gemini rate limit exceeded or quota exceeded',
        AIErrorType.RATE_LIMIT,
        this.provider,
        error,
        429
      );
    }

    return super.handleError(error);
  }
}
