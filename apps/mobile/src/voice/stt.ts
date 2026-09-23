/**
 * Offline speech-to-text interface.
 *
 * FLAG: Vosk is **not** wired to a native engine in this 90% build.
 * There is no maintained Expo-compatible Vosk module for managed workflow.
 * `VoskSpeechToText` is a stub that throws a typed error. The UI never relies
 * on STT for core loops — large buttons / emoji are the input path.
 *
 * To finish this 10% of voice-input:
 * 1. EAS development build (not Expo Go)
 * 2. Config plugin that bundles a Vosk model (as-IN / en-IN; Khasi TBD)
 * 3. Implement `start()` by bridging `org.vosk.android` / iOS vosk-api
 */

export type Transcript = { text: string; isFinal: boolean };

export interface SpeechToTextEngine {
  readonly engine: 'vosk' | 'stub';
  readonly offline: boolean;
  available(): Promise<boolean>;
  start(onResult: (t: Transcript) => void): Promise<void>;
  stop(): Promise<void>;
}

export class VoskNotLinkedError extends Error {
  constructor() {
    super(
      'Vosk STT is stubbed. Use an EAS dev client + native vosk module. See apps/mobile/src/voice/README.md',
    );
    this.name = 'VoskNotLinkedError';
  }
}

export class VoskSpeechToText implements SpeechToTextEngine {
  readonly engine = 'vosk' as const;
  readonly offline = true;

  async available() {
    return false;
  }

  async start(_onResult: (t: Transcript) => void): Promise<void> {
    throw new VoskNotLinkedError();
  }

  async stop(): Promise<void> {
    return;
  }
}

/** Default engine used by the app — always the stub until native work lands. */
export const speechToText: SpeechToTextEngine = new VoskSpeechToText();
