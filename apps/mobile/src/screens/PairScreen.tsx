import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { t } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';
import { synchronizeIfOnline } from '../db/sync';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const LANGS = [
  { id: 'en' as const, label: 'EN' },
  { id: 'as' as const, label: 'অসমীয়া' },
  { id: 'kha' as const, label: 'Khasi' },
];

export function PairScreen({ onPaired }: { onPaired: () => void }) {
  const language = useSession((s) => s.language);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeInput = useRef<TextInput>(null);

  async function pair() {
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      const auth = await fetch(`${API}/auth/pair`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingCode: code,
          deviceId: useSession.getState().deviceId,
          platform: 'expo',
        }),
      });
      if (!auth.ok) throw new Error('Pairing failed. Check the 6-digit code.');
      const body = await auth.json();
      const difficulty = (body.patient?.currentDifficulty ?? 2) as 1 | 2 | 3 | 4 | 5;
      useSession.getState().setAuth(body.token, body.patient.id, difficulty);
      useSession.getState().setSyncing(true);
      try {
        await synchronizeIfOnline();
      } finally {
        useSession.getState().setSyncing(false);
      }
      onPaired();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const digits = code.replace(/\D/g, '').slice(0, 6);

  const ready = digits.length === 6;

  return (
    <Screen
      footer={
        <BigButton
          label={busy ? `${t(language, 'pairStart')}…` : t(language, 'pairStart')}
          onPress={pair}
          tone="accent"
          disabled={busy || !ready}
        />
      }
    >
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#0F3D2E',
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Feather name="heart" size={16} color="#E0A100" />
        <Text style={{ color: '#E0A100', fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>NER · INDIA</Text>
      </View>
      <Text style={{ fontSize: 40, fontWeight: '700', color: '#0F3D2E', marginTop: 20 }}>
        {t(language, 'appName')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {LANGS.map((lang) => {
          const active = language === lang.id;
          return (
            <Pressable
              key={lang.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={lang.label}
              onPress={() => useSession.getState().setLanguage(lang.id)}
              style={{
                flex: 1,
                minHeight: 64,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? '#0F3D2E' : '#FFFBFA',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '700', color: active ? '#FFFBFA' : '#0F3D2E' }}>
                {lang.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 24, marginTop: 20, color: '#5C4A3A', lineHeight: 32 }}>
        {t(language, 'pairPrompt')}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pairing code"
        onPress={() => codeInput.current?.focus()}
        style={{ marginTop: 28 }}
      >
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: 6 }, (_, i) => {
            const digit = digits[i] ?? '';
            const active = i === digits.length && digits.length < 6;
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  minHeight: 72,
                  borderRadius: 16,
                  backgroundColor: '#FFFBFA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: active ? '#E0A100' : '#E4EDE6',
                }}
              >
                <Text style={{ fontSize: 32, fontWeight: '700', color: digit ? '#0F3D2E' : '#C4B8A8' }}>
                  {digit || '–'}
                </Text>
              </View>
            );
          })}
        </View>
        <TextInput
          ref={codeInput}
          value={digits}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          accessibilityLabel="Pairing code"
          maxLength={6}
          caretHidden
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: '#9B1D20', fontSize: 20, marginTop: 12, lineHeight: 28 }}>
          {error}
        </Text>
      ) : null}
    </Screen>
  );
}
