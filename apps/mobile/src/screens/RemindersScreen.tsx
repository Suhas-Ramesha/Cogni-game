import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { scheduleReminder } from '../notifications/reminders';
import { queueChange } from '../db/sync';

type LocalReminder = { id: string; title: string; type: string; status: string };

export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const language = useSession((s) => s.language);
  const [items, setItems] = useState<LocalReminder[]>([
    { id: 'med', title: t(language, 'medicine'), type: 'medicine', status: 'due' },
    { id: 'water', title: t(language, 'water'), type: 'hydration', status: 'due' },
  ]);

  useEffect(() => {
    const when = new Date();
    when.setMinutes(when.getMinutes() + 1);
    scheduleReminder({
      title: t(language, 'medicine'),
      body: t(language, 'medicine'),
      when,
    }).catch(() => undefined);
  }, [language]);

  function mark(id: string, status: 'completed' | 'missed') {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    queueChange(
      'reminders',
      {
        id,
        status,
        updated_at: Date.now(),
        field_clocks: JSON.stringify({ status: Date.now() }),
      },
      'updated',
    );
    speak(language, status === 'completed' ? 'done' : 'tryAgain');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6EFE4', padding: 24 }}>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#0F3D2E' }}>{t(language, 'reminders')}</Text>
      {items.map((item) => (
        <View key={item.id} style={{ marginTop: 20, backgroundColor: 'white', borderRadius: 24, padding: 16 }}>
          <Text style={{ fontSize: 26 }}>{item.title}</Text>
          <Text style={{ fontSize: 18, color: '#4A3728' }}>{item.status}</Text>
          <BigButton label={t(language, 'done')} onPress={() => mark(item.id, 'completed')} />
          <BigButton label={t(language, 'skip')} onPress={() => mark(item.id, 'missed')} tone="danger" />
        </View>
      ))}
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, 'reminders')} tone="ghost" />
      <BigButton label={t(language, 'done')} onPress={onBack} tone="ghost" />
    </SafeAreaView>
  );
}
