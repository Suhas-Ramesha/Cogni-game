import type {
  AlertSeverity,
  AlertType,
  CaregiverRole,
  DifficultyLevel,
  GameType,
  LanguageCode,
  Mood,
  ReminderStatus,
  ReminderType,
} from './enums';
import type { GameResult } from './game';

export interface CaregiverDto {
  id: string;
  name: string;
  phone: string;
  role: CaregiverRole;
}

export interface PatientDto {
  id: string;
  name: string;
  preferredLanguage: LanguageCode;
  dateOfBirth: string;
  cognitiveBaselineScore: number;
  currentDifficulty: DifficultyLevel;
  caregiverId: string;
  pairingCode: string;
  lastSyncedAt: string | null;
  lastSeenAt: string | null;
}

export interface GameSessionDto extends GameResult {
  id: string;
  patientId: string;
  syncedAt: string | null;
}

export interface ReminderDto {
  id: string;
  patientId: string;
  type: ReminderType;
  title: string;
  scheduledTime: string;
  recurrenceRule: string | null;
  status: ReminderStatus;
  localNotificationId: string | null;
}

export interface CognitiveMetricDto {
  id: string;
  patientId: string;
  metricType: string;
  value: number;
  recordedAt: string;
}

export interface AlertDto {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
}

export interface MoodCheckInDto {
  id: string;
  patientId: string;
  mood: Mood;
  note: string | null;
  recordedAt: string;
}

export interface HeatmapCell {
  date: string;
  count: number;
}

export interface PatientDetailDto {
  patient: PatientDto;
  caregiver: CaregiverDto;
  sessions: GameSessionDto[];
  metrics: CognitiveMetricDto[];
  reminders: ReminderDto[];
  alerts: AlertDto[];
  moods: MoodCheckInDto[];
  heatmap: HeatmapCell[];
  compliance: {
    completed: number;
    missed: number;
    scheduled: number;
  };
}

export interface AuthResponse {
  token: string;
  role: 'caregiver' | 'patient';
  caregiver?: CaregiverDto;
  patient?: PatientDto;
  demo: boolean;
}
