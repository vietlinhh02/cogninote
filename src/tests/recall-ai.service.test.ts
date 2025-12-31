import { RecallAIService } from '../services/recall-ai/recall-ai.service';
import {
  DeployBotRequest,
  BotStatus,
  MeetingPlatform,
  RecallAIConfig,
} from '../services/recall-ai/types/recall-ai.types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RecallAIService', () => {
  let service: RecallAIService;
  const mockConfig: RecallAIConfig = {
    apiKey: 'test-api-key',
    endpoint: 'https://api.recall.ai/v1',
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const mockCreate = jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
    }));

    mockedAxios.create = mockCreate as any;
    service = new RecallAIService(mockConfig);
  });

  describe('deployBot', () => {
    it('should successfully deploy a bot', async () => {
      const request: DeployBotRequest = {
        meetingId: 'meeting-123',
        meetingUrl: 'https://zoom.us/j/123456789',
        platform: MeetingPlatform.ZOOM,
        botName: 'Test Bot',
      };

      const mockResponse = {
        data: {
          id: 'bot-123',
          status: 'joining',
          meeting_url: request.meetingUrl,
          platform: 'zoom',
          created_at: '2024-01-01T00:00:00Z',
        },
      };

      const mockClient = service['client'] as any;
      mockClient.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.deployBot(request);

      expect(result).toEqual({
        botId: 'bot-123',
        status: BotStatus.JOINING,
        meetingUrl: request.meetingUrl,
        platform: MeetingPlatform.ZOOM,
        createdAt: '2024-01-01T00:00:00Z',
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/bots',
        expect.objectContaining({
          meeting_url: request.meetingUrl,
          platform: request.platform,
          bot_name: request.botName,
        })
      );
    });

    it('should throw error on deployment failure', async () => {
      const request: DeployBotRequest = {
        meetingId: 'meeting-123',
        meetingUrl: 'https://zoom.us/j/123456789',
        platform: MeetingPlatform.ZOOM,
      };

      const mockClient = service['client'] as any;
      mockClient.post = jest.fn().mockRejectedValue({
        response: {
          status: 400,
          data: {
            error: {
              code: 'invalid_url',
              message: 'Invalid meeting URL',
            },
          },
        },
      });

      await expect(service.deployBot(request)).rejects.toThrow();
    });
  });

  describe('getBotStatus', () => {
    it('should successfully get bot status', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          id: botId,
          status: 'in_meeting',
          meeting_url: 'https://zoom.us/j/123456789',
          platform: 'zoom',
          joined_at: '2024-01-01T00:00:00Z',
          participants: [
            {
              id: 'p1',
              name: 'John Doe',
              joined_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.getBotStatus(botId);

      expect(result.botId).toBe(botId);
      expect(result.status).toBe(BotStatus.IN_MEETING);
      expect(result.participants).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith(`/bots/${botId}`);
    });
  });

  describe('stopBot', () => {
    it('should successfully stop a bot', async () => {
      const botId = 'bot-123';

      const mockClient = service['client'] as any;
      mockClient.post = jest.fn().mockResolvedValue({ data: {} });

      await service.stopBot(botId);

      expect(mockClient.post).toHaveBeenCalledWith(`/bots/${botId}/leave`);
    });
  });

  describe('getRecordingDownload', () => {
    it('should successfully get recording download URLs', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          audio_url: 'https://example.com/audio.mp3',
          video_url: 'https://example.com/video.mp4',
          transcript_url: 'https://example.com/transcript.txt',
          expires_at: '2024-01-02T00:00:00Z',
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.getRecordingDownload(botId);

      expect(result.audioUrl).toBe(mockResponse.data.audio_url);
      expect(result.videoUrl).toBe(mockResponse.data.video_url);
      expect(result.transcriptUrl).toBe(mockResponse.data.transcript_url);
      expect(result.expiresAt).toBe(mockResponse.data.expires_at);
    });
  });

  describe('getTranscription', () => {
    it('should successfully get transcription', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          metadata: {
            meeting_id: 'meeting-123',
          },
          segments: [
            {
              speaker: 'John Doe',
              text: 'Hello everyone',
              start_time: 0,
              end_time: 2.5,
              confidence: 0.95,
            },
            {
              speaker: 'Jane Smith',
              text: 'Hi John',
              start_time: 3,
              end_time: 4,
              confidence: 0.98,
            },
          ],
          language: 'en',
          duration: 120,
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.getTranscription(botId);

      expect(result.botId).toBe(botId);
      expect(result.meetingId).toBe('meeting-123');
      expect(result.segments).toHaveLength(2);
      expect(result.segments[0].speaker).toBe('John Doe');
      expect(result.segments[0].text).toBe('Hello everyone');
      expect(result.duration).toBe(120);
    });
  });

  describe('isBotActive', () => {
    it('should return true for active bot', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          id: botId,
          status: 'recording',
          meeting_url: 'https://zoom.us/j/123456789',
          platform: 'zoom',
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.isBotActive(botId);

      expect(result).toBe(true);
    });

    it('should return false for completed bot', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          id: botId,
          status: 'completed',
          meeting_url: 'https://zoom.us/j/123456789',
          platform: 'zoom',
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.isBotActive(botId);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const botId = 'bot-123';

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.isBotActive(botId);

      expect(result).toBe(false);
    });
  });

  describe('retry logic', () => {
    it('should retry on rate limit error', async () => {
      const botId = 'bot-123';
      const mockResponse = {
        data: {
          id: botId,
          status: 'in_meeting',
          meeting_url: 'https://zoom.us/j/123456789',
          platform: 'zoom',
        },
      };

      const mockClient = service['client'] as any;
      mockClient.get = jest
        .fn()
        .mockRejectedValueOnce({
          response: { status: 429 },
          isAxiosError: true,
        })
        .mockResolvedValueOnce(mockResponse);

      const result = await service.getBotStatus(botId);

      expect(result.botId).toBe(botId);
      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 error', async () => {
      const botId = 'bot-123';

      const mockClient = service['client'] as any;
      mockClient.get = jest.fn().mockRejectedValue({
        response: { status: 400 },
        isAxiosError: true,
      });

      await expect(service.getBotStatus(botId)).rejects.toThrow();
      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });
  });
});
