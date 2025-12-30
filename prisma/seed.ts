import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Create sample users
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@cogninote.com' },
    update: {},
    create: {
      email: 'admin@cogninote.com',
      passwordHash: '$2a$10$example', // In production, use bcrypt to hash
      fullName: 'Admin User',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'demo@cogninote.com' },
    update: {},
    create: {
      email: 'demo@cogninote.com',
      passwordHash: '$2a$10$example',
      fullName: 'Demo User',
    },
  });

  logger.info(`✅ Created users: ${user1.email}, ${user2.email}`);

  // Create sample meeting
  const meeting = await prisma.meeting.create({
    data: {
      userId: user1.id,
      title: 'Sample Team Meeting',
      description: 'Weekly team sync',
      platform: 'Zoom',
      scheduledAt: new Date(),
      status: 'scheduled',
    },
  });

  logger.info(`✅ Created meeting: ${meeting.title}`);

  // Create sample transcription
  await prisma.transcription.create({
    data: {
      meetingId: meeting.id,
      speakerName: 'John Doe',
      text: 'Welcome to the team meeting!',
      timestampStart: new Date(),
      confidence: 0.95,
    },
  });

  logger.info('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    logger.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
