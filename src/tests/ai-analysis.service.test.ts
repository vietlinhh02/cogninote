import { AIAnalysisService } from '../services/ai/ai-analysis.service';
import {
  AnalysisType,
  SentimentType,
} from '../services/ai/types/analysis.types';
import { transcriptionRepository } from '../repositories/transcription.repository';
import { analysisResultRepository } from '../repositories/analysis-result.repository';
import { aiService } from '../services/ai/ai.service';
import { AIProvider } from '../services/ai/types/ai.types';

// Mock dependencies
jest.mock('../repositories/transcription.repository');
jest.mock('../repositories/analysis-result.repository');
jest.mock('../services/ai/ai.service');
jest.mock('../utils/logger');

describe('AIAnalysisService', () => {
  let service: AIAnalysisService;

  const mockMeetingId = 'test-meeting-123';
  const mockTranscriptions = [
    {
      id: '1',
      meetingId: mockMeetingId,
      speakerName: 'Alice',
      text: 'I think we should proceed with the new feature.',
      timestampStart: new Date('2025-01-01T10:00:00Z'),
      timestampEnd: new Date('2025-01-01T10:00:05Z'),
      confidence: 0.95,
      createdAt: new Date(),
    },
    {
      id: '2',
      meetingId: mockMeetingId,
      speakerName: 'Bob',
      text: 'I agree. Let\'s schedule a follow-up meeting for next week.',
      timestampStart: new Date('2025-01-01T10:00:05Z'),
      timestampEnd: new Date('2025-01-01T10:00:10Z'),
      confidence: 0.92,
      createdAt: new Date(),
    },
    {
      id: '3',
      meetingId: mockMeetingId,
      speakerName: 'Charlie',
      text: 'Sounds good. I will prepare the documentation.',
      timestampStart: new Date('2025-01-01T10:00:10Z'),
      timestampEnd: new Date('2025-01-01T10:00:15Z'),
      confidence: 0.88,
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    service = new AIAnalysisService();
    jest.clearAllMocks();
  });

  describe('analyzeMeetingContent', () => {
    it('should analyze meeting content successfully', async () => {
      // Arrange
      const mockAIResponse = {
        content: JSON.stringify({
          sentiment: {
            sentiment: 'positive',
            confidence: { value: 0.85, level: 'high' },
            reasoning: 'The conversation shows agreement and forward momentum',
            emotionalTone: { positive: 0.7, neutral: 0.25, negative: 0.05 },
          },
          insights: [
            {
              category: 'decision',
              insight: 'Team agreed to proceed with the new feature',
              confidence: { value: 0.9, level: 'high' },
              relatedSpeakers: ['Alice', 'Bob'],
            },
            {
              category: 'action',
              insight: 'Follow-up meeting scheduled for next week',
              confidence: { value: 0.85, level: 'high' },
              relatedSpeakers: ['Bob'],
            },
          ],
          topics: [
            {
              name: 'New Feature Development',
              keywords: ['feature', 'proceed', 'development'],
              frequency: 2,
              relevance: 0.9,
              confidence: { value: 0.88, level: 'high' },
            },
          ],
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.analyzeMeetingContent(mockMeetingId);

      // Assert
      expect(result).toBeDefined();
      expect(result.meetingId).toBe(mockMeetingId);
      expect(result.analysisType).toBe(AnalysisType.CONTENT_ANALYSIS);
      expect(result.sentiment.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.insights).toHaveLength(2);
      expect(result.topics).toHaveLength(1);
      expect(result.confidence.value).toBeGreaterThan(0);
      expect(result.metadata.transcriptionSegments).toBe(3);

      // Verify service calls
      expect(transcriptionRepository.findByMeetingId).toHaveBeenCalledWith(mockMeetingId);
      expect(aiService.chat).toHaveBeenCalled();
      expect(analysisResultRepository.upsert).toHaveBeenCalled();
    });

    it('should throw error when no transcriptions found', async () => {
      // Arrange
      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue([]);

      // Act & Assert
      await expect(service.analyzeMeetingContent(mockMeetingId)).rejects.toThrow(
        'No transcriptions found for meeting'
      );
    });

    it('should include custom instructions in prompt', async () => {
      // Arrange
      const customInstructions = 'Focus on technical decisions';
      const mockAIResponse = {
        content: JSON.stringify({
          sentiment: { sentiment: 'neutral', confidence: 0.7, reasoning: '', emotionalTone: {} },
          insights: [],
          topics: [],
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      await service.analyzeMeetingContent(mockMeetingId, { customInstructions });

      // Assert
      const chatCall = (aiService.chat as jest.Mock).mock.calls[0];
      expect(chatCall[0].messages[1].content).toContain(customInstructions);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment successfully', async () => {
      // Arrange
      const mockAIResponse = {
        content: JSON.stringify({
          sentiment: 'positive',
          confidence: { value: 0.9, level: 'high' },
          reasoning: 'Collaborative and constructive discussion',
          emotionalTone: { positive: 0.75, neutral: 0.2, negative: 0.05 },
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.analyzeSentiment(mockMeetingId);

      // Assert
      expect(result).toBeDefined();
      expect(result.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.confidence.value).toBe(0.9);
      expect(result.confidence.level).toBe('high');
      expect(result.reasoning).toBeTruthy();
      expect(result.emotionalTone.positive).toBe(0.75);
    });

    it('should normalize confidence scores', async () => {
      // Arrange
      const mockAIResponse = {
        content: JSON.stringify({
          sentiment: 'neutral',
          confidence: 0.45,
          reasoning: 'Mixed signals',
          emotionalTone: { positive: 0.33, neutral: 0.34, negative: 0.33 },
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.analyzeSentiment(mockMeetingId);

      // Assert
      expect(result.confidence.value).toBe(0.45);
      expect(result.confidence.level).toBe('low');
    });
  });

  describe('extractInsights', () => {
    it('should extract insights successfully', async () => {
      // Arrange
      const mockAIResponse = {
        content: JSON.stringify([
          {
            category: 'decision',
            insight: 'Agreed to proceed with new feature',
            confidence: { value: 0.92, level: 'high' },
            relatedSpeakers: ['Alice', 'Bob'],
          },
          {
            category: 'action',
            insight: 'Documentation will be prepared',
            confidence: { value: 0.88, level: 'high' },
            relatedSpeakers: ['Charlie'],
          },
        ]),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);

      // Act
      const result = await service.extractInsights(mockMeetingId, 10);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('decision');
      expect(result[0].insight).toBeTruthy();
      expect(result[0].confidence.value).toBeGreaterThan(0);
      expect(result[0].relatedSpeakers).toContain('Alice');
    });

    it('should limit insights to maxInsights parameter', async () => {
      // Arrange
      const mockInsights = Array.from({ length: 15 }, (_, i) => ({
        category: 'general',
        insight: `Insight ${i + 1}`,
        confidence: { value: 0.8, level: 'high' },
        relatedSpeakers: ['Speaker'],
      }));

      const mockAIResponse = {
        content: JSON.stringify(mockInsights),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);

      // Act
      await service.extractInsights(mockMeetingId, 5);

      // Assert
      const chatCall = (aiService.chat as jest.Mock).mock.calls[0];
      expect(chatCall[0].messages[1].content).toContain('top 5');
    });
  });

  describe('generateMeetingSummary', () => {
    it('should generate comprehensive meeting summary', async () => {
      // Arrange
      const mockSummaryResponse = {
        content: JSON.stringify({
          title: 'Feature Planning Discussion',
          executiveSummary: 'Team agreed to proceed with new feature development.',
          detailedSummary:
            'The team discussed the new feature proposal and unanimously agreed to proceed. Bob will schedule a follow-up meeting for next week, and Charlie will prepare the documentation.',
          keyPoints: [
            'New feature approved',
            'Follow-up meeting scheduled',
            'Documentation to be prepared',
          ],
          actionItems: [
            {
              description: 'Schedule follow-up meeting',
              assignedTo: ['Bob'],
              priority: 'high',
              confidence: { value: 0.9, level: 'high' },
              context: 'For next week',
            },
            {
              description: 'Prepare documentation',
              assignedTo: ['Charlie'],
              priority: 'medium',
              confidence: { value: 0.85, level: 'high' },
              context: 'For the new feature',
            },
          ],
          decisions: ['Proceed with new feature development'],
          sentiment: {
            sentiment: 'positive',
            confidence: { value: 0.88, level: 'high' },
            reasoning: 'Collaborative and constructive',
            emotionalTone: { positive: 0.7, neutral: 0.25, negative: 0.05 },
          },
          topics: [
            {
              name: 'Feature Development',
              keywords: ['feature', 'development'],
              frequency: 2,
              relevance: 0.9,
              confidence: { value: 0.85, level: 'high' },
            },
          ],
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      const mockContributionsResponse = {
        content: JSON.stringify({
          contributions: ['Proposed proceeding with the feature'],
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (transcriptionRepository.getUniqueSpeakers as jest.Mock).mockResolvedValue([
        'Alice',
        'Bob',
        'Charlie',
      ]);
      (aiService.chat as jest.Mock)
        .mockResolvedValueOnce(mockContributionsResponse) // Alice
        .mockResolvedValueOnce(mockContributionsResponse) // Bob
        .mockResolvedValueOnce(mockContributionsResponse) // Charlie
        .mockResolvedValueOnce(mockSummaryResponse); // Summary
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.generateMeetingSummary(mockMeetingId);

      // Assert
      expect(result).toBeDefined();
      expect(result.meetingId).toBe(mockMeetingId);
      expect(result.title).toBe('Feature Planning Discussion');
      expect(result.executiveSummary).toBeTruthy();
      expect(result.detailedSummary).toBeTruthy();
      expect(result.keyPoints).toHaveLength(3);
      expect(result.actionItems).toHaveLength(2);
      expect(result.decisions).toHaveLength(1);
      expect(result.speakerMetrics).toHaveLength(3);
      expect(result.sentiment.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.topics).toHaveLength(1);
      expect(result.confidence.value).toBeGreaterThan(0);
      expect(result.metadata.participantCount).toBe(3);
    });

    it('should calculate speaker metrics correctly', async () => {
      // Arrange
      const mockSummaryResponse = {
        content: JSON.stringify({
          title: 'Test Meeting',
          executiveSummary: 'Summary',
          detailedSummary: 'Detailed summary',
          keyPoints: [],
          actionItems: [],
          decisions: [],
          sentiment: {
            sentiment: 'neutral',
            confidence: 0.7,
            reasoning: '',
            emotionalTone: { positive: 0.33, neutral: 0.34, negative: 0.33 },
          },
          topics: [],
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      const mockContributionsResponse = {
        content: JSON.stringify({ contributions: ['Test contribution'] }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (transcriptionRepository.getUniqueSpeakers as jest.Mock).mockResolvedValue([
        'Alice',
        'Bob',
        'Charlie',
      ]);
      (aiService.chat as jest.Mock)
        .mockResolvedValueOnce(mockContributionsResponse)
        .mockResolvedValueOnce(mockContributionsResponse)
        .mockResolvedValueOnce(mockContributionsResponse)
        .mockResolvedValueOnce(mockSummaryResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.generateMeetingSummary(mockMeetingId);

      // Assert
      const aliceMetrics = result.speakerMetrics.find((m) => m.speakerName === 'Alice');
      expect(aliceMetrics).toBeDefined();
      expect(aliceMetrics!.totalWords).toBeGreaterThan(0);
      expect(aliceMetrics!.speakingTime).toBeGreaterThan(0);
      expect(aliceMetrics!.speakingPercentage).toBeGreaterThan(0);
      expect(aliceMetrics!.averageConfidence).toBeCloseTo(0.95, 2);
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      // Arrange
      const invalidJSONResponse = {
        content: 'This is not valid JSON',
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(invalidJSONResponse);

      // Act & Assert
      await expect(service.analyzeSentiment(mockMeetingId)).rejects.toThrow(
        'Failed to parse AI response'
      );
    });

    it('should extract JSON from markdown code blocks', async () => {
      // Arrange
      const markdownResponse = {
        content: '```json\n{"sentiment": "positive", "confidence": 0.9, "reasoning": "test", "emotionalTone": {"positive": 0.7, "neutral": 0.2, "negative": 0.1}}\n```',
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(markdownResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.analyzeSentiment(mockMeetingId);

      // Assert
      expect(result.sentiment).toBe(SentimentType.POSITIVE);
      expect(result.confidence.value).toBe(0.9);
    });
  });

  describe('Confidence score normalization', () => {
    it('should normalize confidence values to 0-1 range', async () => {
      // Arrange
      const mockAIResponse = {
        content: JSON.stringify({
          sentiment: 'positive',
          confidence: 1.5, // Invalid value > 1
          reasoning: 'Test',
          emotionalTone: { positive: 0.7, neutral: 0.2, negative: 0.1 },
        }),
        provider: AIProvider.GEMINI,
        model: 'gemini-1.5-pro',
      };

      (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
        mockTranscriptions
      );
      (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
      (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.analyzeSentiment(mockMeetingId);

      // Assert
      expect(result.confidence.value).toBeLessThanOrEqual(1);
      expect(result.confidence.value).toBeGreaterThanOrEqual(0);
    });

    it('should categorize confidence levels correctly', async () => {
      // Arrange
      const testCases = [
        { value: 0.3, expectedLevel: 'low' },
        { value: 0.65, expectedLevel: 'medium' },
        { value: 0.9, expectedLevel: 'high' },
      ];

      for (const testCase of testCases) {
        const mockAIResponse = {
          content: JSON.stringify({
            sentiment: 'neutral',
            confidence: testCase.value,
            reasoning: 'Test',
            emotionalTone: { positive: 0.33, neutral: 0.34, negative: 0.33 },
          }),
          provider: AIProvider.GEMINI,
          model: 'gemini-1.5-pro',
        };

        (transcriptionRepository.findByMeetingId as jest.Mock).mockResolvedValue(
          mockTranscriptions
        );
        (aiService.chat as jest.Mock).mockResolvedValue(mockAIResponse);
        (analysisResultRepository.upsert as jest.Mock).mockResolvedValue({});

        // Act
        const result = await service.analyzeSentiment(mockMeetingId);

        // Assert
        expect(result.confidence.level).toBe(testCase.expectedLevel);
      }
    });
  });
});
