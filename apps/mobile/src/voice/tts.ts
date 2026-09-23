import * as Speech from 'expo-speech';
import { t, type LanguageCode } from '@cognigame/shared-types';

const VOICES: Record<LanguageCode, string> = {
  en: 'en-IN',
  as: 'as-IN',
  /** Khasi has no reliable OS TTS voice; we speak English and show Khasi text. */
  kha: 'en-IN',
};

export function speak(language: LanguageCode, key: string, extra?: string) {
  const text = extra ? `${t(language, key)}. ${extra}` : t(language, key);
  Speech.stop();
  Speech.speak(text, {
    language: VOICES[language],
    rate: 0.85,
    pitch: 1.0,
  });
}

export function stopSpeak() {
  Speech.stop();
}
