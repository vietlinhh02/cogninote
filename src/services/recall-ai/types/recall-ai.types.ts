/**
 * Recall AI Types
 * Type definitions for Recall AI meeting bot integration
 */

/**
 * Meeting platform types supported by Recall AI
 */
export enum MeetingPlatform {
  ZOOM = 'zoom',
  GOOGLE_MEET = 'google_meet',
  MICROSOFT_TEAMS = 'microsoft_teams',
  WEBEX = 'webex',
}

/**
 * Bot status in the meeting
 */
export enum BotStatus {
  IDLE = 'idle',
  JOINING = 'joining',
  IN_MEETING = 'in_meeting',
  RECORDING = 'recording',
  LEAVING = 'leaving',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Bot configuration for joining a meeting
 */
export interface BotConfig {
  meetingUrl: string;
  platform: MeetingPlatform;
  botName?: string;
  recordAudio?: boolean;
  recordVideo?: boolean;
  recordTranscription?: boolean;
  autoLeave?: {
    enabled: boolean;
    noActivityTimeout?: number; // minutes
    waitingRoomTimeout?: number; // minutes
  };
}

/**
 * Bot deployment request
 */
export interface DeployBotRequest extends BotConfig {
  meetingId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Bot deployment response from Recall AI
 */
export interface DeployBotResponse {
  botId: string;
  status: BotStatus;
  meetingUrl: string;
  platform: MeetingPlatform;
  createdAt: string;
}

/**
 * Bot status response
 */
export interface BotStatusResponse {
  botId: string;
  status: BotStatus;
  meetingUrl: string;
  platform: MeetingPlatform;
  joinedAt?: string;
  leftAt?: string;
  recordingStartedAt?: string;
  recordingEndedAt?: string;
  participants?: BotParticipant[];
  error?: string;
}

/**
 * Meeting participant information
 */
export interface BotParticipant {
  id: string;
  name: string;
  joinedAt: string;
  leftAt?: string;
}

/**
 * Recording metadata
 */
export interface RecordingMetadata {
  botId: string;
  meetingId: string;
  duration: number; // seconds
  fileSize?: number; // bytes
  format?: string;
  recordedAt: string;
}

/**
 * Recording download response
 */
export interface RecordingDownload {
  audioUrl?: string;
  videoUrl?: string;
  transcriptUrl?: string;
  expiresAt?: string;
}

/**
 * Transcription segment from Recall AI
 */
export interface TranscriptionSegment {
  speaker: string;
  text: string;
  startTime: number; // seconds
  endTime: number; // seconds
  confidence: number;
}

/**
 * Full transcription response
 */
export interface TranscriptionResponse {
  botId: string;
  meetingId: string;
  segments: TranscriptionSegment[];
  language?: string;
  duration: number;
}

/**
 * Bot lifecycle event
 */
export interface BotLifecycleEvent {
  botId: string;
  eventType: 'bot_joined' | 'bot_left' | 'recording_started' | 'recording_stopped' | 'error';
  timestamp: string;
  data?: Record<string, unknown>;
}

/**
 * Recall AI error response
 */
export interface RecallAPIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

/**
 * Recall AI service configuration
 */
export interface RecallAIConfig {
  apiKey: string;
  endpoint: string;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

/**
 * Bot storage data for database
 */
export interface BotStorageData {
  botId: string;
  meetingId: string;
  status: BotStatus;
  platform: MeetingPlatform;
  meetingUrl: string;
  deployedAt: Date;
  joinedAt?: Date;
  leftAt?: Date;
  recordingUrl?: string;
  transcriptionUrl?: string;
  error?: string;
}
