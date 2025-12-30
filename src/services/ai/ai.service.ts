import {
  AIProvider,
  IAIProvider,
  AICompletionRequest,
  AIChatRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
  RetryConfig,
} from './types/ai.types.js';
import { GeminiAIProvider } from './providers/gemini.provider.js';
import { OpenAIProvider } from './providers/openai.provider.js';
import { aiConfigService, AIConfigService } from './config/ai-config.service.js';
import { logger } from '../../utils/logger.js';

/**
 * AI Service
 * Main service for AI operations with provider switching, retry logic, and fallback
 */
export class AIService {
  private providers: Map<AIProvider, IAIProvider> = new Map();
  private currentProvider: AIProvider;
  private configService: AIConfigService;
  private isInitialized: boolean = false;

  constructor(configService: AIConfigService = aiConfigService) {
    this.configService = configService;
    this.currentProvider = this.configService.getDefaultProvider();
  }

  /**
   * Initialize AI service and providers
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('AI service already initialized');
      return;
    }

    const config = this.configService.getConfig();
    const validation = this.configService.validateConfig();

    if (!validation.valid) {
      logger.error('AI configuration validation failed:', validation.errors);
      throw new Error(`AI configuration invalid: ${validation.errors.join(', ')}`);
    }

    // Initialize Gemini provider
    if (config.providers[AIProvider.GEMINI].apiKey) {
      const geminiProvider = new GeminiAIProvider({
        provider: AIProvider.GEMINI,
        apiKey: config.providers[AIProvider.GEMINI].apiKey,
        model: config.providers[AIProvider.GEMINI].defaultModel,
      });
      await geminiProvider.initialize({
        provider: AIProvider.GEMINI,
        apiKey: config.providers[AIProvider.GEMINI].apiKey,
        model: config.providers[AIProvider.GEMINI].defaultModel,
      });
      this.providers.set(AIProvider.GEMINI, geminiProvider);
      logger.info('Gemini provider registered');
    }

    // Initialize OpenAI provider
    if (config.providers[AIProvider.OPENAI]?.apiKey) {
      const openaiProvider = new OpenAIProvider({
        provider: AIProvider.OPENAI,
        apiKey: config.providers[AIProvider.OPENAI].apiKey!,
        model: config.providers[AIProvider.OPENAI].defaultModel,
        endpoint: config.providers[AIProvider.OPENAI].endpoint,
      });
      await openaiProvider.initialize({
        provider: AIProvider.OPENAI,
        apiKey: config.providers[AIProvider.OPENAI].apiKey!,
        model: config.providers[AIProvider.OPENAI].defaultModel,
        endpoint: config.providers[AIProvider.OPENAI].endpoint,
      });
      this.providers.set(AIProvider.OPENAI, openaiProvider);
      logger.info('OpenAI provider registered');
    }

    // Set up config reload listeners
    if (config.enableHotReload) {
      this.configService.enableHotReload();
      this.configService.on('config:provider:updated', this.handleProviderConfigUpdate.bind(this));
    }

    this.isInitialized = true;
    logger.info('AI service initialized', {
      defaultProvider: this.currentProvider,
      availableProviders: Array.from(this.providers.keys()),
    });
  }

  /**
   * Generate completion with retry and fallback
   */
  async complete(request: AICompletionRequest, provider?: AIProvider): Promise<AIResponse> {
    this.ensureInitialized();

    const targetProvider = provider || this.currentProvider;
    const retryConfig = this.configService.getRetryConfig();

    try {
      return await this.executeWithRetry(
        () => this.getProvider(targetProvider).complete(request),
        retryConfig,
        targetProvider
      );
    } catch (error) {
      return await this.handleErrorWithFallback(
        error as AIError,
        () => this.complete(request, this.getFallbackProvider(targetProvider)),
        targetProvider
      );
    }
  }

  /**
   * Generate chat completion with retry and fallback
   */
  async chat(request: AIChatRequest, provider?: AIProvider): Promise<AIResponse> {
    this.ensureInitialized();

    const targetProvider = provider || this.currentProvider;
    const retryConfig = this.configService.getRetryConfig();

    try {
      return await this.executeWithRetry(
        () => this.getProvider(targetProvider).chat(request),
        retryConfig,
        targetProvider
      );
    } catch (error) {
      return await this.handleErrorWithFallback(
        error as AIError,
        () => this.chat(request, this.getFallbackProvider(targetProvider)),
        targetProvider
      );
    }
  }

  /**
   * Stream chat completion with retry
   */
  async streamChat(
    request: AIChatRequest,
    onChunk: (chunk: AIStreamChunk) => void,
    provider?: AIProvider
  ): Promise<void> {
    this.ensureInitialized();

    const targetProvider = provider || this.currentProvider;
    const retryConfig = this.configService.getRetryConfig();

    try {
      await this.executeWithRetry(
        () => this.getProvider(targetProvider).streamChat(request, onChunk),
        retryConfig,
        targetProvider
      );
    } catch (error) {
      await this.handleErrorWithFallback(
        error as AIError,
        () => this.streamChat(request, onChunk, this.getFallbackProvider(targetProvider)),
        targetProvider
      );
    }
  }

  /**
   * Switch active provider
   */
  switchProvider(provider: AIProvider): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not available`);
    }

    this.currentProvider = provider;
    logger.info('Switched AI provider', { provider });
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.providers.has(provider) && this.providers.get(provider)!.isConfigured();
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig: RetryConfig,
    provider: AIProvider
  ): Promise<T> {
    let lastError: AIError | null = null;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as AIError;

        // Check if error is retryable
        if (!retryConfig.retryableErrors.includes(lastError.type)) {
          throw lastError;
        }

        // Check if we have retries left
        if (attempt === retryConfig.maxRetries) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.exponentialBase, attempt),
          retryConfig.maxDelay
        );

        logger.warn(`Retrying ${provider} operation after error`, {
          provider,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries,
          errorType: lastError.type,
          delay,
        });

        // Wait before retrying
        await this.sleep(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Handle error with fallback to alternative provider
   */
  private async handleErrorWithFallback<T>(
    error: AIError,
    fallbackOperation: () => Promise<T>,
    primaryProvider: AIProvider
  ): Promise<T> {
    const fallbackConfig = this.configService.getFallbackConfig();

    // Check if fallback is enabled and error is fallback-eligible
    if (!fallbackConfig.enabled || !fallbackConfig.fallbackOnErrors.includes(error.type)) {
      throw error;
    }

    const fallbackProvider = this.getFallbackProvider(primaryProvider);

    // Check if fallback provider is available
    if (!this.isProviderAvailable(fallbackProvider)) {
      logger.error('Fallback provider not available', {
        primaryProvider,
        fallbackProvider,
        error: error.message,
      });
      throw error;
    }

    logger.warn('Falling back to alternative provider', {
      primaryProvider,
      fallbackProvider,
      errorType: error.type,
    });

    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      logger.error('Fallback operation also failed', {
        primaryProvider,
        fallbackProvider,
        primaryError: error.message,
        fallbackError: (fallbackError as Error).message,
      });
      throw fallbackError;
    }
  }

  /**
   * Get fallback provider
   */
  private getFallbackProvider(currentProvider: AIProvider): AIProvider {
    const fallbackConfig = this.configService.getFallbackConfig();

    if (currentProvider === fallbackConfig.primaryProvider) {
      return fallbackConfig.fallbackProvider;
    } else {
      return fallbackConfig.primaryProvider;
    }
  }

  /**
   * Get provider instance
   */
  private getProvider(provider: AIProvider): IAIProvider {
    const providerInstance = this.providers.get(provider);

    if (!providerInstance) {
      throw new Error(`Provider ${provider} not initialized`);
    }

    if (!providerInstance.isConfigured()) {
      throw new Error(`Provider ${provider} not configured`);
    }

    return providerInstance;
  }

  /**
   * Handle provider configuration updates
   */
  private async handleProviderConfigUpdate(provider: AIProvider, config: any): Promise<void> {
    const providerInstance = this.providers.get(provider);

    if (providerInstance) {
      logger.info('Updating provider configuration', { provider });
      providerInstance.updateConfig(config);
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('AI service not initialized. Call initialize() first.');
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.configService.destroy();
    this.providers.clear();
    this.isInitialized = false;
    logger.info('AI service destroyed');
  }
}

// Export singleton instance
export const aiService = new AIService();
