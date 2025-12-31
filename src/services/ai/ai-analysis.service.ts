import { aiService } from './ai.service.js';
import { transcriptionRepository } from '../../repositories/transcription.repository.js';
import { analysisResultRepository } from '../../repositories/analysis-result.repository.js';
import { AIProvider, AIMessageRole } from './types/ai.types.js';
import {
  AnalysisType,
  SentimentType,
  ContentAnalysisResult,
  MeetingSummary,
  SentimentAnalysis,
  MeetingInsight,
  SpeakerMetrics,
  ConfidenceScore,
  AnalysisOptions,
} from './types/analysis.types.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middlewares/error-handler.js';

/**
 * AI Analysis Service
 * Handles meeting content analysis, sentiment analysis, and summary generation using Gemini AI
 */
export class AIAnalysisService {
  private readonly DEFAULT_MODEL = 'gemini-1.5-pro';
  private readonly DEFAULT_TEMPERATURE = 0.3; // Lower for more consistent structured output

  /**
   * Analyze meeting content comprehensively
   */
  async analyzeMeetingContent(
    meetingId: string,
    options?: Partial<AnalysisOptions>
  ): Promise<ContentAnalysisResult> {
    logger.info('Starting meeting content analysis', { meetingId });

    // Fetch transcriptions
    const transcriptions = await transcriptionRepository.findByMeetingId(meetingId);

    if (!transcriptions || transcriptions.length === 0) {
      throw new AppError('No transcriptions found for meeting', 404);
    }

    // Build conversation text
    const conversationText = this.buildConversationText(transcriptions);

    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(transcriptions);

    // Perform analysis using Gemini
    const analysisPrompt = this.buildContentAnalysisPrompt(
      conversationText,
      options?.customInstructions
    );

    const response = await aiService.chat(
      {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: this.getSystemPromptForContentAnalysis(),
          },
          {
            role: AIMessageRole.USER,
            content: analysisPrompt,
          },
        ],
        options: {
          model: this.DEFAULT_MODEL,
          temperature: this.DEFAULT_TEMPERATURE,
          maxTokens: 4000,
        },
      },
      AIProvider.GEMINI
    );

    // Parse structured output
    const analysisData = this.parseContentAnalysisResponse(response.content);

    // Build confidence score
    const overallConfidence = this.calculateOverallConfidence(analysisData);

    const result: ContentAnalysisResult = {
      meetingId,
      analysisType: AnalysisType.CONTENT_ANALYSIS,
      sentiment: analysisData.sentiment,
      insights: analysisData.insights,
      topics: analysisData.topics,
      confidence: overallConfidence,
      metadata: {
        analyzedAt: new Date(),
        transcriptionSegments: transcriptions.length,
        totalDuration,
        modelUsed: response.model,
      },
    };

    // Store analysis result
    await this.storeAnalysisResult(result);

    logger.info('Meeting content analysis completed', {
      meetingId,
      insightCount: result.insights.length,
      topicCount: result.topics.length,
    });

    return result;
  }

  /**
   * Perform sentiment analysis on meeting
   */
  async analyzeSentiment(meetingId: string): Promise<SentimentAnalysis> {
    logger.info('Starting sentiment analysis', { meetingId });

    const transcriptions = await transcriptionRepository.findByMeetingId(meetingId);

    if (!transcriptions || transcriptions.length === 0) {
      throw new AppError('No transcriptions found for meeting', 404);
    }

    const conversationText = this.buildConversationText(transcriptions);

    const sentimentPrompt = this.buildSentimentAnalysisPrompt(conversationText);

    const response = await aiService.chat(
      {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: this.getSystemPromptForSentimentAnalysis(),
          },
          {
            role: AIMessageRole.USER,
            content: sentimentPrompt,
          },
        ],
        options: {
          model: this.DEFAULT_MODEL,
          temperature: this.DEFAULT_TEMPERATURE,
          maxTokens: 1000,
        },
      },
      AIProvider.GEMINI
    );

    const sentiment = this.parseSentimentAnalysisResponse(response.content);

    // Store sentiment analysis
    await analysisResultRepository.upsert(meetingId, AnalysisType.SENTIMENT_ANALYSIS, {
      sentiment: sentiment.sentiment,
      metadata: {
        confidence: sentiment.confidence,
        emotionalTone: sentiment.emotionalTone,
        reasoning: sentiment.reasoning,
        analyzedAt: new Date(),
      },
    });

    logger.info('Sentiment analysis completed', {
      meetingId,
      sentiment: sentiment.sentiment,
      confidence: sentiment.confidence.value,
    });

    return sentiment;
  }

  /**
   * Extract insights from meeting
   */
  async extractInsights(
    meetingId: string,
    maxInsights: number = 10
  ): Promise<MeetingInsight[]> {
    logger.info('Extracting meeting insights', { meetingId, maxInsights });

    const transcriptions = await transcriptionRepository.findByMeetingId(meetingId);

    if (!transcriptions || transcriptions.length === 0) {
      throw new AppError('No transcriptions found for meeting', 404);
    }

    const conversationText = this.buildConversationText(transcriptions);

    const insightsPrompt = this.buildInsightsExtractionPrompt(conversationText, maxInsights);

    const response = await aiService.chat(
      {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: this.getSystemPromptForInsightExtraction(),
          },
          {
            role: AIMessageRole.USER,
            content: insightsPrompt,
          },
        ],
        options: {
          model: this.DEFAULT_MODEL,
          temperature: this.DEFAULT_TEMPERATURE,
          maxTokens: 3000,
        },
      },
      AIProvider.GEMINI
    );

    const insights = this.parseInsightsResponse(response.content);

    logger.info('Insights extraction completed', {
      meetingId,
      insightCount: insights.length,
    });

    return insights;
  }

  /**
   * Generate comprehensive meeting summary
   */
  async generateMeetingSummary(
    meetingId: string,
    options?: Partial<AnalysisOptions>
  ): Promise<MeetingSummary> {
    logger.info('Generating meeting summary', { meetingId });

    const transcriptions = await transcriptionRepository.findByMeetingId(meetingId);

    if (!transcriptions || transcriptions.length === 0) {
      throw new AppError('No transcriptions found for meeting', 404);
    }

    const conversationText = this.buildConversationText(transcriptions);
    const speakers = await transcriptionRepository.getUniqueSpeakers(meetingId);
    const totalDuration = this.calculateTotalDuration(transcriptions);

    // Generate speaker metrics
    const speakerMetrics = await this.generateSpeakerMetrics(meetingId, transcriptions);

    // Build summary prompt
    const summaryPrompt = this.buildSummaryPrompt(
      conversationText,
      speakers.length,
      totalDuration,
      options?.customInstructions
    );

    const response = await aiService.chat(
      {
        messages: [
          {
            role: AIMessageRole.SYSTEM,
            content: this.getSystemPromptForSummaryGeneration(),
          },
          {
            role: AIMessageRole.USER,
            content: summaryPrompt,
          },
        ],
        options: {
          model: this.DEFAULT_MODEL,
          temperature: this.DEFAULT_TEMPERATURE,
          maxTokens: 5000,
        },
      },
      AIProvider.GEMINI
    );

    const summaryData = this.parseSummaryResponse(response.content);

    const summary: MeetingSummary = {
      meetingId,
      ...summaryData,
      speakerMetrics,
      confidence: this.calculateOverallConfidence(summaryData),
      metadata: {
        generatedAt: new Date(),
        duration: totalDuration,
        participantCount: speakers.length,
        modelUsed: response.model,
      },
    };

    // Store summary
    await this.storeMeetingSummary(summary);

    logger.info('Meeting summary generated', {
      meetingId,
      keyPoints: summary.keyPoints.length,
      actionItems: summary.actionItems.length,
    });

    return summary;
  }

  /**
   * Generate speaker metrics
   */
  private async generateSpeakerMetrics(
    meetingId: string,
    transcriptions: any[]
  ): Promise<SpeakerMetrics[]> {
    const speakers = await transcriptionRepository.getUniqueSpeakers(meetingId);
    const metrics: SpeakerMetrics[] = [];

    for (const speaker of speakers) {
      const speakerTranscriptions = transcriptions.filter(
        (t) => t.speakerName === speaker
      );

      const totalWords = speakerTranscriptions.reduce(
        (sum, t) => sum + t.text.split(/\s+/).length,
        0
      );

      const speakingTime = speakerTranscriptions.reduce((sum, t) => {
        if (t.timestampStart && t.timestampEnd) {
          return (
            sum +
            (t.timestampEnd.getTime() - t.timestampStart.getTime()) / 1000
          );
        }
        return sum;
      }, 0);

      const averageConfidence =
        speakerTranscriptions.reduce(
          (sum, t) => sum + (Number(t.confidence) || 0),
          0
        ) / speakerTranscriptions.length;

      // Calculate speaking percentage
      const totalDuration = this.calculateTotalDuration(transcriptions);
      const speakingPercentage = (speakingTime / totalDuration) * 100;

      // Get speaker contributions using AI
      const conversationText = speakerTranscriptions
        .map((t) => t.text)
        .join(' ');

      const contributionsPrompt = `Analyze the following statements from ${speaker} and extract their top 3 key contributions:\n\n${conversationText}\n\nProvide a JSON response with an array of key contributions.`;

      let keyContributions: string[] = [];
      try {
        const response = await aiService.chat(
          {
            messages: [
              {
                role: AIMessageRole.USER,
                content: contributionsPrompt,
              },
            ],
            options: {
              model: this.DEFAULT_MODEL,
              temperature: 0.3,
              maxTokens: 500,
            },
          },
          AIProvider.GEMINI
        );

        const parsed = this.parseJSONResponse(response.content);
        keyContributions = parsed.contributions || [];
      } catch (error) {
        logger.warn('Failed to extract speaker contributions', {
          speaker,
          error,
        });
        keyContributions = ['Unable to extract contributions'];
      }

      metrics.push({
        speakerName: speaker,
        totalWords,
        speakingTime,
        speakingPercentage: Math.round(speakingPercentage * 100) / 100,
        averageConfidence,
        sentimentDistribution: {
          positive: 0.33,
          neutral: 0.34,
          negative: 0.33,
        },
        keyContributions,
      });
    }

    return metrics;
  }

  /**
   * Build conversation text from transcriptions
   */
  private buildConversationText(transcriptions: any[]): string {
    return transcriptions
      .map((t) => `${t.speakerName || 'Unknown'}: ${t.text}`)
      .join('\n');
  }

  /**
   * Calculate total duration from transcriptions
   */
  private calculateTotalDuration(transcriptions: any[]): number {
    if (transcriptions.length === 0) return 0;

    const firstSegment = transcriptions[0];
    const lastSegment = transcriptions[transcriptions.length - 1];

    if (
      !firstSegment.timestampStart ||
      !lastSegment.timestampEnd
    ) {
      return 0;
    }

    return (
      (lastSegment.timestampEnd.getTime() -
        firstSegment.timestampStart.getTime()) /
      1000
    );
  }

  /**
   * System prompts for different analysis types
   */
  private getSystemPromptForContentAnalysis(): string {
    return `You are an expert meeting analyst. Your task is to analyze meeting transcriptions and provide comprehensive insights.

You must respond with a valid JSON object containing:
- sentiment: object with sentiment (positive/neutral/negative/mixed), confidence (0-1), reasoning, and emotionalTone distribution
- insights: array of key insights with category, insight text, confidence, and related speakers
- topics: array of detected topics with name, keywords, frequency, relevance, and confidence

Focus on extracting actionable insights, identifying key themes, and providing accurate confidence scores.`;
  }

  private getSystemPromptForSentimentAnalysis(): string {
    return `You are an expert in sentiment analysis. Analyze the meeting conversation and determine the overall sentiment.

Respond with a valid JSON object containing:
- sentiment: "positive", "neutral", "negative", or "mixed"
- confidence: object with value (0-1) and level ("low", "medium", "high")
- reasoning: brief explanation of the sentiment classification
- emotionalTone: object with positive, neutral, and negative scores (0-1) that sum to 1.0

Be precise and provide well-calibrated confidence scores.`;
  }

  private getSystemPromptForInsightExtraction(): string {
    return `You are an expert at extracting key insights from meetings. Focus on identifying important decisions, agreements, concerns, and notable points.

Respond with a valid JSON array of insights, each containing:
- category: the type of insight (decision, agreement, concern, action, discussion)
- insight: the actual insight text
- confidence: object with value (0-1) and level
- relatedSpeakers: array of speaker names who contributed to this insight

Extract only the most significant and actionable insights.`;
  }

  private getSystemPromptForSummaryGeneration(): string {
    return `You are an expert meeting summarizer. Create comprehensive, well-structured meeting summaries.

Respond with a valid JSON object containing:
- title: concise meeting title
- executiveSummary: 2-3 sentence high-level summary
- detailedSummary: comprehensive paragraph summarizing the meeting
- keyPoints: array of important discussion points
- actionItems: array with description, assignedTo, priority, confidence, and context
- decisions: array of decisions made
- sentiment: sentiment analysis object
- topics: array of main topics discussed

Be concise, accurate, and focus on actionable information.`;
  }

  /**
   * Prompt builders
   */
  private buildContentAnalysisPrompt(
    conversationText: string,
    customInstructions?: string
  ): string {
    let prompt = `Analyze the following meeting conversation and provide comprehensive insights:\n\n${conversationText}\n\n`;

    if (customInstructions) {
      prompt += `Additional instructions: ${customInstructions}\n\n`;
    }

    prompt += `Provide your analysis as a JSON object with sentiment, insights, and topics.`;

    return prompt;
  }

  private buildSentimentAnalysisPrompt(conversationText: string): string {
    return `Analyze the sentiment of this meeting conversation:\n\n${conversationText}\n\nProvide a JSON response with sentiment classification and confidence scores.`;
  }

  private buildInsightsExtractionPrompt(
    conversationText: string,
    maxInsights: number
  ): string {
    return `Extract the top ${maxInsights} most important insights from this meeting:\n\n${conversationText}\n\nProvide a JSON array of insights with categories and confidence scores.`;
  }

  private buildSummaryPrompt(
    conversationText: string,
    participantCount: number,
    duration: number,
    customInstructions?: string
  ): string {
    let prompt = `Generate a comprehensive summary of this meeting:\n\n`;
    prompt += `Participants: ${participantCount}\n`;
    prompt += `Duration: ${Math.round(duration / 60)} minutes\n\n`;
    prompt += `Conversation:\n${conversationText}\n\n`;

    if (customInstructions) {
      prompt += `Additional instructions: ${customInstructions}\n\n`;
    }

    prompt += `Provide a complete JSON summary with all required fields.`;

    return prompt;
  }

  /**
   * Response parsers
   */
  private parseContentAnalysisResponse(content: string): any {
    return this.parseJSONResponse(content);
  }

  private parseSentimentAnalysisResponse(content: string): SentimentAnalysis {
    const data = this.parseJSONResponse(content);
    return {
      sentiment: data.sentiment as SentimentType,
      confidence: this.normalizeConfidence(data.confidence),
      reasoning: data.reasoning || '',
      emotionalTone: data.emotionalTone || {
        positive: 0.33,
        neutral: 0.34,
        negative: 0.33,
      },
    };
  }

  private parseInsightsResponse(content: string): MeetingInsight[] {
    const data = this.parseJSONResponse(content);
    const insights = Array.isArray(data) ? data : data.insights || [];

    return insights.map((insight: any) => ({
      category: insight.category || 'general',
      insight: insight.insight || insight.text || '',
      confidence: this.normalizeConfidence(insight.confidence),
      relatedSpeakers: insight.relatedSpeakers || [],
    }));
  }

  private parseSummaryResponse(content: string): any {
    const data = this.parseJSONResponse(content);

    return {
      title: data.title || 'Meeting Summary',
      executiveSummary: data.executiveSummary || '',
      detailedSummary: data.detailedSummary || '',
      keyPoints: data.keyPoints || [],
      actionItems: (data.actionItems || []).map((item: any) => ({
        description: item.description || '',
        assignedTo: item.assignedTo || [],
        priority: item.priority || 'medium',
        confidence: this.normalizeConfidence(item.confidence),
        context: item.context || '',
      })),
      decisions: data.decisions || [],
      sentiment: this.parseSentimentAnalysisResponse(
        JSON.stringify(data.sentiment || {})
      ),
      topics: (data.topics || []).map((topic: any) => ({
        name: topic.name || '',
        keywords: topic.keywords || [],
        frequency: topic.frequency || 0,
        relevance: topic.relevance || 0.5,
        confidence: this.normalizeConfidence(topic.confidence),
      })),
    };
  }

  /**
   * Parse JSON response from AI
   */
  private parseJSONResponse(content: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to extract JSON from content
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(content.substring(jsonStart, jsonEnd + 1));
      }

      // Try parsing entire content
      return JSON.parse(content);
    } catch (error) {
      logger.error('Failed to parse JSON response', { content, error });
      throw new AppError('Failed to parse AI response', 500);
    }
  }

  /**
   * Normalize confidence score
   */
  private normalizeConfidence(confidence: any): ConfidenceScore {
    let value: number;

    if (typeof confidence === 'number') {
      value = Math.max(0, Math.min(1, confidence));
    } else if (confidence && typeof confidence === 'object' && 'value' in confidence) {
      value = Math.max(0, Math.min(1, confidence.value));
    } else {
      value = 0.7; // Default medium confidence
    }

    let level: 'low' | 'medium' | 'high';
    if (value < 0.5) {
      level = 'low';
    } else if (value < 0.8) {
      level = 'medium';
    } else {
      level = 'high';
    }

    return { value, level };
  }

  /**
   * Calculate overall confidence from analysis data
   */
  private calculateOverallConfidence(data: any): ConfidenceScore {
    // Extract all confidence values
    const confidenceValues: number[] = [];

    if (data.sentiment?.confidence) {
      confidenceValues.push(this.normalizeConfidence(data.sentiment.confidence).value);
    }

    if (data.insights && Array.isArray(data.insights)) {
      data.insights.forEach((insight: any) => {
        if (insight.confidence) {
          confidenceValues.push(this.normalizeConfidence(insight.confidence).value);
        }
      });
    }

    if (data.topics && Array.isArray(data.topics)) {
      data.topics.forEach((topic: any) => {
        if (topic.confidence) {
          confidenceValues.push(this.normalizeConfidence(topic.confidence).value);
        }
      });
    }

    // Calculate average confidence
    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length
        : 0.7;

    return this.normalizeConfidence(avgConfidence);
  }

  /**
   * Store analysis result
   */
  private async storeAnalysisResult(result: ContentAnalysisResult): Promise<void> {
    await analysisResultRepository.upsert(
      result.meetingId,
      result.analysisType,
      {
        sentiment: result.sentiment.sentiment,
        keyPoints: result.insights,
        topics: result.topics,
        metadata: result.metadata,
      }
    );
  }

  /**
   * Store meeting summary
   */
  private async storeMeetingSummary(summary: MeetingSummary): Promise<void> {
    await analysisResultRepository.upsert(
      summary.meetingId,
      AnalysisType.MEETING_SUMMARY,
      {
        summary: summary.executiveSummary,
        keyPoints: summary.keyPoints,
        actionItems: summary.actionItems,
        sentiment: summary.sentiment.sentiment,
        topics: summary.topics,
        participants: summary.speakerMetrics,
        metadata: summary.metadata,
      }
    );
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
