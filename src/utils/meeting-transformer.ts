import { Meeting } from '@prisma/client';

/**
 * Meeting Response DTO
 * Ensures all fields have non-null values for API responses
 */
export interface MeetingResponse {
  id: string;
  userId: string;
  title: string;
  description: string;
  meetingUrl: string;
  platform: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform Meeting entity to API response
 * Replaces null values with empty strings or empty objects
 */
export function transformMeetingResponse(meeting: Meeting): MeetingResponse {
  return {
    id: meeting.id,
    userId: meeting.userId,
    title: meeting.title,
    description: meeting.description || '',
    meetingUrl: meeting.meetingUrl || '',
    platform: meeting.platform || '',
    scheduledAt: meeting.scheduledAt ? meeting.scheduledAt.toISOString() : null,
    startedAt: meeting.startedAt ? meeting.startedAt.toISOString() : null,
    endedAt: meeting.endedAt ? meeting.endedAt.toISOString() : null,
    status: meeting.status,
    metadata: (meeting.metadata as Record<string, any>) || {},
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
  };
}

/**
 * Transform array of meetings
 */
export function transformMeetingsResponse(meetings: Meeting[]): MeetingResponse[] {
  return meetings.map(transformMeetingResponse);
}
