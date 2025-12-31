import { TranscriptionService, TranscriptionSessionStatus } from '../services/transcription.service';
import { transcriptionRepository } from '../repositories/transcription.repository';
import { meetingRepository } from '../repositories/meeting.repository';
import { AppError } from '../middlewares/error-handler';
import { Decimal } from '@prisma/client/runtime/library';
import {
  TranscriptionSegment,
  TranscriptionResponse,
} from '../services/recall-ai/types/recall-ai.types';

jest.mock('../repositories/transcription.repository');
jest.mock('../repositories/meeting.repository');
jest.mock('../services/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

import { cacheService } from '../services/cache.service';

const mockedTranscriptionRepository = transcriptionRepository as jest.Mocked<typeof transcriptionRepository>;
const mockedMeetingRepository = meetingRepository as jest.Mocked<typeof meetingRepository>;
const mockedCacheService = cacheService as jest.Mocked<typeof cacheService>;

describe('TranscriptionService', () => {
  let service: TranscriptionService;

  const mockMeeting = {
    id: 'meeting-123',
    userId: 'user-123',
    title: 'Test Meeting',
    description: 'Test Description',
    meetingUrl: 'https://zoom.us/j/123456789',
    platform: 'zoom',
    scheduledAt: new Date(),
    startedAt: null,
    endedAt: null,
    status: 'scheduled',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTranscription = {
    id: 'trans-123',
    meetingId: 'meeting-123',
    speakerName: 'John Doe',
    text: 'Hello, this is a test transcription',
    timestampStart: new Date('2024-01-01T10:00:00Z'),
    timestampEnd: new Date('2024-01-01T10:00:05Z'),
    confidence: new Decimal(0.95),
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranscriptionService();
  });

  describe('createSession', () => {
    it('should create a new transcription session', async () => {
      mockedMeetingRepository.findById.mockResolvedValue(mockMeeting as any);
      mockedCacheService.set.mockResolvedValue(true);

      const session = await service.createSession('meeting-123');

      expect(session).toMatchObject({
        meetingId: 'meeting-123',
        status: TranscriptionSessionStatus.ACTIVE,
        totalSegments: 0,
        totalDuration: 0,
        averageConfidence: 0,
      });

      expect(session.sessionId).toContain('session_meeting-123');
      expect(session.speakers).toBeInstanceOf(Set);
      expect(mockedMeetingRepository.findById).toHaveBeenCalledWith('meeting-123');
      expect(mockedCacheService.set).toHaveBeenCalled();
    });

    it('should throw error when meeting not found', async () => {
      mockedMeetingRepository.findById.mockResolvedValue(null);

      await expect(service.createSession('meeting-123')).rejects.toThrow(AppError);
      await expect(service.createSession('meeting-123')).rejects.toThrow('Meeting not found');
    });
  });

  describe('getSession', () => {
    it('should retrieve cached session', async () => {
      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.ACTIVE,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 5,
        totalDuration: 120,
        speakers: ['John Doe', 'Jane Smith'],
        averageConfidence: 0.92,
      };

      mockedCacheService.get.mockResolvedValue(cachedSession);

      const session = await service.getSession('session-123');

      expect(session).toBeDefined();
      expect(session?.meetingId).toBe('meeting-123');
      expect(session?.speakers).toBeInstanceOf(Set);
      expect(session?.speakers.size).toBe(2);
      expect(mockedCacheService.get).toHaveBeenCalledWith('transcription_session:session-123');
    });

    it('should return null when session not found', async () => {
      mockedCacheService.get.mockResolvedValue(null);

      const session = await service.getSession('session-123');

      expect(session).toBeNull();
    });
  });

  describe('processAudioChunk', () => {
    it('should process audio chunk and create transcription segment', async () => {
      const audioChunk = {
        chunkId: 'chunk-123',
        meetingId: 'meeting-123',
        timestamp: 1704105600, // 2024-01-01T10:00:00Z in seconds
        duration: 5,
        speaker: 'John Doe',
      };

      mockedTranscriptionRepository.create.mockResolvedValue(mockTranscription as any);

      const segment = await service.processAudioChunk(
        audioChunk,
        'Hello, this is a test',
        0.95,
        'John Doe'
      );

      expect(segment).toMatchObject({
        meetingId: 'meeting-123',
        speakerName: 'John Doe',
        text: 'Hello, this is a test',
        confidence: 0.95,
        chunkId: 'chunk-123',
      });

      expect(segment.timestampStart).toBeInstanceOf(Date);
      expect(segment.timestampEnd).toBeInstanceOf(Date);
      expect(mockedTranscriptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          meetingId: 'meeting-123',
          speakerName: 'John Doe',
          text: 'Hello, this is a test',
          confidence: expect.any(Decimal),
        })
      );
    });

    it('should use default speaker when not provided', async () => {
      const audioChunk = {
        chunkId: 'chunk-123',
        meetingId: 'meeting-123',
        timestamp: 1704105600,
        duration: 5,
      };

      mockedTranscriptionRepository.create.mockResolvedValue(mockTranscription as any);

      const segment = await service.processAudioChunk(
        audioChunk,
        'Hello, this is a test',
        0.95
      );

      expect(segment.speakerName).toBe('Unknown Speaker');
    });
  });

  describe('processAudioChunkBatch', () => {
    it('should process multiple audio chunks', async () => {
      const chunks = [
        {
          chunkId: 'chunk-1',
          meetingId: 'meeting-123',
          timestamp: 1704105600,
          duration: 5,
        },
        {
          chunkId: 'chunk-2',
          meetingId: 'meeting-123',
          timestamp: 1704105605,
          duration: 5,
        },
      ];

      const transcriptionSegments: TranscriptionSegment[] = [
        {
          speaker: 'John Doe',
          text: 'Hello',
          startTime: 0,
          endTime: 5,
          confidence: 0.95,
        },
        {
          speaker: 'Jane Smith',
          text: 'Hi there',
          startTime: 5,
          endTime: 10,
          confidence: 0.93,
        },
      ];

      mockedTranscriptionRepository.create.mockResolvedValue(mockTranscription as any);

      const processedSegments = await service.processAudioChunkBatch(
        chunks,
        transcriptionSegments
      );

      expect(processedSegments).toHaveLength(2);
      expect(processedSegments[0].speakerName).toBe('John Doe');
      expect(processedSegments[1].speakerName).toBe('Jane Smith');
      expect(mockedTranscriptionRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error when chunk count does not match segment count', async () => {
      const chunks = [
        {
          chunkId: 'chunk-1',
          meetingId: 'meeting-123',
          timestamp: 1704105600,
          duration: 5,
        },
      ];

      const transcriptionSegments: TranscriptionSegment[] = [
        {
          speaker: 'John Doe',
          text: 'Hello',
          startTime: 0,
          endTime: 5,
          confidence: 0.95,
        },
        {
          speaker: 'Jane Smith',
          text: 'Hi there',
          startTime: 5,
          endTime: 10,
          confidence: 0.93,
        },
      ];

      await expect(
        service.processAudioChunkBatch(chunks, transcriptionSegments)
      ).rejects.toThrow(AppError);
      await expect(
        service.processAudioChunkBatch(chunks, transcriptionSegments)
      ).rejects.toThrow('Chunk count must match transcription segment count');
    });
  });

  describe('processRealtimeTranscription', () => {
    it('should process real-time transcription from Recall AI', async () => {
      const transcriptionResponse: TranscriptionResponse = {
        botId: 'bot-123',
        meetingId: 'meeting-123',
        segments: [
          {
            speaker: 'John Doe',
            text: 'Hello everyone',
            startTime: 0,
            endTime: 3,
            confidence: 0.95,
          },
          {
            speaker: 'Jane Smith',
            text: 'Good morning',
            startTime: 3,
            endTime: 5,
            confidence: 0.93,
          },
        ],
        language: 'en',
        duration: 5,
      };

      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.ACTIVE,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 0,
        totalDuration: 0,
        speakers: [],
        averageConfidence: 0,
      };

      mockedCacheService.get.mockResolvedValue(cachedSession);
      mockedTranscriptionRepository.create.mockResolvedValue(mockTranscription as any);
      mockedCacheService.set.mockResolvedValue(true);

      await service.processRealtimeTranscription('meeting-123', transcriptionResponse);

      expect(mockedTranscriptionRepository.create).toHaveBeenCalledTimes(2);
      expect(mockedCacheService.set).toHaveBeenCalled();
    });

    it('should create session if not exists', async () => {
      const transcriptionResponse: TranscriptionResponse = {
        botId: 'bot-123',
        meetingId: 'meeting-123',
        segments: [
          {
            speaker: 'John Doe',
            text: 'Hello',
            startTime: 0,
            endTime: 2,
            confidence: 0.95,
          },
        ],
        duration: 2,
      };

      mockedCacheService.get.mockResolvedValue(null);
      mockedMeetingRepository.findById.mockResolvedValue(mockMeeting as any);
      mockedTranscriptionRepository.create.mockResolvedValue(mockTranscription as any);
      mockedCacheService.set.mockResolvedValue(true);

      await service.processRealtimeTranscription('meeting-123', transcriptionResponse);

      expect(mockedMeetingRepository.findById).toHaveBeenCalledWith('meeting-123');
      expect(mockedTranscriptionRepository.create).toHaveBeenCalled();
    });
  });

  describe('pauseSession', () => {
    it('should pause active session', async () => {
      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.ACTIVE,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 5,
        totalDuration: 120,
        speakers: [],
        averageConfidence: 0.92,
      };

      mockedCacheService.get.mockResolvedValue(cachedSession);
      mockedCacheService.set.mockResolvedValue(true);

      await service.pauseSession('session-123');

      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'transcription_session:session-123',
        expect.objectContaining({
          status: TranscriptionSessionStatus.PAUSED,
        }),
        3600
      );
    });

    it('should throw error when session not found', async () => {
      mockedCacheService.get.mockResolvedValue(null);

      await expect(service.pauseSession('session-123')).rejects.toThrow(AppError);
      await expect(service.pauseSession('session-123')).rejects.toThrow(
        'Transcription session not found'
      );
    });
  });

  describe('resumeSession', () => {
    it('should resume paused session', async () => {
      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.PAUSED,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 5,
        totalDuration: 120,
        speakers: [],
        averageConfidence: 0.92,
      };

      mockedCacheService.get.mockResolvedValue(cachedSession);
      mockedCacheService.set.mockResolvedValue(true);

      await service.resumeSession('session-123');

      expect(mockedCacheService.set).toHaveBeenCalledWith(
        'transcription_session:session-123',
        expect.objectContaining({
          status: TranscriptionSessionStatus.ACTIVE,
        }),
        3600
      );
    });

    it('should throw error when session is not paused', async () => {
      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.ACTIVE,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 5,
        totalDuration: 120,
        speakers: [],
        averageConfidence: 0.92,
      };

      mockedCacheService.get.mockResolvedValue(cachedSession);

      await expect(service.resumeSession('session-123')).rejects.toThrow(AppError);
      await expect(service.resumeSession('session-123')).rejects.toThrow(
        'Session is not paused'
      );
    });
  });

  describe('finalizeSession', () => {
    it('should finalize transcription session', async () => {
      const cachedSession = {
        meetingId: 'meeting-123',
        sessionId: 'session-123',
        status: TranscriptionSessionStatus.ACTIVE,
        startedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
        lastActivityAt: new Date().toISOString(),
        totalSegments: 10,
        totalDuration: 300,
        speakers: ['John Doe', 'Jane Smith'],
        averageConfidence: 0.92,
      };

      const transcriptions = [
        {
          ...mockTranscription,
          timestampStart: new Date('2024-01-01T10:00:00Z'),
          timestampEnd: new Date('2024-01-01T10:05:00Z'),
        },
      ];

      mockedCacheService.get.mockResolvedValue(cachedSession);
      mockedTranscriptionRepository.findByMeetingId.mockResolvedValue(transcriptions as any);
      mockedTranscriptionRepository.getUniqueSpeakers.mockResolvedValue([
        'John Doe',
        'Jane Smith',
      ]);
      mockedTranscriptionRepository.getAverageConfidence.mockResolvedValue(0.92);
      mockedTranscriptionRepository.getFullTranscript.mockResolvedValue(
        'John Doe: Hello\nJane Smith: Hi'
      );
      mockedMeetingRepository.findById.mockResolvedValue(mockMeeting as any);
      mockedMeetingRepository.update.mockResolvedValue(mockMeeting as any);
      mockedCacheService.set.mockResolvedValue(true);

      const result = await service.finalizeSession('session-123');

      expect(result).toMatchObject({
        meetingId: 'meeting-123',
        totalSegments: 1,
        speakers: ['John Doe', 'Jane Smith'],
        averageConfidence: 0.92,
        transcriptionText: 'John Doe: Hello\nJane Smith: Hi',
      });

      expect(result.metadata.completedAt).toBeInstanceOf(Date);
      expect(mockedMeetingRepository.update).toHaveBeenCalledWith(
        'meeting-123',
        expect.objectContaining({
          metadata: expect.objectContaining({
            transcription: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getTranscriptionByMeetingId', () => {
    it('should retrieve transcriptions for a meeting', async () => {
      const transcriptions = [mockTranscription, mockTranscription];

      mockedTranscriptionRepository.findByMeetingId.mockResolvedValue(transcriptions as any);

      const result = await service.getTranscriptionByMeetingId('meeting-123');

      expect(result).toHaveLength(2);
      expect(mockedTranscriptionRepository.findByMeetingId).toHaveBeenCalledWith('meeting-123');
    });
  });

  describe('getTranscriptionWithPagination', () => {
    it('should retrieve paginated transcriptions', async () => {
      const transcriptions = [mockTranscription];

      mockedTranscriptionRepository.findByMeetingId.mockResolvedValue(transcriptions as any);
      mockedTranscriptionRepository.countByMeetingId.mockResolvedValue(50);

      const result = await service.getTranscriptionWithPagination('meeting-123', {
        page: 2,
        limit: 10,
      });

      expect(result.transcriptions).toHaveLength(1);
      expect(result.total).toBe(50);
      expect(mockedTranscriptionRepository.findByMeetingId).toHaveBeenCalledWith(
        'meeting-123',
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should filter by speaker when provided', async () => {
      const transcriptions = [mockTranscription];

      mockedTranscriptionRepository.findBySpeaker.mockResolvedValue(transcriptions as any);
      mockedTranscriptionRepository.countByMeetingId.mockResolvedValue(5);

      const result = await service.getTranscriptionWithPagination('meeting-123', {
        page: 1,
        limit: 10,
        speaker: 'John Doe',
      });

      expect(result.transcriptions).toHaveLength(1);
      expect(mockedTranscriptionRepository.findBySpeaker).toHaveBeenCalledWith(
        'meeting-123',
        'John Doe',
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });
  });

  describe('deleteTranscription', () => {
    it('should delete transcription for authorized user', async () => {
      mockedMeetingRepository.findById.mockResolvedValue(mockMeeting as any);
      mockedTranscriptionRepository.deleteByMeetingId.mockResolvedValue({ count: 10 });

      await service.deleteTranscription('meeting-123', 'user-123');

      expect(mockedTranscriptionRepository.deleteByMeetingId).toHaveBeenCalledWith('meeting-123');
    });

    it('should throw error when meeting not found', async () => {
      mockedMeetingRepository.findById.mockResolvedValue(null);

      await expect(service.deleteTranscription('meeting-123', 'user-123')).rejects.toThrow(
        AppError
      );
      await expect(service.deleteTranscription('meeting-123', 'user-123')).rejects.toThrow(
        'Meeting not found'
      );
    });

    it('should throw error when user is not authorized', async () => {
      mockedMeetingRepository.findById.mockResolvedValue(mockMeeting as any);

      await expect(service.deleteTranscription('meeting-123', 'user-456')).rejects.toThrow(
        AppError
      );
      await expect(service.deleteTranscription('meeting-123', 'user-456')).rejects.toThrow(
        'Unauthorized to delete transcription'
      );
    });
  });
});
