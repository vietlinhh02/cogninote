import { Request, Response, NextFunction } from 'express';
import { meetingService } from '../services/meeting.service.js';
import { CreateMeetingData, UpdateMeetingData } from '../repositories/meeting.repository.js';
import { AppError } from '../middlewares/error-handler.js';
import { MeetingWithRelations } from '../types/meeting.types.js';
import { transformMeetingResponse, transformMeetingsResponse } from '../utils/meeting-transformer.js';

export class MeetingController {
  /**
   * Get all meetings for user
   */
  async getMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { status, skip, take, startDate, endDate, platform, search } = req.query;

      const options = {
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        platform: platform as string,
        search: search as string,
      };

      const result = await meetingService.getUserMeetings(userId, options);
      res.json({
        meetings: transformMeetingsResponse(result.meetings),
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new meeting
   */
  async createMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Unauthorized - Authentication required', 401);
      }

      const userId = req.user.id;
      const data: CreateMeetingData = {
        ...req.body,
        userId,
      };

      const meeting = await meetingService.createMeeting(data);
      res.status(201).json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { withTranscriptions, withAnalysis, withRelations } = req.query;

      let meeting;
      if (withRelations === 'true') {
        meeting = await meetingService.getMeetingWithRelations(id);
      } else if (withTranscriptions === 'true') {
        meeting = await meetingService.getMeetingWithTranscriptions(id);
      } else if (withAnalysis === 'true') {
        meeting = await meetingService.getMeetingWithAnalysis(id);
      } else {
        meeting = await meetingService.getMeetingById(id);
      }

      // Security check: ensure user owns the meeting
      if (meeting.userId !== req.user!.id) {
        throw new AppError('Unauthorized access to meeting', 403);
      }

      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update meeting
   */
  async updateMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const data: UpdateMeetingData = req.body;

      const meeting = await meetingService.updateMeeting(id, userId, data);
      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await meetingService.deleteMeeting(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start meeting
   */
  async startMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const meeting = await meetingService.startMeeting(id, userId);
      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pause meeting
   */
  async pauseMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const meeting = await meetingService.pauseMeeting(id, userId);
      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resume meeting
   */
  async resumeMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const meeting = await meetingService.resumeMeeting(id, userId);
      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * End meeting
   */
  async endMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const meeting = await meetingService.endMeeting(id, userId);
      res.json(transformMeetingResponse(meeting));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export meeting
   */
  async exportMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { format } = req.query; // json, txt, csv, md
      const userId = req.user!.id;

      const meeting: MeetingWithRelations = await meetingService.getMeetingWithRelations(id);

      if (meeting.userId !== userId) {
        throw new AppError('Unauthorized access to meeting', 403);
      }

      if (format === 'txt') {
        let content = `Title: ${meeting.title}\n`;
        content += `Date: ${meeting.scheduledAt || meeting.createdAt}\n`;
        content += `Description: ${meeting.description || 'N/A'}\n\n`;

        content += `TRANSCRIPTIONS:\n`;
        if (meeting.transcriptions && meeting.transcriptions.length > 0) {
            meeting.transcriptions.forEach((t) => {
                content += `[${t.timestampStart || '00:00'}] ${t.speakerName || 'Speaker'}: ${t.text}\n`;
            });
        } else {
            content += `No transcriptions available.\n`;
        }

        content += `\nANALYSIS:\n`;
        if (meeting.analysisResults && meeting.analysisResults.length > 0) {
            meeting.analysisResults.forEach((a) => {
                content += `Type: ${a.analysisType}\n`;
                if (a.summary) content += `Summary: ${a.summary}\n`;
                content += `\n`;
            });
        }

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="meeting-${id}.txt"`);
        res.send(content);
      } else if (format === 'csv') {
        // CSV export of transcriptions
        let csv = 'Timestamp,Speaker,Text,Confidence\n';

        if (meeting.transcriptions && meeting.transcriptions.length > 0) {
          meeting.transcriptions.forEach((t) => {
            const timestamp = t.timestampStart || '00:00';
            const speaker = (t.speakerName || 'Speaker').replace(/"/g, '""');
            const text = (t.text || '').replace(/"/g, '""');
            const confidence = t.confidence || 'N/A';
            csv += `"${timestamp}","${speaker}","${text}","${confidence}"\n`;
          });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="meeting-${id}.csv"`);
        res.send(csv);
      } else if (format === 'md') {
        // Markdown export
        let md = `# ${meeting.title}\n\n`;
        md += `**Date:** ${meeting.scheduledAt || meeting.createdAt}\n\n`;
        if (meeting.description) {
          md += `**Description:** ${meeting.description}\n\n`;
        }
        if (meeting.platform) {
          md += `**Platform:** ${meeting.platform}\n\n`;
        }
        md += `**Status:** ${meeting.status}\n\n`;
        md += `---\n\n`;

        md += `## Transcriptions\n\n`;
        if (meeting.transcriptions && meeting.transcriptions.length > 0) {
          meeting.transcriptions.forEach((t) => {
            const timestamp = t.timestampStart || '00:00';
            const speaker = t.speakerName || 'Speaker';
            md += `**[${timestamp}] ${speaker}:** ${t.text}\n\n`;
          });
        } else {
          md += `*No transcriptions available.*\n\n`;
        }

        md += `---\n\n## Analysis Results\n\n`;
        if (meeting.analysisResults && meeting.analysisResults.length > 0) {
          meeting.analysisResults.forEach((a) => {
            md += `### ${a.analysisType}\n\n`;
            if (a.summary) md += `${a.summary}\n\n`;
            if (a.actionItems && Array.isArray(a.actionItems) && a.actionItems.length > 0) {
              md += `**Action Items:**\n\n`;
              a.actionItems.forEach((item) => {
                md += `- ${item}\n`;
              });
              md += `\n`;
            }
          });
        } else {
          md += `*No analysis results available.*\n\n`;
        }

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="meeting-${id}.md"`);
        res.send(md);
      } else {
        // Default to JSON
        res.json(meeting);
      }
    } catch (error) {
      next(error);
    }
  }
}

export const meetingController = new MeetingController();
