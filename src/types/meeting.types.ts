import { Meeting, Transcription, AnalysisResult, User } from '@prisma/client';

/**
 * Meeting with transcriptions relation
 */
export interface MeetingWithTranscriptions extends Meeting {
  transcriptions: Transcription[];
}

/**
 * Meeting with analysis results relation
 */
export interface MeetingWithAnalysis extends Meeting {
  analysisResults: AnalysisResult[];
}

/**
 * Meeting with all relations
 */
export interface MeetingWithRelations extends Meeting {
  user?: Pick<User, 'id' | 'email' | 'fullName'>;
  transcriptions?: Transcription[];
  analysisResults?: AnalysisResult[];
}
