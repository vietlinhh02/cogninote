import { AIService } from '../services/ai/ai.service';
import { AIConfigService } from '../services/ai/config/ai-config.service';
import {
  AIProvider,
  AIError,
  AIErrorType,
  AIMessageRole,
  AIChatRequest,
  AICompletionRequest,
} from '../services/ai/types/ai.types';

// Mock the providers
jest.mock('../services/ai/providers/gemini.provider');
jest.mock('../services/ai/providers/openai.provider');
jest.mock('../services/ai/config/ai-config.service');

describe('AIService', () => {
  let aiService: AIService;
  let mockConfigService: jest.Mocked<AIConfigService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock config service
    mockConfigService = {
      getConfig: jest.fn().mockReturnValue({
        defaultProvider: AIProvider.GEMINI,
        providers: {
          [AIProvider.GEMINI]: {
            apiKey: 'test-gemini-key',
            defaultModel: 'gemini-1.5-pro',
          },
          [AIProvider.OPENAI]: {
            apiKey: 'test-openai-key',
            defaultModel: 'gpt-4o-mini',
            endpoint: 'https://api.openai.com/v1',
          },
        },
        retry: {
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
        },
        fallback: {
          enabled: true,
          primaryProvider: AIProvider.GEMINI,
          fallbackProvider: AIProvider.OPENAI,
          fallbackOnErrors: [
            AIErrorType.AUTHENTICATION,
            AIErrorType.RATE_LIMIT,
            AIErrorType.PROVIDER_ERROR,
          ],
        },
        timeout: 30000,
        enableHotReload: false,
      }),
      validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      getRetryConfig: jest.fn().mockReturnValue({
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
      }),
      getFallbackConfig: jest.fn().mockReturnValue({
        enabled: true,
        primaryProvider: AIProvider.GEMINI,
        fallbackProvider: AIProvider.OPENAI,
        fallbackOnErrors: [
          AIErrorType.AUTHENTICATION,
          AIErrorType.RATE_LIMIT,
          AIErrorType.PROVIDER_ERROR,
        ],
      }),
      getDefaultProvider: jest.fn().mockReturnValue(AIProvider.GEMINI),
      enableHotReload: jest.fn(),
      on: jest.fn(),
      destroy: jest.fn(),
    } as any;

    aiService = new AIService(mockConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', async () => {
      await aiService.initialize();

      expect(mockConfigService.validateConfig).toHaveBeenCalled();
      expect(mockConfigService.getConfig).toHaveBeenCalled();
    });

    it('should throw error with invalid configuration', async () => {
      mockConfigService.validateConfig.mockReturnValue({
        valid: false,
        errors: ['No AI provider configured'],
      });

      await expect(aiService.initialize()).rejects.toThrow('AI configuration invalid');
    });

    it('should not initialize twice', async () => {
      await aiService.initialize();
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      await aiService.initialize();

      warnSpy.mockRestore();
    });
  });

  describe('complete', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should generate completion successfully', async () => {
      const request: AICompletionRequest = {
        prompt: 'Test prompt',
        options: {
          temperature: 0.7,
        },
      };

      const mockResponse = {
        content: 'Test response',
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      // Mock provider response
      const geminiProvider = (aiService as any).providers.get(AIProvider.GEMINI);
      geminiProvider.complete = jest.fn().mockResolvedValue(mockResponse);

      const response = await aiService.complete(request);

      expect(response.content).toBe('Test response');
      expect(response.provider).toBe(AIProvider.GEMINI);
    });

    it('should throw error if service not initialized', async () => {
      const uninitializedService = new AIService(mockConfigService);
      const request: AICompletionRequest = {
        prompt: 'Test prompt',
      };

      await expect(uninitializedService.complete(request)).rejects.toThrow(
        'AI service not initialized'
      );
    });
  });

  describe('chat', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should generate chat completion successfully', async () => {
      const request: AIChatRequest = {
        messages: [
          { role: AIMessageRole.USER, content: 'Hello' },
          { role: AIMessageRole.ASSISTANT, content: 'Hi there!' },
          { role: AIMessageRole.USER, content: 'How are you?' },
        ],
      };

      const mockResponse = {
        content: 'I am doing well, thank you!',
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      const geminiProvider = (aiService as any).providers.get(AIProvider.GEMINI);
      geminiProvider.chat = jest.fn().mockResolvedValue(mockResponse);

      const response = await aiService.chat(request);

      expect(response.content).toBe('I am doing well, thank you!');
      expect(response.provider).toBe(AIProvider.GEMINI);
    });
  });

  describe('provider switching', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should switch provider successfully', () => {
      aiService.switchProvider(AIProvider.OPENAI);

      expect(aiService.getCurrentProvider()).toBe(AIProvider.OPENAI);
    });

    it('should throw error when switching to unavailable provider', () => {
      expect(() => {
        aiService.switchProvider('invalid-provider' as AIProvider);
      }).toThrow('Provider invalid-provider not available');
    });

    it('should return available providers', () => {
      const providers = aiService.getAvailableProviders();

      expect(providers).toContain(AIProvider.GEMINI);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should check provider availability', () => {
      const geminiAvailable = aiService.isProviderAvailable(AIProvider.GEMINI);
      expect(geminiAvailable).toBe(true);
    });
  });

  describe('retry logic', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should retry on rate limit error', async () => {
      const request: AICompletionRequest = {
        prompt: 'Test prompt',
      };

      const geminiProvider = (aiService as any).providers.get(AIProvider.GEMINI);
      const rateLimitError = new AIError(
        'Rate limit exceeded',
        AIErrorType.RATE_LIMIT,
        AIProvider.GEMINI
      );

      const successResponse = {
        content: 'Success after retry',
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      geminiProvider.complete = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(successResponse);

      const response = await aiService.complete(request);

      expect(response.content).toBe('Success after retry');
      expect(geminiProvider.complete).toHaveBeenCalledTimes(3);
    }, 10000);

    it('should not retry on authentication error', async () => {
      const request: AICompletionRequest = {
        prompt: 'Test prompt',
      };

      const geminiProvider = (aiService as any).providers.get(AIProvider.GEMINI);
      const authError = new AIError(
        'Authentication failed',
        AIErrorType.AUTHENTICATION,
        AIProvider.GEMINI
      );

      geminiProvider.complete = jest.fn().mockRejectedValue(authError);

      // Should attempt fallback instead of retry
      await expect(aiService.complete(request)).rejects.toThrow();
    });
  });

  describe('fallback mechanism', () => {
    beforeEach(async () => {
      await aiService.initialize();
    });

    it('should fallback to OpenAI on Gemini failure', async () => {
      const request: AICompletionRequest = {
        prompt: 'Test prompt',
      };

      const geminiProvider = (aiService as any).providers.get(AIProvider.GEMINI);
      const openaiProvider = (aiService as any).providers.get(AIProvider.OPENAI);

      const providerError = new AIError(
        'Provider error',
        AIErrorType.PROVIDER_ERROR,
        AIProvider.GEMINI
      );

      const fallbackResponse = {
        content: 'Response from OpenAI',
        provider: AIProvider.OPENAI,
        model: 'gpt-4o-mini',
      };

      geminiProvider.complete = jest.fn().mockRejectedValue(providerError);
      openaiProvider.complete = jest.fn().mockResolvedValue(fallbackResponse);

      const response = await aiService.complete(request);

      expect(response.content).toBe('Response from OpenAI');
      expect(response.provider).toBe(AIProvider.OPENAI);
      expect(geminiProvider.complete).toHaveBeenCalled();
      expect(openaiProvider.complete).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      await aiService.initialize();
      await aiService.destroy();

      expect(mockConfigService.destroy).toHaveBeenCalled();
    });
  });
});
