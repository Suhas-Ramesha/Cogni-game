import { describe, expect, it } from 'vitest';
import { VoskSpeechToText, VoskNotLinkedError } from './stt';

describe('Vosk STT stub', () => {
  it('is explicitly unavailable rather than silently skipped', async () => {
    const engine = new VoskSpeechToText();
    expect(engine.engine).toBe('vosk');
    expect(engine.offline).toBe(true);
    expect(await engine.available()).toBe(false);
    await expect(engine.start(() => undefined)).rejects.toBeInstanceOf(VoskNotLinkedError);
  });
});
