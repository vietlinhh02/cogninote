# CogniNote Backend API Design Document

## Overview

CogniNote Backend API là một RESTful API service được xây dựng với Node.js và Express.js framework, cung cấp comprehensive backend cho ứng dụng AI Note-taking. Hệ thống được thiết kế theo microservices architecture với các module độc lập cho transcription, AI analysis, meeting management, và real-time communication. API được document đầy đủ với Swagger/OpenAPI và hỗ trợ real-time capabilities thông qua WebSocket connections.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile App    │    │  External APIs  │
│   (React/Vue)   │    │   (React Native)│    │  (Webhooks)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Gateway           │
                    │   (Express.js + Swagger)  │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│  Meeting Service  │   │   AI Service      │   │  Real-time Service│
│  (Recall AI Bot)  │   │  (Gemini AI)      │   │   (WebSocket)     │
└─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     Data Layer            │
                    │  (PostgreSQL + Redis)     │
                    └───────────────────────────┘
```

### Technology Stack

- **API Framework**: Express.js (Node.js 18+)
- **Database**: PostgreSQL (primary), Redis (caching/sessions)
- **AI Services**: Google Gemini AI, Custom OpenAI endpoints
- **Meeting Bot**: Recall AI integration
- **Real-time**: WebSocket with Socket.IO
- **Documentation**: Swagger/OpenAPI 3.0
- **Authentication**: JWT tokens with OAuth2
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Components and Interfaces

### 1. API Gateway Layer

**Express.js Application**
- Main application entry point
- Swagger UI at `/docs` endpoint
- Request/response middleware
- CORS configuration
- Rate limiting

**Authentication Middleware**
- JWT token validation
- OAuth2 integration
- Session management
- Role-based access control

### 2. Meeting Management Service

**Meeting Controller**
```javascript
class MeetingController {
    async createMeeting(meetingData) { /* returns Meeting */ }
    async startMeeting(meetingId) { /* returns MeetingStatus */ }
    async stopMeeting(meetingId) { /* returns MeetingStatus */ }
    async getMeeting(meetingId) { /* returns Meeting */ }
    async listMeetings(filters) { /* returns Meeting[] */ }
}
```

**Recall AI Integration**
```javascript
class RecallAIService {
    async deployBot(meetingUrl, config) { /* returns BotInstance */ }
    async getBotStatus(botId) { /* returns BotStatus */ }
    async retrieveRecording(botId) { /* returns RecordingData */ }
    async stopBot(botId) { /* returns boolean */ }
}
```

### 3. AI Processing Service

**Gemini AI Service**
```javascript
class GeminiAIService {
    async analyzeTranscript(transcript) { /* returns AnalysisResult */ }
    async extractInsights(content) { /* returns InsightData */ }
    async generateSummary(meetingData) { /* returns Summary */ }
    async sentimentAnalysis(text) { /* returns SentimentScore */ }
}
```

**OpenAI Compatible Service**
```javascript
class OpenAIService {
    constructor(endpointUrl, apiKey) { /* initialize */ }
    async chatCompletion(messages) { /* returns CompletionResponse */ }
    async embeddings(text) { /* returns EmbeddingVector */ }
}
```

### 4. Transcription Service

**Real-time Transcription**
```javascript
class TranscriptionService {
    async startTranscription(audioStream) { /* returns TranscriptionSession */ }
    async processAudioChunk(chunk) { /* returns TranscriptSegment */ }
    async finalizeTranscription(sessionId) { /* returns CompleteTranscript */ }
}
```

### 5. Real-time Communication Service

**WebSocket Manager**
```javascript
class WebSocketManager {
    connect(websocket, meetingId) { /* returns Connection */ }
    disconnect(connectionId) { /* returns boolean */ }
    broadcastToMeeting(meetingId, data) { /* returns boolean */ }
    sendToClient(connectionId, data) { /* returns boolean */ }
}
```

### 6. Data Access Layer

**Repository Pattern**
```javascript
class MeetingRepository {
    async create(meeting) { /* returns Meeting */ }
    async getById(meetingId) { /* returns Meeting | null */ }
    async update(meetingId, updates) { /* returns Meeting */ }
    async delete(meetingId) { /* returns boolean */ }
    async search(criteria) { /* returns Meeting[] */ }
}
```

## Data Models

### Core Models

**Meeting Model**
```javascript
class Meeting {
    constructor({
        id,
        title,
        description = null,
        startTime,
        endTime = null,
        status,
        participants,
        botConfig,
        transcriptionId = null,
        analysisResults = null,
        createdAt,
        updatedAt
    }) { /* initialize properties */ }
}
```

**Transcription Model**
```javascript
class Transcription {
    constructor({
        id,
        meetingId,
        segments,
        language,
        confidenceScore,
        processingStatus,
        createdAt
    }) { /* initialize properties */ }
}
```

**TranscriptSegment Model**
```javascript
class TranscriptSegment {
    constructor({
        id,
        speakerId = null,
        speakerName = null,
        text,
        startTime,
        endTime,
        confidence,
        timestamp
    }) { /* initialize properties */ }
}
```

**AnalysisResult Model**
```javascript
class AnalysisResult {
    constructor({
        id,
        meetingId,
        summary,
        keyTopics,
        actionItems,
        sentimentAnalysis,
        speakerMetrics,
        insights,
        confidenceScore
    }) { /* initialize properties */ }
}
```

### Configuration Models

**AIConfig Model**
```javascript
class AIConfig {
    constructor({
        geminiApiKey,
        geminiModel = "gemini-pro",
        openaiEndpoint = null,
        openaiApiKey = null,
        openaiModel = "gpt-3.5-turbo",
        fallbackEnabled = true
    }) { /* initialize properties */ }
}
```

**BotConfig Model**
```javascript
class BotConfig {
    constructor({
        autoJoin = true,
        recordAudio = true,
        recordVideo = false,
        transcriptionEnabled = true,
        realTimeTranscription = true,
        language = "en"
    }) { /* initialize properties */ }
}
```

## Error Handling

### Error Response Format
```javascript
class ErrorResponse {
    constructor({
        errorCode,
        message,
        details = null,
        timestamp,
        correlationId
    }) { /* initialize properties */ }
}
```

### Error Categories

**Client Errors (4xx)**
- `400 BAD_REQUEST`: Invalid request parameters
- `401 UNAUTHORIZED`: Authentication required
- `403 FORBIDDEN`: Insufficient permissions
- `404 NOT_FOUND`: Resource not found
- `422 VALIDATION_ERROR`: Request validation failed
- `429 RATE_LIMITED`: Too many requests

**Server Errors (5xx)**
- `500 INTERNAL_ERROR`: Unexpected server error
- `502 SERVICE_UNAVAILABLE`: External service unavailable
- `503 MAINTENANCE`: Service under maintenance
- `504 TIMEOUT`: Request timeout

### Retry Logic
- Exponential backoff for external API calls
- Circuit breaker pattern for service dependencies
- Graceful degradation when AI services are unavailable

## Testing Strategy

### Unit Testing
- Test individual functions and methods
- Mock external dependencies (Gemini AI, Recall AI)
- Validate data models and serialization
- Test error handling and edge cases

### Integration Testing
- Test API endpoints end-to-end
- Validate database operations
- Test WebSocket connections
- Verify external service integrations

### Property-Based Testing
- Test API input validation across random inputs
- Verify data consistency and invariants
- Test concurrent operations and race conditions

### API Testing
- Automated testing via Swagger UI
- Contract testing for external integrations
- Load testing for performance validation
- Security testing for authentication and authorization

### Testing Framework
- **Unit Tests**: Jest with supertest for API testing
- **Property Tests**: fast-check library for property-based testing
- **API Tests**: supertest with Express app testing
- **Load Tests**: Artillery or k6 for performance testing
- **Minimum iterations**: 100 for each property-based test

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties related to API documentation (1.2, 1.5) can be combined into a comprehensive OpenAPI spec validation property
- Authentication properties (5.1, 5.3, 5.4) can be consolidated into a unified authentication behavior property  
- AI analysis properties (4.2, 4.3, 4.4, 4.5) can be combined into a comprehensive AI output validation property
- Real-time properties (8.2, 8.3, 8.4, 8.5) can be consolidated into WebSocket behavior properties

### Core Properties

**Property 1: API Response Consistency**
*For any* API endpoint call, the response should include appropriate HTTP status codes and follow standardized error format when errors occur
**Validates: Requirements 1.4**

**Property 2: OpenAPI Specification Completeness**
*For any* generated OpenAPI specification, it should contain all available endpoints with complete parameter descriptions and example values
**Validates: Requirements 1.2, 1.5**

**Property 3: Configuration Flexibility**
*For any* valid OpenAI endpoint URL provided through environment variables, the system should accept and use it for API calls
**Validates: Requirements 2.2**

**Property 4: AI Service Hot Reload**
*For any* AI service configuration change, the system should reload configuration and use new settings without requiring server restart
**Validates: Requirements 2.3**

**Property 5: AI Service Resilience**
*For any* AI service failure, the system should implement retry logic with exponential backoff and fallback to alternative providers when available
**Validates: Requirements 2.4**

**Property 6: AI Provider Switching**
*For any* API request with provider parameter, the system should route the request to the specified AI provider (Gemini or OpenAI)
**Validates: Requirements 2.5**

**Property 7: Transcription Timestamp Consistency**
*For any* audio processing operation, the resulting transcription should include accurate timestamp information for each text segment
**Validates: Requirements 3.3**

**Property 8: Meeting Data Persistence**
*For any* completed transcription, the system should store meeting data with participant identification and maintain data integrity
**Validates: Requirements 3.4**

**Property 9: AI Analysis Output Structure**
*For any* meeting content analysis, the output should contain key topics, action items, speaker metrics, and confidence scores in standardized JSON format
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

**Property 10: Authentication Enforcement**
*For any* protected API endpoint, requests without valid authentication tokens should be rejected with appropriate error responses
**Validates: Requirements 5.1**

**Property 11: Session Management**
*For any* expired authentication token, the system should invalidate the session and require re-authentication for subsequent requests
**Validates: Requirements 5.3**

**Property 12: Security Event Logging**
*For any* unauthorized access attempt, the system should log security events with correlation IDs and return appropriate error responses
**Validates: Requirements 5.4**

**Property 13: Rate Limiting Enforcement**
*For any* client exceeding API rate limits, the system should implement throttling and return clear error messages with retry information
**Validates: Requirements 5.5**

**Property 14: Meeting Search Functionality**
*For any* meeting search query with filters, the system should return only meetings matching the specified criteria
**Validates: Requirements 6.3**

**Property 15: Webhook Event Delivery**
*For any* meeting lifecycle event, the system should send webhook notifications to all registered external systems
**Validates: Requirements 6.5**

**Property 16: System Metrics Collection**
*For any* API request, the system should log response times, error rates, and resource usage metrics with proper correlation
**Validates: Requirements 7.2**

**Property 17: Error Logging Consistency**
*For any* system error, logs should contain detailed information with unique correlation IDs for traceability
**Validates: Requirements 7.3**

**Property 18: Circuit Breaker Behavior**
*For any* service dependency failure, the system should report dependency status and implement circuit breaker patterns to prevent cascade failures
**Validates: Requirements 7.4**

**Property 19: Real-time Message Broadcasting**
*For any* transcription data available during active meetings, the system should broadcast updates to all connected WebSocket clients immediately
**Validates: Requirements 8.2**

**Property 20: WebSocket Authentication**
*For any* WebSocket connection attempt, the system should authenticate and authorize access to specific meeting streams
**Validates: Requirements 8.3**

**Property 21: WebSocket Reconnection Handling**
*For any* network interruption during WebSocket connection, the system should handle reconnection and synchronize missed data gracefully
**Validates: Requirements 8.4**

**Property 22: Concurrent Connection Management**
*For any* number of simultaneous WebSocket connections, the system should efficiently manage concurrent real-time connections without performance degradation
**Validates: Requirements 8.5**

## Implementation Guidelines

### API Design Principles
- RESTful design with consistent resource naming
- Proper HTTP status codes and error responses
- Comprehensive input validation and sanitization
- Pagination for list endpoints
- Versioning strategy for API evolution

### Performance Considerations
- Database connection pooling
- Redis caching for frequently accessed data
- Async/await patterns for I/O operations
- Background task processing for heavy operations
- Connection limits and timeouts

### Security Best Practices
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and SQL injection prevention
- Rate limiting and DDoS protection
- Secure headers and CORS configuration
- Audit logging for sensitive operations

### Monitoring and Observability
- Structured logging with correlation IDs
- Health check endpoints for all services
- Metrics collection for performance monitoring
- Distributed tracing for request flows
- Error tracking and alerting

### Deployment Strategy
- Docker containerization
- Environment-specific configuration
- Database migrations
- Zero-downtime deployment
- Rollback capabilities
- Health checks during deployment