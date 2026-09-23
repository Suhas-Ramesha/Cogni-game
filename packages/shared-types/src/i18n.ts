import type { LanguageCode } from './enums';

type Dictionary = Record<string, string>;

const en: Dictionary = {
  appName: 'CogniGame',
  hello: 'Hello',
  play: 'Play',
  reminders: 'Reminders',
  howDoYouFeel: 'How do you feel?',
  medicine: 'Medicine',
  water: 'Drink water',
  done: 'Done',
  skip: 'Skip',
  next: 'Next',
  listen: 'Listen',
  speak: 'Speak',
  offline: 'You are offline. Games still work.',
  online: 'Connected. Syncing…',
  synced: 'Saved to caregiver',
  memoryMatch: 'Memory Match',
  attention: 'Find the odd one',
  dailyRoutine: 'Daily routine',
  pattern: 'Match the pattern',
  mood: 'How I feel',
  wellDone: 'Well done',
  tryAgain: 'Try again, slowly',
  pairPrompt: 'Ask your caregiver for the 6-digit code',
  pairStart: 'Start',
};

const as: Dictionary = {
  appName: 'কগনিগেম',
  hello: 'নমস্কাৰ',
  play: 'খেলক',
  reminders: 'স্মাৰক',
  howDoYouFeel: 'আপুনি কেনেকুৱা অনুভৱ কৰিছে?',
  medicine: 'ঔষধ',
  water: 'পানী খাওক',
  done: 'হ’ল',
  skip: 'বাদ দিয়ক',
  next: 'পিছৰ',
  listen: 'শুনক',
  speak: 'কওক',
  offline: 'আপুনি অফলাইন। খেলবোৰ চলি থাকিব।',
  online: 'সংযোগ হৈছে। চিনক কৰি আছে…',
  synced: 'যত্নকাৰীলৈ সংৰক্ষিত',
  memoryMatch: 'স্মৃতি মিল',
  attention: 'অশুদ্ধটো বিচাৰক',
  dailyRoutine: 'দৈনন্দিন কাম',
  pattern: 'আৰ্হি মিলাওক',
  mood: 'মোৰ অনুভৱ',
  wellDone: 'বঢ়িয়া কাম',
  tryAgain: 'লাহে লাহে আকৌ চেষ্টা কৰক',
  pairPrompt: 'যত্নকাৰীৰ পৰা ৬ অংকৰ ক’ড লওক',
  pairStart: 'আৰম্ভ',
};

const kha: Dictionary = {
  appName: 'CogniGame',
  hello: 'Khublei',
  play: 'Lehkhia',
  reminders: 'Kynmaw',
  howDoYouFeel: 'Kumno pha sngew?',
  medicine: 'Dawai',
  water: 'Di Um',
  done: 'Lah',
  skip: 'Mynnoh',
  next: 'Mynta',
  listen: 'Sngap',
  speak: 'Kren',
  offline: 'Pha ym don jingjylliew. Ki game dang leh.',
  online: 'La ioh jingjylliew. Sync…',
  synced: 'La thung sha caregiver',
  memoryMatch: 'Pyniasoh Memory',
  attention: 'Wad ia ka ba kyndit',
  dailyRoutine: 'Ka jingtrei sngi',
  pattern: 'Pyniasoh pattern',
  mood: 'Kumno nga sngew',
  wellDone: 'Bha shisha',
  tryAgain: 'Leh biang palat',
  pairPrompt: 'Pan 6 digit code na caregiver',
  pairStart: 'Start',
};

const TABLES: Record<LanguageCode, Dictionary> = { en, as, kha };

export function t(language: LanguageCode, key: string): string {
  return TABLES[language][key] ?? TABLES.en[key] ?? key;
}

export const STRINGS = { en, as, kha };
