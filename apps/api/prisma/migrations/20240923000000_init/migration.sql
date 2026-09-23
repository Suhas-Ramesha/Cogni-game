-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CaregiverRole" AS ENUM ('family', 'health_worker');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('en', 'as', 'kha');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('memory_match', 'attention', 'daily_routine', 'pattern_recognition', 'emotional_engagement');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('medicine', 'hydration', 'activity', 'appointment');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('scheduled', 'due', 'completed', 'missed', 'cancelled');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('missed_reminder', 'performance_drop', 'inactivity');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('joyful', 'calm', 'okay', 'sad', 'anxious');

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" "CaregiverRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preferredLanguage" "LanguageCode" NOT NULL DEFAULT 'en',
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "cognitiveBaselineScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "currentDifficulty" INTEGER NOT NULL DEFAULT 2,
    "caregiverId" TEXT NOT NULL,
    "pairingCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'unknown',
    "lastSyncedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "difficultyLevel" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "reactionTimeMs" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "recurrenceRule" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'scheduled',
    "localNotificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CognitiveMetric" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "CognitiveMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameContentPack" (
    "id" TEXT NOT NULL,
    "language" "LanguageCode" NOT NULL,
    "theme" TEXT NOT NULL,
    "assetBundleVersion" TEXT NOT NULL,
    "offlineAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "GameContentPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "patientId" TEXT,
    "lastPulledAt" TIMESTAMP(3),
    "lastPushedAt" TIMESTAMP(3),
    "conflictCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoodCheckIn" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "mood" "Mood" NOT NULL,
    "note" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldClocks" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "MoodCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DifficultyRecommendation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "recommendedDifficulty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DifficultyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_firebaseUid_key" ON "Caregiver"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_phone_key" ON "Caregiver"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_pairingCode_key" ON "Patient"("pairingCode");

-- CreateIndex
CREATE INDEX "GameSession_patientId_completedAt_idx" ON "GameSession"("patientId", "completedAt");

-- CreateIndex
CREATE INDEX "Reminder_patientId_scheduledTime_idx" ON "Reminder"("patientId", "scheduledTime");

-- CreateIndex
CREATE INDEX "CognitiveMetric_patientId_recordedAt_idx" ON "CognitiveMetric"("patientId", "recordedAt");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CognitiveMetric" ADD CONSTRAINT "CognitiveMetric_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoodCheckIn" ADD CONSTRAINT "MoodCheckIn_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DifficultyRecommendation" ADD CONSTRAINT "DifficultyRecommendation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

