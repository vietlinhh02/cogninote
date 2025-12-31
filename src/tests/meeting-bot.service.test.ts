import { MeetingBotService } from '../services/recall-ai/meeting-bot.service';
import { RecallAIService } from '../services/recall-ai/recall-ai.service';
import { meetingRepository } from '../repositories';
import {
  BotStatus,
  MeetingPlatform,
  DeployBotResponse,
  BotStatusResponse,
} from '../services/recall-ai/types/recall-ai.types';

jest.mock('../services/recall-ai/recall-ai.service');
jest.mock('../repositories');
jest.mock('../services/cache.service');

describe('MeetingBotService', () => {
  let service: MeetingBotService;
  let mockRecallService: jest.Mocked<RecallAIService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRecallService = {
      deployBot: jest.fn(),
      getBotStatus: jest.fn(),
      stopBot: jest.fn(),
      getRecordingDownload: jest.fn(),
      getTranscription: jest.fn(),
      isBotActive: jest.fn(),
    } as any;

    service = new MeetingBotService(mockRecallService);
  });

  describe('deployBotToMeeting', () => {
    const meetingId = 'meeting-123';
    const userId = 'user-123';

    const mockMeeting = {
      id: meetingId,
      userId,
      title: 'Test Meeting',
      meetingUrl: 'https://zoom.us/j/123456789',
      status: 'scheduled',
      metadata: {},
    };

    it('should successfully deploy bot to meeting', async () => {
      const mockBotResponse: DeployBotResponse = {
        botId: 'bot-123',
        status: BotStatus.JOINING,
        meetingUrl: mockMeeting.meetingUrl!,
        platform: MeetingPlatform.ZOOM,
        createdAt: '2024-01-01T00:00:00Z',
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(mockMeeting);
      mockRecallService.deployBot.mockResolvedValue(mockBotResponse);
      (meetingRepository.update as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await service.deployBotToMeeting(meetingId, userId);

      expect(result.botId).toBe('bot-123');
      expect(result.status).toBe(BotStatus.JOINING);
      expect(meetingRepository.findById).toHaveBeenCalledWith(meetingId);
      expect(mockRecallService.deployBot).toHaveBeenCalled();
      expect(meetingRepository.update).toHaveBeenCalledWith(
        meetingId,
        expect.objectContaining({
          metadata: expect.objectContaining({
            botId: 'bot-123',
          }),
        })
      );
    });

    it('should throw error if meeting not found', async () => {
      (meetingRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deployBotToMeeting(meetingId, userId)
      ).rejects.toThrow('Meeting not found');
    });

    it('should throw error if user unauthorized', async () => {
      (meetingRepository.findById as jest.Mock).mockResolvedValue({
        ...mockMeeting,
        userId: 'different-user',
      });

      await expect(
        service.deployBotToMeeting(meetingId, userId)
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error if meeting has no URL', async () => {
      (meetingRepository.findById as jest.Mock).mockResolvedValue({
        ...mockMeeting,
        meetingUrl: null,
      });

      await expect(
        service.deployBotToMeeting(meetingId, userId)
      ).rejects.toThrow('Meeting URL is required');
    });

    it('should detect Google Meet platform', async () => {
      const googleMeetMeeting = {
        ...mockMeeting,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      };

      const mockBotResponse: DeployBotResponse = {
        botId: 'bot-123',
        status: BotStatus.JOINING,
        meetingUrl: googleMeetMeeting.meetingUrl,
        platform: MeetingPlatform.GOOGLE_MEET,
        createdAt: '2024-01-01T00:00:00Z',
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(
        googleMeetMeeting
      );
      mockRecallService.deployBot.mockResolvedValue(mockBotResponse);
      (meetingRepository.update as jest.Mock).mockResolvedValue(
        googleMeetMeeting
      );

      const result = await service.deployBotToMeeting(meetingId, userId);

      expect(mockRecallService.deployBot).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: MeetingPlatform.GOOGLE_MEET,
        })
      );
    });
  });

  describe('stopBot', () => {
    it('should successfully stop a bot', async () => {
      const botId = 'bot-123';
      const userId = 'user-123';
      const mockMeeting = {
        id: 'meeting-123',
        userId,
        metadata: { botId },
      };

      (meetingRepository.findAll as jest.Mock).mockResolvedValue([
        mockMeeting,
      ]);
      mockRecallService.stopBot.mockResolvedValue(undefined);
      (meetingRepository.update as jest.Mock).mockResolvedValue(mockMeeting);

      await service.stopBot(botId, userId);

      expect(mockRecallService.stopBot).toHaveBeenCalledWith(botId);
      expect(meetingRepository.update).toHaveBeenCalledWith(
        mockMeeting.id,
        expect.objectContaining({
          metadata: expect.objectContaining({
            botStatus: BotStatus.LEAVING,
          }),
        })
      );
    });

    it('should throw error if meeting not found', async () => {
      const botId = 'bot-123';
      const userId = 'user-123';

      (meetingRepository.findAll as jest.Mock).mockResolvedValue([]);

      await expect(service.stopBot(botId, userId)).rejects.toThrow(
        'Meeting not found'
      );
    });

    it('should throw error if user unauthorized', async () => {
      const botId = 'bot-123';
      const userId = 'user-123';
      const mockMeeting = {
        id: 'meeting-123',
        userId: 'different-user',
        metadata: { botId },
      };

      (meetingRepository.findAll as jest.Mock).mockResolvedValue([
        mockMeeting,
      ]);

      await expect(service.stopBot(botId, userId)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('retrieveRecording', () => {
    it('should successfully retrieve recording', async () => {
      const meetingId = 'meeting-123';
      const userId = 'user-123';
      const botId = 'bot-123';

      const mockMeeting = {
        id: meetingId,
        userId,
        metadata: { botId },
      };

      const mockRecording = {
        audioUrl: 'https://example.com/audio.mp3',
        videoUrl: 'https://example.com/video.mp4',
        transcriptUrl: 'https://example.com/transcript.txt',
        expiresAt: '2024-01-02T00:00:00Z',
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(mockMeeting);
      mockRecallService.getRecordingDownload.mockResolvedValue(mockRecording);
      (meetingRepository.update as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await service.retrieveRecording(meetingId, userId);

      expect(result).toEqual(mockRecording);
      expect(mockRecallService.getRecordingDownload).toHaveBeenCalledWith(
        botId
      );
      expect(meetingRepository.update).toHaveBeenCalledWith(
        meetingId,
        expect.objectContaining({
          metadata: expect.objectContaining({
            recordingAudioUrl: mockRecording.audioUrl,
            recordingVideoUrl: mockRecording.videoUrl,
          }),
        })
      );
    });

    it('should throw error if no bot associated', async () => {
      const meetingId = 'meeting-123';
      const userId = 'user-123';

      const mockMeeting = {
        id: meetingId,
        userId,
        metadata: {},
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(mockMeeting);

      await expect(
        service.retrieveRecording(meetingId, userId)
      ).rejects.toThrow('No bot associated');
    });
  });

  describe('retrieveTranscription', () => {
    it('should successfully retrieve and store transcription', async () => {
      const meetingId = 'meeting-123';
      const userId = 'user-123';
      const botId = 'bot-123';

      const mockMeeting = {
        id: meetingId,
        userId,
        metadata: { botId },
      };

      const mockTranscription = {
        botId,
        meetingId,
        segments: [
          {
            speaker: 'John Doe',
            text: 'Hello everyone',
            startTime: 0,
            endTime: 2.5,
            confidence: 0.95,
          },
          {
            speaker: 'Jane Smith',
            text: 'Hi John',
            startTime: 3,
            endTime: 4,
            confidence: 0.98,
          },
        ],
        language: 'en',
        duration: 120,
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(mockMeeting);
      mockRecallService.getTranscription.mockResolvedValue(mockTranscription);
      (meetingRepository.createTranscription as jest.Mock).mockResolvedValue(
        {}
      );

      const result = await service.retrieveTranscription(meetingId, userId);

      expect(result).toEqual(mockTranscription);
      expect(mockRecallService.getTranscription).toHaveBeenCalledWith(botId);
      expect(meetingRepository.createTranscription).toHaveBeenCalledTimes(2);
    });
  });

  describe('syncBotStatus', () => {
    it('should sync bot status and update meeting', async () => {
      const meetingId = 'meeting-123';
      const botId = 'bot-123';

      const mockMeeting = {
        id: meetingId,
        userId: 'user-123',
        status: 'scheduled',
        metadata: { botId },
      };

      const mockBotStatus: BotStatusResponse = {
        botId,
        status: BotStatus.IN_MEETING,
        meetingUrl: 'https://zoom.us/j/123456789',
        platform: MeetingPlatform.ZOOM,
        joinedAt: '2024-01-01T00:00:00Z',
      };

      (meetingRepository.findById as jest.Mock).mockResolvedValue(mockMeeting);
      mockRecallService.getBotStatus.mockResolvedValue(mockBotStatus);
      (meetingRepository.update as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await service.syncBotStatus(meetingId);

      expect(result.status).toBe(BotStatus.IN_MEETING);
      expect(meetingRepository.update).toHaveBeenCalledWith(
        meetingId,
        expect.objectContaining({
          status: 'in_progress',
        })
      );
    });
  });

  describe('autoDeployForScheduledMeetings', () => {
    it('should auto-deploy bots for upcoming meetings', async () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 10 * 60 * 1000);

      const mockMeetings = [
        {
          id: 'meeting-1',
          userId: 'user-123',
          meetingUrl: 'https://zoom.us/j/111',
          scheduledAt: futureTime,
          status: 'scheduled',
          metadata: {},
        },
        {
          id: 'meeting-2',
          userId: 'user-456',
          meetingUrl: 'https://meet.google.com/abc',
          scheduledAt: futureTime,
          status: 'scheduled',
          metadata: {},
        },
      ];

      const mockBotResponse: DeployBotResponse = {
        botId: 'bot-123',
        status: BotStatus.JOINING,
        meetingUrl: '',
        platform: MeetingPlatform.ZOOM,
        createdAt: now.toISOString(),
      };

      (meetingRepository.findAll as jest.Mock).mockResolvedValue(mockMeetings);
      mockRecallService.deployBot.mockResolvedValue(mockBotResponse);
      (meetingRepository.update as jest.Mock).mockResolvedValue({});

      await service.autoDeployForScheduledMeetings();

      expect(mockRecallService.deployBot).toHaveBeenCalledTimes(2);
    });

    it('should skip meetings without URLs', async () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 10 * 60 * 1000);

      const mockMeetings = [
        {
          id: 'meeting-1',
          userId: 'user-123',
          meetingUrl: null,
          scheduledAt: futureTime,
          status: 'scheduled',
          metadata: {},
        },
      ];

      (meetingRepository.findAll as jest.Mock).mockResolvedValue(mockMeetings);

      await service.autoDeployForScheduledMeetings();

      expect(mockRecallService.deployBot).not.toHaveBeenCalled();
    });

    it('should skip meetings with existing bots', async () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 10 * 60 * 1000);

      const mockMeetings = [
        {
          id: 'meeting-1',
          userId: 'user-123',
          meetingUrl: 'https://zoom.us/j/111',
          scheduledAt: futureTime,
          status: 'scheduled',
          metadata: { botId: 'existing-bot' },
        },
      ];

      (meetingRepository.findAll as jest.Mock).mockResolvedValue(mockMeetings);

      await service.autoDeployForScheduledMeetings();

      expect(mockRecallService.deployBot).not.toHaveBeenCalled();
    });
  });
});
