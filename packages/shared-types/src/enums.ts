export const LANGUAGES = ['en', 'as', 'kha'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

export const GAME_TYPES = [
  'memory_match',
  'attention',
  'daily_routine',
  'pattern_recognition',
  'emotional_engagement',
] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const CAREGIVER_ROLES = ['family', 'health_worker'] as const;
export type CaregiverRole = (typeof CAREGIVER_ROLES)[number];

export const REMINDER_TYPES = ['medicine', 'hydration', 'activity', 'appointment'] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const REMINDER_STATUSES = ['scheduled', 'due', 'completed', 'missed', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export const ALERT_TYPES = ['missed_reminder', 'performance_drop', 'inactivity'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_SEVERITIES = ['info', 'warning', 'critical'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const MOODS = ['joyful', 'calm', 'okay', 'sad', 'anxious'] as const;
export type Mood = (typeof MOODS)[number];

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
