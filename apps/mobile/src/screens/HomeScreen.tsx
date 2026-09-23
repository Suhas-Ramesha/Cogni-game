import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';

const GAMES: { type: GameType; key: string }[] = [
  { type: 'memory_match', key: 'memoryMatch' },
  { type: 'attention', key: 'attention' },
  { type: 'daily_routine', key: 'dailyRoutine' },
  { type: 'pattern_recognition', key: 'pattern' },
  { type: 'emotional_engagement', key: 'mood' },
];

export function HomeScreen({
  onPlay,
  onReminders,
}: {
  onPlay: (type: GameType) => void;
  onReminders: () => void;
}) {
  const language = useSession((s) => s.language);
  const online = useSession((s) => s.online);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6EFE4' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <Text style={{ fontSize: 18, color: online ? '#1F6F4A' : '#9B1D20' }}>
          {t(language, online ? 'online' : 'offline')}
        </Text>
        <Text style={{ fontSize: 36, fontWeight: '700', color: '#0F3D2E', marginVertical: 12 }}>
          {t(language, 'hello')}
        </Text>
        <BigButton label={t(language, 'listen')} onPress={() => speak(language, 'play')} tone="ghost" />
        {GAMES.map((g) => (
          <BigButton key={g.type} label={t(language, g.key)} onPress={() => onPlay(g.type)} />
        ))}
        <View style={{ height: 12 }} />
        <BigButton label={t(language, 'reminders')} onPress={onReminders} tone="accent" />
      </ScrollView>
    </SafeAreaView>
  );
}
