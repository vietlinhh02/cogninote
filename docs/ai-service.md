# AI Service Integration Layer

Comprehensive AI service integration layer with support for multiple providers, retry logic, fallback mechanisms, and hot configuration reload.

**Note:** This implementation uses the new `@google/genai` package for Gemini integration, which provides a more streamlined API compared to the legacy `@google/generative-ai` package.

## Features

- **Multi-Provider Support**: Gemini AI and OpenAI with extensible architecture
- **Provider Switching**: Runtime switching between AI providers
- **Retry Logic**: Exponential backoff retry for transient failures
- **Fallback Mechanism**: Automatic fallback to secondary provider on errors
- **Hot Configuration Reload**: Update API keys without service restart (dev mode)
- **Error Handling**: Comprehensive error types and handling
- **Type Safety**: Full TypeScript type coverage
- **Logging**: Correlation ID tracking for all operations
- **Testing**: Unit and integration tests included

## Architecture

```
src/services/ai/
├── types/
│   └── ai.types.ts              # TypeScript types and interfaces
├── providers/
│   ├── base.provider.ts         # Abstract base provider class
│   ├── gemini.provider.ts       # Google Gemini implementation
│   └── openai.provider.ts       # OpenAI implementation
├── config/
│   └── ai-config.service.ts     # Configuration management with hot reload
├── ai.service.ts                # Main AI service
└── index.ts                     # Module exports
```

## Configuration

### Environment Variables

```bash
# Gemini AI (Primary Provider)
GEMINI_API_KEY=your-gemini-api-key

# OpenAI (Optional - Fallback Provider)
OPENAI_API_KEY=your-openai-api-key
OPENAI_ENDPOINT=https://api.openai.com/v1  # Optional custom endpoint

# Testing
SKIP_AI_INTEGRATION_TESTS=false
```

### Service Configuration

Configuration is managed through `AIConfigService` and loaded from environment variables:

```typescript
{
  defaultProvider: AIProvider.GEMINI,
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      defaultModel: 'gemini-1.5-pro'
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o-mini',
      endpoint: process.env.OPENAI_ENDPOINT
    }
  },
  retry: {
    maxRetries: 3,
    baseDelay: 1000,        // ms
    maxDelay: 10000,        // ms
    exponentialBase: 2,
    retryableErrors: [
      AIErrorType.RATE_LIMIT,
      AIErrorType.NETWORK_ERROR,
      AIErrorType.TIMEOUT,
      AIErrorType.PROVIDER_ERROR
    ]
  },
  fallback: {
    enabled: true,
    primaryProvider: AIProvider.GEMINI,
    fallbackProvider: AIProvider.OPENAI,
    fallbackOnErrors: [
      AIErrorType.AUTHENTICATION,
      AIErrorType.RATE_LIMIT,
      AIErrorType.PROVIDER_ERROR
    ]
  },
  timeout: 30000,
  enableHotReload: true  // Development mode only
}
```

## Usage

### Initialize Service

```typescript
import { aiService } from './services/ai';

// Initialize on app startup
await aiService.initialize();
```

### Basic Completion

```typescript
import { aiService, AICompletionRequest } from './services/ai';

const request: AICompletionRequest = {
  prompt: 'Explain quantum computing in simple terms',
  options: {
    temperature: 0.7,
    maxTokens: 500
  }
};

const response = await aiService.complete(request);
console.log(response.content);
console.log(`Provider: ${response.provider}, Model: ${response.model}`);
```

### Chat Completion

```typescript
import {
  aiService,
  AIChatRequest,
  AIMessageRole
} from './services/ai';

const request: AIChatRequest = {
  messages: [
    {
      role: AIMessageRole.SYSTEM,
      content: 'You are a helpful coding assistant.'
    },
    {
      role: AIMessageRole.USER,
      content: 'How do I implement a binary search in TypeScript?'
    }
  ],
  options: {
    temperature: 0.3,
    maxTokens: 1000
  }
};

const response = await aiService.chat(request);
console.log(response.content);
```

### Streaming Chat

```typescript
import { aiService, AIChatRequest, AIMessageRole } from './services/ai';

const request: AIChatRequest = {
  messages: [
    {
      role: AIMessageRole.USER,
      content: 'Write a short story about a robot learning to paint.'
    }
  ],
  options: {
    temperature: 0.9,
    maxTokens: 2000
  }
};

await aiService.streamChat(request, (chunk) => {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }

  if (chunk.isComplete) {
    console.log('\n\nStream complete!');
    if (chunk.usage) {
      console.log(`Tokens used: ${chunk.usage.totalTokens}`);
    }
  }
});
```

### Provider Switching

```typescript
import { aiService, AIProvider } from './services/ai';

// Check available providers
const providers = aiService.getAvailableProviders();
console.log('Available providers:', providers);

// Switch to OpenAI
aiService.switchProvider(AIProvider.OPENAI);

// Make request with switched provider
const response = await aiService.complete({ prompt: 'Hello!' });
console.log(`Response from: ${response.provider}`);

// Or specify provider for single request
const geminiResponse = await aiService.complete(
  { prompt: 'Hello!' },
  AIProvider.GEMINI
);
```

### Error Handling

```typescript
import { aiService, AIError, AIErrorType } from './services/ai';

try {
  const response = await aiService.chat(request);
  console.log(response.content);
} catch (error) {
  if (error instanceof AIError) {
    switch (error.type) {
      case AIErrorType.AUTHENTICATION:
        console.error('Invalid API key');
        break;
      case AIErrorType.RATE_LIMIT:
        console.error('Rate limit exceeded, retry later');
        break;
      case AIErrorType.NETWORK_ERROR:
        console.error('Network error, check connection');
        break;
      default:
        console.error('AI service error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Provider Details

### Gemini AI (Primary)

**Models:**
- `gemini-1.5-pro` (default) - Most capable model
- `gemini-1.5-flash` - Faster, more efficient
- `gemini-1.0-pro` - Previous generation

**Features:**
- System instructions support
- Streaming support
- High rate limits
- Usage tracking

**Configuration:**
```typescript
{
  apiKey: process.env.GEMINI_API_KEY,
  defaultModel: 'gemini-1.5-pro'
}
```

### OpenAI (Fallback)

**Models:**
- `gpt-4o-mini` (default) - Cost-effective
- `gpt-4o` - Most capable
- `gpt-4-turbo` - Fast and capable
- `gpt-3.5-turbo` - Fast and affordable

**Features:**
- Custom endpoint support (Azure, local LLMs)
- Streaming support
- Function calling
- Usage tracking

**Configuration:**
```typescript
{
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4o-mini',
  endpoint: process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1'
}
```

**Custom Endpoints:**
- Azure OpenAI: `https://{resource}.openai.azure.com/openai/deployments/{deployment}`
- Local LLM (LM Studio): `http://localhost:1234/v1`
- Ollama: `http://localhost:11434/v1`

## Retry Logic

The service automatically retries failed requests with exponential backoff:

1. **Retryable Errors:**
   - Rate limit exceeded
   - Network errors
   - Timeout errors
   - Provider errors

2. **Retry Strategy:**
   - Max retries: 3
   - Base delay: 1000ms
   - Max delay: 10000ms
   - Exponential backoff with base 2

3. **Non-Retryable Errors:**
   - Authentication errors (invalid API key)
   - Invalid request errors

## Fallback Mechanism

Automatic fallback to secondary provider on specific errors:

1. **Fallback Triggers:**
   - Authentication failures
   - Rate limit exceeded
   - Provider errors

2. **Fallback Flow:**
   ```
   Primary (Gemini) → Error → Fallback (OpenAI) → Success/Failure
   ```

3. **Configuration:**
   ```typescript
   {
     enabled: true,
     primaryProvider: AIProvider.GEMINI,
     fallbackProvider: AIProvider.OPENAI,
     fallbackOnErrors: [
       AIErrorType.AUTHENTICATION,
       AIErrorType.RATE_LIMIT,
       AIErrorType.PROVIDER_ERROR
     ]
   }
   ```

## Hot Configuration Reload

In development mode, the service watches `.env` file for changes:

```typescript
import { aiConfigService } from './services/ai';

// Enable hot reload (automatic in dev mode)
aiConfigService.enableHotReload();

// Listen to reload events
aiConfigService.on('config:reloaded', (config) => {
  console.log('Configuration reloaded:', config);
});

// Disable hot reload
aiConfigService.disableHotReload();
```

**How it works:**
1. File watcher monitors `.env` file
2. Changes trigger debounced reload (1 second)
3. Environment variables re-read
4. Provider configurations updated
5. Event emitted to listeners

## Testing

### Unit Tests

```bash
npm test src/tests/ai.service.test.ts
```

Tests cover:
- Service initialization
- Provider switching
- Retry logic
- Fallback mechanism
- Error handling
- Configuration validation

### Integration Tests

```bash
# Requires valid API keys in .env
npm test src/tests/ai.integration.test.ts

# Skip integration tests
SKIP_AI_INTEGRATION_TESTS=true npm test
```

Tests cover:
- Real provider requests
- Provider switching
- Streaming
- Error scenarios
- Usage tracking

## API Reference

### AIService

Main service class for AI operations.

#### Methods

- `initialize(): Promise<void>` - Initialize service and providers
- `complete(request: AICompletionRequest, provider?: AIProvider): Promise<AIResponse>` - Generate completion
- `chat(request: AIChatRequest, provider?: AIProvider): Promise<AIResponse>` - Generate chat completion
- `streamChat(request: AIChatRequest, onChunk: Function, provider?: AIProvider): Promise<void>` - Stream chat
- `switchProvider(provider: AIProvider): void` - Switch active provider
- `getCurrentProvider(): AIProvider` - Get current provider
- `getAvailableProviders(): AIProvider[]` - Get available providers
- `isProviderAvailable(provider: AIProvider): boolean` - Check if provider is available
- `destroy(): Promise<void>` - Cleanup resources

### Types

See `src/services/ai/types/ai.types.ts` for full type definitions:

- `AIProvider` - Enum of supported providers
- `AIMessageRole` - Enum of message roles
- `AIErrorType` - Enum of error types
- `AIModelConfig` - Model configuration interface
- `AIRequestOptions` - Request options interface
- `AIMessage` - Chat message interface
- `AIChatRequest` - Chat request interface
- `AICompletionRequest` - Completion request interface
- `AIResponse` - Response interface
- `AIStreamChunk` - Stream chunk interface
- `AIError` - Error class

## Best Practices

1. **Initialize Once**: Initialize the service on app startup
2. **Use Singleton**: Use the exported `aiService` instance
3. **Handle Errors**: Always wrap AI calls in try-catch
4. **Set Timeouts**: Configure appropriate timeouts for your use case
5. **Monitor Usage**: Track token usage to manage costs
6. **Use Streaming**: For long responses, use streaming for better UX
7. **Test Fallback**: Ensure fallback provider is configured and tested
8. **Secure Keys**: Never commit API keys, use environment variables
9. **Rate Limiting**: Implement application-level rate limiting
10. **Logging**: Monitor logs for errors and performance issues

## Troubleshooting

### "AI service not initialized"
- Call `await aiService.initialize()` on app startup

### "Provider not available"
- Check API key is set in `.env`
- Verify provider is configured in config service
- Run `aiService.getAvailableProviders()` to see active providers

### Rate limit errors
- Reduce request frequency
- Implement request queuing
- Consider upgrading API tier

### Fallback not working
- Ensure fallback provider is configured
- Check fallback configuration includes error type
- Verify fallback provider has valid API key

### Hot reload not working
- Only works in development mode (`NODE_ENV=development`)
- Check file watcher has proper permissions
- Verify `.env` file path is correct

## Performance

- **Latency**: 1-5 seconds typical for chat completions
- **Throughput**: Limited by provider rate limits
- **Token Limits**: Gemini: ~1M tokens/min, OpenAI: varies by tier
- **Caching**: Implement application-level caching for repeated queries
- **Streaming**: Reduces perceived latency for long responses

## Security

- API keys stored in environment variables only
- No keys in logs or error messages
- Correlation IDs for request tracking
- Input validation on all requests
- Error messages sanitized before client response

## License

MIT
