import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { t } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
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
    <Screen>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#0F3D2E' }}>{t(language, 'reminders')}</Text>
      {items.map((item) => {
        const done = item.status === 'completed';
        const missed = item.status === 'missed';
        return (
          <View
            key={item.id}
            style={{
              marginTop: 20,
              backgroundColor: '#FFFBFA',
              borderRadius: 24,
              padding: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Feather name={item.type === 'medicine' ? 'plus-circle' : 'droplet'} size={22} color="#0F3D2E" />
              <Text style={{ fontSize: 26, fontWeight: '700', color: '#0F3D2E', flex: 1 }}>{item.title}</Text>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: done ? '#E4EDE6' : missed ? '#F8D7D8' : '#F7E3B0',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: done ? '#1F6F4A' : missed ? '#9B1D20' : '#5C4A3A',
                  textTransform: 'capitalize',
                }}
              >
                {item.status}
              </Text>
            </View>
            <BigButton label={t(language, 'done')} onPress={() => mark(item.id, 'completed')} />
            <BigButton label={t(language, 'skip')} onPress={() => mark(item.id, 'missed')} tone="danger" />
          </View>
        );
      })}
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, 'reminders')} tone="ghost" />
      <BigButton label={t(language, 'done')} onPress={onBack} tone="ghost" />
    </Screen>
  );
}
