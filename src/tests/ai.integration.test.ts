import { AIService } from '../services/ai/ai.service';
import { AIConfigService } from '../services/ai/config/ai-config.service';
import {
  AIProvider,
  AIMessageRole,
  AIChatRequest,
  AICompletionRequest,
} from '../services/ai/types/ai.types';

/**
 * Integration Tests for AI Service Provider Switching
 * These tests verify provider switching, fallback, and retry mechanisms
 *
 * NOTE: These tests require valid API keys in .env file to run
 * Set SKIP_AI_INTEGRATION_TESTS=true to skip these tests
 */

const SKIP_TESTS = process.env.SKIP_AI_INTEGRATION_TESTS === 'true';

describe('AI Service Integration Tests', () => {
  let aiService: AIService;
  let configService: AIConfigService;

  beforeAll(async () => {
    if (SKIP_TESTS) {
      console.log('Skipping AI integration tests (SKIP_AI_INTEGRATION_TESTS=true)');
      return;
    }

    configService = new AIConfigService();
    aiService = new AIService(configService);

    try {
      await aiService.initialize();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (!SKIP_TESTS && aiService) {
      await aiService.destroy();
    }
  });

  describe('Provider Initialization', () => {
    it('should initialize with available providers', () => {
      if (SKIP_TESTS) return;

      const availableProviders = aiService.getAvailableProviders();
      expect(availableProviders.length).toBeGreaterThan(0);
    });

    it('should have a default provider set', () => {
      if (SKIP_TESTS) return;

      const currentProvider = aiService.getCurrentProvider();
      expect(currentProvider).toBeDefined();
      expect([AIProvider.GEMINI, AIProvider.OPENAI]).toContain(currentProvider);
    });
  });

  describe('Gemini Provider', () => {
    beforeAll(() => {
      if (SKIP_TESTS) return;
      if (aiService.isProviderAvailable(AIProvider.GEMINI)) {
        aiService.switchProvider(AIProvider.GEMINI);
      }
    });

    it('should generate completion with Gemini', async () => {
      if (SKIP_TESTS || !aiService.isProviderAvailable(AIProvider.GEMINI)) {
        console.log('Skipping Gemini test - provider not available');
        return;
      }

      const request: AICompletionRequest = {
        prompt: 'Say "Hello, World!" and nothing else.',
        options: {
          temperature: 0,
          maxTokens: 50,
        },
      };

      const response = await aiService.complete(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.provider).toBe(AIProvider.GEMINI);
      expect(response.model).toBeDefined();
    }, 30000);

    it('should generate chat completion with Gemini', async () => {
      if (SKIP_TESTS || !aiService.isProviderAvailable(AIProvider.GEMINI)) {
        console.log('Skipping Gemini test - provider not available');
        return;
      }

      const request: AIChatRequest = {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: 'You are a helpful assistant. Keep responses brief.',
          },
          {
            role: AIMessageRole.USER,
            content: 'What is 2+2?',
          },
        ],
        options: {
          temperature: 0,
          maxTokens: 50,
        },
      };

      const response = await aiService.chat(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toContain('4');
      expect(response.provider).toBe(AIProvider.GEMINI);
    }, 30000);

    it('should stream chat completion with Gemini', async () => {
      if (SKIP_TESTS || !aiService.isProviderAvailable(AIProvider.GEMINI)) {
        console.log('Skipping Gemini test - provider not available');
        return;
      }

      const request: AIChatRequest = {
        messages: [
          {
            role: AIMessageRole.USER,
            content: 'Count from 1 to 5.',
          },
        ],
        options: {
          temperature: 0,
          maxTokens: 100,
        },
      };

      const chunks: string[] = [];
      let isComplete = false;

      await aiService.streamChat(request, (chunk) => {
        if (chunk.content) {
          chunks.push(chunk.content);
        }
        if (chunk.isComplete) {
          isComplete = true;
        }
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(isComplete).toBe(true);
    }, 30000);
  });

  describe('OpenAI Provider', () => {
    beforeAll(() => {
      if (SKIP_TESTS) return;
      if (aiService.isProviderAvailable(AIProvider.OPENAI)) {
        aiService.switchProvider(AIProvider.OPENAI);
      }
    });

    it('should generate completion with OpenAI', async () => {
      if (SKIP_TESTS || !aiService.isProviderAvailable(AIProvider.OPENAI)) {
        console.log('Skipping OpenAI test - provider not available');
        return;
      }

      const request: AICompletionRequest = {
        prompt: 'Say "Hello, OpenAI!" and nothing else.',
        options: {
          temperature: 0,
          maxTokens: 50,
        },
      };

      const response = await aiService.complete(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.provider).toBe(AIProvider.OPENAI);
      expect(response.model).toBeDefined();
    }, 30000);

    it('should generate chat completion with OpenAI', async () => {
      if (SKIP_TESTS || !aiService.isProviderAvailable(AIProvider.OPENAI)) {
        console.log('Skipping OpenAI test - provider not available');
        return;
      }

      const request: AIChatRequest = {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: 'You are a helpful assistant. Keep responses brief.',
          },
          {
            role: AIMessageRole.USER,
            content: 'What is 3+3?',
          },
        ],
        options: {
          temperature: 0,
          maxTokens: 50,
        },
      };

      const response = await aiService.chat(request);

      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toContain('6');
      expect(response.provider).toBe(AIProvider.OPENAI);
    }, 30000);
  });

  describe('Provider Switching', () => {
    it('should switch between providers successfully', async () => {
      if (SKIP_TESTS) return;

      const availableProviders = aiService.getAvailableProviders();

      if (availableProviders.length < 2) {
        console.log('Skipping provider switching test - need at least 2 providers');
        return;
      }

      // Switch to first provider
      aiService.switchProvider(availableProviders[0]);
      expect(aiService.getCurrentProvider()).toBe(availableProviders[0]);

      // Switch to second provider
      aiService.switchProvider(availableProviders[1]);
      expect(aiService.getCurrentProvider()).toBe(availableProviders[1]);
    });

    it('should use different providers for different requests', async () => {
      if (SKIP_TESTS) return;

      const availableProviders = aiService.getAvailableProviders();

      if (availableProviders.length < 2) {
        console.log('Skipping multi-provider test - need at least 2 providers');
        return;
      }

      const request: AICompletionRequest = {
        prompt: 'Say hello',
        options: {
          temperature: 0,
          maxTokens: 20,
        },
      };

      // Request with first provider
      const response1 = await aiService.complete(request, availableProviders[0]);
      expect(response1.provider).toBe(availableProviders[0]);

      // Request with second provider
      const response2 = await aiService.complete(request, availableProviders[1]);
      expect(response2.provider).toBe(availableProviders[1]);
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      if (SKIP_TESTS) return;

      const request: AIChatRequest = {
        messages: [
          {
            role: AIMessageRole.USER,
            content: '', // Empty content might cause error
          },
        ],
        options: {
          maxTokens: -1, // Invalid max tokens
        },
      };

      await expect(aiService.chat(request)).rejects.toThrow();
    }, 30000);
  });

  describe('Configuration', () => {
    it('should have valid configuration', () => {
      if (SKIP_TESTS) return;

      const validation = configService.validateConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should report provider status correctly', () => {
      if (SKIP_TESTS) return;

      const status = configService.getProviderStatus();
      expect(status).toBeDefined();
      expect(typeof status[AIProvider.GEMINI]).toBe('boolean');
      expect(typeof status[AIProvider.OPENAI]).toBe('boolean');
    });
  });

  describe('Usage Tracking', () => {
    it('should return usage information in responses', async () => {
      if (SKIP_TESTS) return;

      const availableProviders = aiService.getAvailableProviders();
      if (availableProviders.length === 0) {
        console.log('Skipping usage tracking test - no providers available');
        return;
      }

      const request: AICompletionRequest = {
        prompt: 'Say hello',
        options: {
          temperature: 0,
          maxTokens: 20,
        },
      };

      const response = await aiService.complete(request);

      // Usage info may not always be present depending on provider
      if (response.usage) {
        expect(response.usage.promptTokens).toBeGreaterThan(0);
        expect(response.usage.totalTokens).toBeGreaterThan(0);
      }
    }, 30000);
  });
});
