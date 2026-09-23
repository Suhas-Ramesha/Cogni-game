# Voice input (Vosk) — explicit descoping

## Status: **stubbed, not silent**

The master prompt requires Vosk on-device STT. After checking the ecosystem (Expo SDK 52 managed workflow):

- No maintained Expo config plugin / module for Vosk that ships models and microphone capture without a custom native build.
- `react-native-vosk` is unmaintained / poorly aligned with the New Architecture.
- Cloud STT would violate the offline constraint.

## What shipped

- `SpeechToTextEngine` interface (`stt.ts`)
- `VoskSpeechToText` stub that throws `VoskNotLinkedError`
- Patient UI uses **large labeled buttons** and mood emoji instead of voice commands
- TTS (`expo-speech`) **is** implemented for English + Assamese; Khasi uses `en-IN` voice + on-screen Khasi

## What a follow-up native PR must do

1. `npx expo prebuild` / EAS development client
2. Add Android `org.vosk:vosk-android` and iOS vosk-api
3. Bundle `vosk-model-small-en-in` + Assamese model; document Khasi model gap
4. Implement `VoskModule.start/stop` and swap the stub
5. Keep the same `SpeechToTextEngine` so game screens do not change

Do not call cloud STT from this interface.
