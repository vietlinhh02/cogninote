# CogniNote Backend - Getting Started

## Prerequisites

- Node.js >= 18.x
- Docker & Docker Compose
- npm or yarn
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/vietlinhh02/cogninote.git
cd cogninote
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: GEMINI_API_KEY, JWT_SECRET
```

### 3. Start Services with Docker

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Verify services are running
docker-compose ps
```

### 4. Run Development Server

```bash
# Start development server with hot reload
npm run dev
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Building for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## Docker Commands

```bash
# Start all services
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Rebuild containers
docker-compose up -d --build
```

## Project Structure

```
cogninote/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   ├── database.ts   # PostgreSQL setup
│   │   ├── redis.ts      # Redis setup
│   │   └── swagger.ts    # API documentation
│   ├── middlewares/      # Express middlewares
│   │   ├── error-handler.ts
│   │   ├── not-found.ts
│   │   └── rate-limiter.ts
│   ├── routes/           # API routes
│   │   ├── health.routes.ts
│   │   ├── auth.routes.ts
│   │   └── meeting.routes.ts
│   ├── utils/            # Utilities
│   │   └── logger.ts     # Winston logger
│   ├── tests/            # Test files
│   ├── app.ts            # Express app setup
│   └── index.ts          # Entry point
├── scripts/              # Utility scripts
│   └── init-db.sql       # Database initialization
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml    # Docker services
├── Dockerfile            # Container image
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── jest.config.js        # Test config
```

## API Endpoints

### Health
- `GET /api/health` - System health check

### Authentication (To be implemented)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Meetings (To be implemented)
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NODE_ENV | Environment mode | No | development |
| PORT | Server port | No | 8000 |
| DB_HOST | PostgreSQL host | Yes | localhost |
| DB_PORT | PostgreSQL port | No | 5432 |
| DB_NAME | Database name | Yes | cogninote |
| DB_USER | Database user | Yes | postgres |
| DB_PASSWORD | Database password | Yes | - |
| REDIS_HOST | Redis host | Yes | localhost |
| REDIS_PORT | Redis port | No | 6379 |
| JWT_SECRET | JWT secret key | Yes | - |
| GEMINI_API_KEY | Gemini AI API key | Yes | - |
| RECALL_AI_API_KEY | Recall AI API key | Yes | - |

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Change port in .env
PORT=3000
```

## Next Steps

1. Implement authentication endpoints
2. Implement meeting management endpoints
3. Integrate Gemini AI for transcription
4. Integrate Recall AI for meeting bot
5. Add WebSocket for real-time updates
6. Implement comprehensive error handling
7. Add API rate limiting per user
8. Set up monitoring and logging

## Support

- Email: nvlinh0607@gmail.com
- GitHub Issues: https://github.com/vietlinhh02/cogninote/issues
