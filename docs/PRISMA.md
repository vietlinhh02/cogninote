# Prisma ORM Integration

## Overview

CogniNote Backend uses **Prisma ORM** for type-safe database access with PostgreSQL. Prisma provides auto-generated types, migrations, and a powerful query API.

## Why Prisma?

1. **Type Safety**: Fully typed database queries with TypeScript
2. **Auto-completion**: IDE support for all database operations
3. **Migration System**: Version-controlled schema changes
4. **Developer Experience**: Intuitive API and excellent documentation
5. **Performance**: Optimized queries and connection pooling
6. **Prisma Studio**: Visual database browser

## Setup

### 1. Install Dependencies

Already included in `package.json`:
```json
{
  "dependencies": {
    "@prisma/client": "^5.8.0"
  },
  "devDependencies": {
    "prisma": "^5.8.0"
  }
}
```

### 2. Environment Configuration

Set `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cogninote?schema=public"
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

## Database Schema

Located in `prisma/schema.prisma`:

```prisma
// User model
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  fullName     String?   @map("full_name")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  meetings     Meeting[]

  @@map("users")
}

// Meeting model
model Meeting {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  title           String
  description     String?
  meetingUrl      String?   @map("meeting_url")
  platform        String?
  scheduledAt     DateTime? @map("scheduled_at")
  startedAt       DateTime? @map("started_at")
  endedAt         DateTime? @map("ended_at")
  status          String    @default("scheduled")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  transcriptions  Transcription[]

  @@index([userId])
  @@index([scheduledAt])
  @@map("meetings")
}

// Transcription model
model Transcription {
  id             String    @id @default(uuid())
  meetingId      String    @map("meeting_id")
  speakerName    String?   @map("speaker_name")
  text           String
  timestampStart DateTime? @map("timestamp_start")
  timestampEnd   DateTime? @map("timestamp_end")
  confidence     Decimal?  @db.Decimal(5, 4)
  createdAt      DateTime  @default(now()) @map("created_at")

  meeting Meeting @relation(fields: [meetingId], references: [id], onDelete: Cascade)

  @@index([meetingId])
  @@map("transcriptions")
}
```

## Prisma Client Usage

### Import Prisma Client

```typescript
import { prisma } from './config/database.js';
```

### Basic CRUD Operations

#### Create
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    fullName: 'John Doe',
  },
});
```

#### Read
```typescript
// Find unique
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// Find many
const users = await prisma.user.findMany({
  where: { fullName: { contains: 'John' } },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Find with relations
const meeting = await prisma.meeting.findUnique({
  where: { id: meetingId },
  include: {
    user: true,
    transcriptions: true,
  },
});
```

#### Update
```typescript
const updated = await prisma.user.update({
  where: { id: userId },
  data: { fullName: 'Jane Doe' },
});
```

#### Delete
```typescript
await prisma.user.delete({
  where: { id: userId },
});
```

### Advanced Queries

#### Filtering
```typescript
const meetings = await prisma.meeting.findMany({
  where: {
    AND: [
      { status: 'completed' },
      { scheduledAt: { gte: new Date('2024-01-01') } },
    ],
  },
});
```

#### Pagination
```typescript
const page = 1;
const pageSize = 20;

const meetings = await prisma.meeting.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { scheduledAt: 'desc' },
});
```

#### Aggregations
```typescript
const count = await prisma.meeting.count({
  where: { userId: userId },
});

const stats = await prisma.transcription.aggregate({
  where: { meetingId: meetingId },
  _avg: { confidence: true },
  _count: true,
});
```

#### Transactions
```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', passwordHash: 'hash' },
  });

  const meeting = await tx.meeting.create({
    data: {
      userId: user.id,
      title: 'First Meeting',
    },
  });

  return { user, meeting };
});
```

## Migrations

### Create Migration

```bash
# Create and apply migration
npm run prisma:migrate

# This will:
# 1. Compare schema.prisma with database
# 2. Generate SQL migration file
# 3. Apply migration to database
# 4. Regenerate Prisma Client
```

### Push Schema (Development)

For rapid prototyping without creating migration files:

```bash
npm run prisma:push
```

**Note**: Use `db push` for development, `migrate` for production.

### Migration Files

Migrations are stored in `prisma/migrations/`:
```
prisma/migrations/
├── 20240101000000_init/
│   └── migration.sql
├── 20240102000000_add_platform/
│   └── migration.sql
└── migration_lock.toml
```

## Database Seeding

Seed file: `prisma/seed.ts`

```bash
# Run seed
npm run prisma:seed
```

Example seed script:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@cogninote.com' },
    update: {},
    create: {
      email: 'admin@cogninote.com',
      passwordHash: '$2a$10$example',
      fullName: 'Admin User',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Prisma Studio

Visual database browser:

```bash
npm run prisma:studio
```

Opens at `http://localhost:5555` with GUI to:
- View and edit data
- Run queries
- Inspect schema

## Best Practices

### 1. Use Prisma Client Singleton

```typescript
// config/database.ts
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 2. Handle Errors

```typescript
try {
  const user = await prisma.user.create({ data: userData });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('Email already exists');
    }
  }
  throw error;
}
```

### 3. Use Select for Performance

```typescript
// Only fetch needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    fullName: true,
  },
});
```

### 4. Leverage Relations

```typescript
// Use include for related data
const meeting = await prisma.meeting.findUnique({
  where: { id: meetingId },
  include: {
    user: {
      select: { fullName: true, email: true },
    },
    transcriptions: {
      orderBy: { timestampStart: 'asc' },
    },
  },
});
```

## Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| P2002 | Unique constraint violation | Check for duplicate values |
| P2025 | Record not found | Verify ID exists |
| P2003 | Foreign key constraint | Ensure related record exists |
| P2014 | Relation violation | Check cascade settings |

## Production Considerations

### Connection Pooling

Prisma handles connection pooling automatically. Configure in schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Migration Strategy

1. **Development**: Use `prisma db push` for rapid iteration
2. **Staging**: Test migrations with `prisma migrate dev`
3. **Production**: Apply with `prisma migrate deploy`

### Monitoring

```typescript
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Examples](https://github.com/prisma/prisma-examples)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
