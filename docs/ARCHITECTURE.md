# Backend API Architecture

## Overview

CogniNote Backend API is built using Express.js with TypeScript, following a modular architecture pattern. The system integrates with PostgreSQL for data persistence, Redis for caching, and external AI services (Gemini AI, Recall AI) for intelligent features.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Web App, Mobile App, Third-party Integrations)            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  - CORS, Helmet Security                                    │
│  - Rate Limiting                                             │
│  - Request Logging                                           │
│  - JWT Authentication                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌─────────────┬──────────────┬──────────────┐             │
│  │   Routes    │ Controllers  │  Middlewares │             │
│  └─────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  - Business Logic                                            │
│  - Data Validation                                           │
│  - External API Integration                                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌─────────────┬──────────────┬──────────────┐             │
│  │ PostgreSQL  │    Redis     │  File Storage│             │
│  └─────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services Layer                     │
│  ┌─────────────┬──────────────┬──────────────┐             │
│  │ Gemini AI   │  Recall AI   │   OpenAI     │             │
│  └─────────────┴──────────────┴──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Configuration Layer (`src/config/`)
- **index.ts**: Centralized configuration management using environment variables
- **database.ts**: PostgreSQL connection pool and management
- **redis.ts**: Redis client setup and connection handling
- **swagger.ts**: OpenAPI/Swagger documentation configuration

### 2. Middleware Layer (`src/middlewares/`)
- **error-handler.ts**: Global error handling middleware
- **not-found.ts**: 404 route handler
- **rate-limiter.ts**: API rate limiting using express-rate-limit
- **auth.middleware.ts** (to be implemented): JWT authentication

### 3. Routes Layer (`src/routes/`)
- RESTful API route definitions
- Swagger documentation annotations
- Route-specific middleware application

### 4. Controllers Layer (`src/controllers/`)
- Request validation
- Business logic orchestration
- Response formatting

### 5. Services Layer (`src/services/`)
- Core business logic
- External API integration
- Data transformation

### 6. Utils Layer (`src/utils/`)
- **logger.ts**: Winston-based logging system
- Helper functions
- Common utilities

## Data Flow

1. **Request Reception**
   - Client sends HTTP request
   - Request passes through security middleware (Helmet, CORS)
   - Rate limiter checks request frequency

2. **Authentication & Authorization**
   - JWT token validation (if required)
   - User permissions check
   - Request logging

3. **Request Processing**
   - Route handler receives request
   - Controller validates input
   - Service layer processes business logic

4. **Data Operations**
   - Database queries (PostgreSQL)
   - Cache operations (Redis)
   - External API calls

5. **Response Generation**
   - Data formatting
   - Error handling
   - Response logging
   - Client receives response

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Meetings Table
```sql
meetings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  meeting_url VARCHAR(512),
  platform VARCHAR(50),
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Transcriptions Table
```sql
transcriptions (
  id UUID PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id),
  speaker_name VARCHAR(255),
  text TEXT,
  timestamp_start TIMESTAMP,
  timestamp_end TIMESTAMP,
  confidence DECIMAL(5,4),
  created_at TIMESTAMP
)
```

## Security Measures

1. **Authentication**: JWT-based authentication
2. **Authorization**: Role-based access control
3. **Data Protection**:
   - Helmet.js for HTTP headers
   - CORS configuration
   - Input validation using Joi
4. **Rate Limiting**: Protection against brute force and DoS
5. **Secrets Management**: Environment variables for sensitive data
6. **SQL Injection Prevention**: Parameterized queries
7. **XSS Protection**: Input sanitization

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API design enables multiple instances
2. **Caching Strategy**: Redis for session storage and frequently accessed data
3. **Database Optimization**: Connection pooling, indexing
4. **Load Balancing**: Ready for reverse proxy (Nginx, HAProxy)
5. **Containerization**: Docker support for consistent deployment

## Performance Optimization

1. **Connection Pooling**: Reuse database connections
2. **Redis Caching**: Cache frequently accessed data
3. **Response Compression**: Gzip compression for responses
4. **Query Optimization**: Indexed database queries
5. **Lazy Loading**: Load data on demand

## Monitoring & Logging

1. **Winston Logger**: Structured logging with multiple transports
2. **Health Checks**: Endpoint for service health monitoring
3. **Error Tracking**: Centralized error logging
4. **Performance Metrics**: Request/response time tracking
5. **Audit Logs**: User action tracking

## Deployment Architecture

### Development
- Local development with hot reload
- Docker Compose for services
- Environment-specific configuration

### Staging
- Docker containers
- CI/CD via GitHub Actions
- Automated testing

### Production
- Kubernetes cluster (recommended)
- Multiple replicas for high availability
- Auto-scaling based on load
- Monitoring and alerting

## External Integrations

### Gemini AI
- Natural Language Processing
- Meeting content analysis
- Sentiment analysis

### Recall AI
- Meeting bot deployment
- Real-time transcription
- Audio processing

### OpenAI (Optional)
- Fallback AI processing
- Custom endpoint support

## Future Enhancements

1. WebSocket support for real-time features
2. Message queue (RabbitMQ/Redis Pub/Sub)
3. Microservices architecture
4. GraphQL API
5. Advanced analytics and reporting
