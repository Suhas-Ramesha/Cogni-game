import { useState } from 'react';
import { SafeAreaView, Text, TextInput, View } from 'react-native';
import { t } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { synchronizeIfOnline } from '../db/sync';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export function PairScreen({ onPaired }: { onPaired: () => void }) {
  const language = useSession((s) => s.language);
  const [code, setCode] = useState('482193');
  const [error, setError] = useState<string | null>(null);

  async function pair() {
    setError(null);
    try {
      const demo = process.env.EXPO_PUBLIC_DEMO_AUTH !== 'false';
      const auth = await fetch(`${API}/auth/demo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'patient', pairingCode: code }),
      });
      if (!auth.ok) throw new Error('Pairing failed. Check the 6-digit code.');
      const body = await auth.json();
      useSession.getState().setAuth(body.token, body.patient.id);
      useSession.getState().setLanguage(body.patient.preferredLanguage);
      await fetch(`${API}/devices/pair`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pairingCode: code,
          deviceId: useSession.getState().deviceId,
          platform: 'expo',
        }),
      });
      await synchronizeIfOnline();
      onPaired();
      void demo;
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6EFE4', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 40, fontWeight: '700', color: '#0F3D2E' }}>{t(language, 'appName')}</Text>
      <Text style={{ fontSize: 24, marginTop: 16 }}>{t(language, 'pairPrompt')}</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        accessibilityLabel="Pairing code"
        style={{
          marginTop: 24,
          minHeight: 72,
          fontSize: 32,
          letterSpacing: 8,
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: 20,
        }}
      />
      {error ? <Text style={{ color: '#9B1D20', fontSize: 20, marginTop: 12 }}>{error}</Text> : null}
      <BigButton label={t(language, 'demoSignIn')} onPress={pair} tone="accent" />
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, 'pairPrompt')} tone="ghost" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {(['en', 'as', 'kha'] as const).map((lang) => (
          <BigButton key={lang} label={lang.toUpperCase()} onPress={() => useSession.getState().setLanguage(lang)} />
        ))}
      </View>
    </SafeAreaView>
  );
}
