import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'fs';
import { config as appConfig } from '../../../config/index.js';
import {
  AIProvider,
  AIServiceConfig,
  AIErrorType,
  RetryConfig,
  FallbackConfig,
  ProviderConfigMap,
  ProviderConfigUpdate,
  GeminiProviderConfig,
  OpenAIProviderConfig,
} from '../types/ai.types.js';
import { logger } from '../../../utils/logger.js';

/**
 * AI Configuration Service
 * Manages AI service configuration with hot reload support
 * Type-safe provider configuration updates using generic constraints
 */
export class AIConfigService extends EventEmitter {
  private config: AIServiceConfig;
  private watcher: FSWatcher | null = null;
  private reloadDebounceTimer: NodeJS.Timeout | null = null;
  private readonly reloadDebounceMs = 1000;

  constructor() {
    super();
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from app config
   */
  private loadConfig(): AIServiceConfig {
    const defaultRetryConfig: RetryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      exponentialBase: 2,
      retryableErrors: [
        AIErrorType.RATE_LIMIT,
        AIErrorType.NETWORK_ERROR,
        AIErrorType.TIMEOUT,
        AIErrorType.PROVIDER_ERROR,
      ],
    };

    const defaultFallbackConfig: FallbackConfig = {
      enabled: true,
      primaryProvider: AIProvider.GEMINI,
      fallbackProvider: AIProvider.OPENAI,
      fallbackOnErrors: [
        AIErrorType.AUTHENTICATION,
        AIErrorType.RATE_LIMIT,
        AIErrorType.PROVIDER_ERROR,
      ],
    };

    const providers: ProviderConfigMap = {
      [AIProvider.GEMINI]: {
        apiKey: appConfig.gemini.apiKey,
        defaultModel: 'gemini-1.5-pro',
      },
      [AIProvider.OPENAI]: {
        apiKey: appConfig.openai.apiKey,
        defaultModel: 'gpt-4o-mini',
        endpoint: appConfig.openai.endpoint,
      },
    };

    return {
      defaultProvider: AIProvider.GEMINI,
      providers,
      retry: defaultRetryConfig,
      fallback: defaultFallbackConfig,
      timeout: 30000,
      enableHotReload: appConfig.env === 'development',
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<AIServiceConfig> {
    return { ...this.config };
  }

  /**
   * Get provider configuration (type-safe)
   * Returns the correct config type based on the provider
   */
  getProviderConfig<P extends AIProvider>(provider: P): Readonly<ProviderConfigMap[P]> {
    return { ...this.config.providers[provider] };
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): Readonly<RetryConfig> {
    return { ...this.config.retry };
  }

  /**
   * Get fallback configuration
   */
  getFallbackConfig(): Readonly<FallbackConfig> {
    return { ...this.config.fallback };
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): AIProvider {
    return this.config.defaultProvider;
  }

  /**
   * Get timeout configuration
   */
  getTimeout(): number {
    return this.config.timeout;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AIServiceConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      providers: {
        ...this.config.providers,
        ...updates.providers,
      },
      retry: {
        ...this.config.retry,
        ...updates.retry,
      },
      fallback: {
        ...this.config.fallback,
        ...updates.fallback,
      },
    };

    logger.info('AI configuration updated', {
      defaultProvider: this.config.defaultProvider,
    });

    this.emit('config:updated', this.config);
  }

  /**
   * Update provider configuration (type-safe generic method)
   * Ensures updates match the provider's configuration type
   *
   * @example
   * // Type-safe: only accepts GeminiProviderConfig fields
   * configService.updateProviderConfig(AIProvider.GEMINI, {
   *   apiKey: 'new-key',
   *   defaultModel: 'gemini-2.0'
   * });
   *
   * // Type-safe: only accepts OpenAIProviderConfig fields
   * configService.updateProviderConfig(AIProvider.OPENAI, {
   *   endpoint: 'https://custom.openai.com/v1'
   * });
   */
  updateProviderConfig<P extends AIProvider>(
    provider: P,
    updates: ProviderConfigUpdate<P>
  ): void {
    // Validate that the update is not empty
    if (Object.keys(updates).length === 0) {
      logger.warn(`Empty update for ${provider} provider`);
      return;
    }

    // Create new config with updates (immutable)
    const currentConfig = this.config.providers[provider];
    const newConfig = {
      ...currentConfig,
      ...updates,
    } as ProviderConfigMap[P];

    // Validate the new configuration
    this.validateProviderConfig(provider, newConfig);

    // Apply the update
    this.config.providers[provider] = newConfig;

    logger.info(`${provider} provider configuration updated`, {
      updatedFields: Object.keys(updates),
    });

    this.emit('config:provider:updated', provider, newConfig);
  }

  /**
   * Validate provider configuration
   * Runtime validation to ensure configuration is valid
   */
  private validateProviderConfig<P extends AIProvider>(
    provider: P,
    config: ProviderConfigMap[P]
  ): void {
    switch (provider) {
      case AIProvider.GEMINI:
        this.validateGeminiConfig(config as GeminiProviderConfig);
        break;
      case AIProvider.OPENAI:
        this.validateOpenAIConfig(config as OpenAIProviderConfig);
        break;
      default:
        // Exhaustive check
        const _exhaustive: never = provider;
        throw new Error(`Unknown provider: ${_exhaustive}`);
    }
  }

  /**
   * Validate Gemini provider configuration
   */
  private validateGeminiConfig(config: GeminiProviderConfig): void {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    if (config.apiKey.trim().length === 0) {
      throw new Error('Gemini API key cannot be empty');
    }
  }

  /**
   * Validate OpenAI provider configuration
   */
  private validateOpenAIConfig(config: OpenAIProviderConfig): void {
    // OpenAI API key is optional (can be disabled)
    if (config.apiKey !== undefined) {
      if (config.apiKey.trim().length === 0) {
        throw new Error('OpenAI API key cannot be empty string');
      }
    }

    // Validate endpoint if provided
    if (config.endpoint) {
      try {
        new URL(config.endpoint);
      } catch {
        throw new Error(`Invalid OpenAI endpoint URL: ${config.endpoint}`);
      }
    }
  }

  /**
   * Enable hot reload of configuration
   */
  enableHotReload(): void {
    if (this.watcher) {
      logger.warn('Hot reload already enabled');
      return;
    }

    const envPath = process.cwd() + '/.env';

    try {
      this.watcher = watch(envPath, (eventType) => {
        if (eventType === 'change') {
          this.scheduleReload();
        }
      });

      logger.info('AI configuration hot reload enabled', { path: envPath });
    } catch (error) {
      logger.error('Failed to enable hot reload:', error);
    }
  }

  /**
   * Disable hot reload
   */
  disableHotReload(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      logger.info('AI configuration hot reload disabled');
    }

    if (this.reloadDebounceTimer) {
      clearTimeout(this.reloadDebounceTimer);
      this.reloadDebounceTimer = null;
    }
  }

  /**
   * Schedule configuration reload with debounce
   */
  private scheduleReload(): void {
    if (this.reloadDebounceTimer) {
      clearTimeout(this.reloadDebounceTimer);
    }

    this.reloadDebounceTimer = setTimeout(() => {
      this.reloadConfig();
      this.reloadDebounceTimer = null;
    }, this.reloadDebounceMs);
  }

  /**
   * Reload configuration from environment
   */
  private reloadConfig(): void {
    try {
      logger.info('Reloading AI configuration...');

      // Clear require cache for dotenv
      delete require.cache[require.resolve('dotenv')];

      // Reload environment variables
      require('dotenv').config();

      // Reload app config
      const newAppConfig = {
        gemini: {
          apiKey: process.env.GEMINI_API_KEY || '',
        },
        openai: {
          apiKey: process.env.OPENAI_API_KEY,
          endpoint: process.env.OPENAI_ENDPOINT,
        },
      };

      // Update provider configurations using type-safe method
      this.updateProviderConfig(AIProvider.GEMINI, {
        apiKey: newAppConfig.gemini.apiKey,
      });

      this.updateProviderConfig(AIProvider.OPENAI, {
        apiKey: newAppConfig.openai.apiKey,
        endpoint: newAppConfig.openai.endpoint,
      });

      logger.info('AI configuration reloaded successfully');
      this.emit('config:reloaded', this.config);
    } catch (error) {
      logger.error('Failed to reload AI configuration:', error);
      this.emit('config:reload:error', error);
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if at least one provider is configured
    const geminiConfigured = !!this.config.providers[AIProvider.GEMINI].apiKey;
    const openaiConfigured = !!this.config.providers[AIProvider.OPENAI]?.apiKey;

    if (!geminiConfigured && !openaiConfigured) {
      errors.push('No AI provider configured. At least one provider API key is required.');
    }

    // Check if default provider is configured
    const defaultProvider = this.config.defaultProvider;
    if (defaultProvider === AIProvider.GEMINI && !geminiConfigured) {
      errors.push('Default provider (Gemini) is not configured');
    }
    if (defaultProvider === AIProvider.OPENAI && !openaiConfigured) {
      errors.push('Default provider (OpenAI) is not configured');
    }

    // Validate retry configuration
    if (this.config.retry.maxRetries < 0) {
      errors.push('Retry maxRetries must be >= 0');
    }
    if (this.config.retry.baseDelay < 0) {
      errors.push('Retry baseDelay must be >= 0');
    }
    if (this.config.retry.maxDelay < this.config.retry.baseDelay) {
      errors.push('Retry maxDelay must be >= baseDelay');
    }

    // Validate timeout
    if (this.config.timeout <= 0) {
      errors.push('Timeout must be > 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get provider availability status
   */
  getProviderStatus(): Record<AIProvider, boolean> {
    return {
      [AIProvider.GEMINI]: !!this.config.providers[AIProvider.GEMINI].apiKey,
      [AIProvider.OPENAI]: !!this.config.providers[AIProvider.OPENAI]?.apiKey,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disableHotReload();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const aiConfigService = new AIConfigService();
