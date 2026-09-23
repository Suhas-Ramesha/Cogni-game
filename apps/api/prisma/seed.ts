import { PrismaClient, GameType, ReminderType, ReminderStatus, Mood } from '@prisma/client';

const prisma = new PrismaClient();

const GAME_TYPES: GameType[] = [
  'memory_match',
  'attention',
  'daily_routine',
  'pattern_recognition',
  'emotional_engagement',
];

function daysAgo(n: number, hour = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(hour, 15, 0, 0);
  return d;
}

async function main() {
  await prisma.alert.deleteMany();
  await prisma.difficultyRecommendation.deleteMany();
  await prisma.moodCheckIn.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.cognitiveMetric.deleteMany();
  await prisma.device.deleteMany();
  await prisma.gameContentPack.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.caregiver.deleteMany();

  const anjali = await prisma.caregiver.create({
    data: {
      name: 'Anjali Das',
      phone: '+916000000001',
      role: 'health_worker',
    },
  });

  const rita = await prisma.patient.create({
    data: {
      name: 'Rita Sharma',
      preferredLanguage: 'as',
      dateOfBirth: new Date('1948-03-12'),
      cognitiveBaselineScore: 62,
      currentDifficulty: 2,
      caregiverId: anjali.id,
      pairingCode: '482193',
    },
  });

  const bah = await prisma.patient.create({
    data: {
      name: 'Bah Nongkynrih',
      preferredLanguage: 'kha',
      dateOfBirth: new Date('1945-07-02'),
      cognitiveBaselineScore: 54,
      currentDifficulty: 2,
      caregiverId: anjali.id,
      pairingCode: '719204',
    },
  });

  await prisma.device.createMany({
    data: [
      {
        id: 'device-rita-tablet',
        patientId: rita.id,
        platform: 'android-tablet',
        lastSyncedAt: new Date(),
        lastSeenAt: new Date(),
        appVersion: '0.9.0',
      },
      {
        id: 'device-bah-phone',
        patientId: bah.id,
        platform: 'android',
        lastSyncedAt: daysAgo(2, 8),
        lastSeenAt: daysAgo(2, 8),
        appVersion: '0.9.0',
      },
    ],
  });

  await prisma.gameContentPack.createMany({
    data: [
      { language: 'en', theme: 'ner-placeholder', assetBundleVersion: '0.9.0', offlineAvailable: true },
      { language: 'as', theme: 'assam-bihu', assetBundleVersion: '0.9.0', offlineAvailable: true },
      { language: 'kha', theme: 'meghalaya-roots', assetBundleVersion: '0.9.0', offlineAvailable: true },
    ],
  });

  const sessions = [];
  const metrics = [];
  const moods = [];

  for (const patient of [rita, bah]) {
    const drop = patient.id === bah.id;
    for (let day = 13; day >= 0; day -= 1) {
      const plays = day % 3 === 0 ? 1 : 2;
      for (let p = 0; p < plays; p += 1) {
        const gameType = GAME_TYPES[(day + p) % GAME_TYPES.length];
        const base = drop && day < 4 ? 38 : 70 + ((day + p) % 12);
        const accuracy = Math.min(0.98, Math.max(0.28, base / 100 + (drop && day < 4 ? -0.25 : 0)));
        const completedAt = daysAgo(day, 9 + p * 3);
        sessions.push({
          patientId: patient.id,
          gameType,
          difficultyLevel: gameType === 'emotional_engagement' ? 1 : patient.currentDifficulty,
          score: Math.round(base),
          accuracy,
          reactionTimeMs: 2800 + day * 80 + p * 200,
          completedAt,
          syncedAt: completedAt,
        });
        metrics.push({
          patientId: patient.id,
          metricType: `${gameType}.score`,
          value: base,
          recordedAt: completedAt,
        });
      }
      if (day % 2 === 0) {
        const mood: Mood = drop && day < 4 ? 'sad' : day % 5 === 0 ? 'calm' : 'joyful';
        moods.push({
          patientId: patient.id,
          mood,
          recordedAt: daysAgo(day, 20),
        });
      }
    }
  }
  await prisma.gameSession.createMany({ data: sessions });
  await prisma.cognitiveMetric.createMany({ data: metrics });
  await prisma.moodCheckIn.createMany({ data: moods });

  const reminderTypes: ReminderType[] = ['medicine', 'hydration', 'activity', 'appointment'];
  const reminders = [];
  for (const patient of [rita, bah]) {
    for (let day = 6; day >= 0; day -= 1) {
      for (const type of reminderTypes) {
        const scheduledTime = daysAgo(day, type === 'medicine' ? 8 : 15);
        let status: ReminderStatus = 'completed';
        if (patient.id === bah.id && day <= 1 && type === 'medicine') status = 'missed';
        else if (day === 0 && type === 'appointment') status = 'scheduled';
        reminders.push({
          patientId: patient.id,
          type,
          title:
            type === 'medicine'
              ? 'Donepezil 5mg'
              : type === 'hydration'
                ? 'Drink a glass of water'
                : type === 'activity'
                  ? 'Garden walk'
                  : 'Clinic follow-up',
          scheduledTime,
          recurrenceRule: type === 'appointment' ? null : 'FREQ=DAILY;INTERVAL=1',
          status,
          localNotificationId: `local-${patient.id}-${type}-${day}`,
        });
      }
    }
  }
  await prisma.reminder.createMany({ data: reminders });

  await prisma.alert.createMany({
    data: [
      {
        patientId: bah.id,
        caregiverId: anjali.id,
        type: 'missed_reminder',
        severity: 'warning',
        message: 'Missed reminder: Donepezil 5mg',
      },
      {
        patientId: bah.id,
        caregiverId: anjali.id,
        type: 'performance_drop',
        severity: 'critical',
        message: 'Sudden drop in game scores over the last sessions',
      },
      {
        patientId: bah.id,
        caregiverId: anjali.id,
        type: 'inactivity',
        severity: 'warning',
        message: 'Device last synced 2 days ago',
      },
    ],
  });

  console.log('Seeded caregiver Anjali Das with patients Rita Sharma (482193) and Bah Nongkynrih (719204)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
