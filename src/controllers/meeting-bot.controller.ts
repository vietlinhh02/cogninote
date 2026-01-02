import { Request, Response, NextFunction } from 'express';
import { meetingBotService } from '../services/recall-ai/meeting-bot.service.js';

export class MeetingBotController {
  /**
   * Deploy bot to meeting
   */
  async deployBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: meetingId } = req.params;
      const userId = req.user!.id;
      const { botName, recordAudio, recordVideo, recordTranscription } = req.body;

      const botData = await meetingBotService.deployBotToMeeting(
        meetingId,
        userId,
        {
          botName,
          recordAudio,
          recordVideo,
          recordTranscription,
        }
      );

      res.status(201).json(botData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bot status
   */
  async getBotStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { botId } = req.params;
      const botStatus = await meetingBotService.getBotStatus(botId);
      res.json(botStatus);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Stop bot
   */
  async stopBot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { botId } = req.params;
      const userId = req.user!.id;

      await meetingBotService.stopBot(botId, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync bot status with meeting
   */
  async syncBotStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: meetingId } = req.params;
      const botStatus = await meetingBotService.syncBotStatus(meetingId);
      res.json(botStatus);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve meeting recording
   */
  async getRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: meetingId } = req.params;
      const userId = req.user!.id;

      const recording = await meetingBotService.retrieveRecording(meetingId, userId);
      res.json(recording);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve meeting transcription
   */
  async getTranscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: meetingId } = req.params;
      const userId = req.user!.id;

      const transcription = await meetingBotService.retrieveTranscription(meetingId, userId);
      res.json(transcription);
    } catch (error) {
      next(error);
    }
  }
}

export const meetingBotController = new MeetingBotController();
