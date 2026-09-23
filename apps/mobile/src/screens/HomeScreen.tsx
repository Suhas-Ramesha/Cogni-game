import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';

type FeatherName = ComponentProps<typeof Feather>['name'];

const GAMES: { type: GameType; key: string; icon: FeatherName }[] = [
  { type: 'memory_match', key: 'memoryMatch', icon: 'grid' },
  { type: 'attention', key: 'attention', icon: 'eye' },
  { type: 'daily_routine', key: 'dailyRoutine', icon: 'sun' },
  { type: 'pattern_recognition', key: 'pattern', icon: 'layers' },
  { type: 'emotional_engagement', key: 'mood', icon: 'heart' },
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
  const syncing = useSession((s) => s.syncing);
  const statusKey = syncing ? 'syncing' : online ? 'online' : 'offline';
  const statusColor = syncing ? '#8A5A00' : online ? '#1F6F4A' : '#9B1D20';
  const statusBg = syncing ? '#F7E3B0' : online ? '#E4EDE6' : '#F8D7D8';

  return (
    <Screen>
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: statusBg,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 999,
        }}
      >
        <Feather name={syncing ? 'refresh-cw' : online ? 'wifi' : 'wifi-off'} size={18} color={statusColor} />
        <Text style={{ fontSize: 18, color: statusColor, fontWeight: '600' }}>
          {t(language, statusKey)}
        </Text>
      </View>
      <Text style={{ fontSize: 36, fontWeight: '700', color: '#0F3D2E', marginVertical: 16 }}>
        {t(language, 'hello')}
      </Text>

      {GAMES.map((g) => (
        <Pressable
          key={g.type}
          accessibilityRole="button"
          accessibilityLabel={t(language, g.key)}
          onPress={() => onPlay(g.type)}
          android_ripple={{ color: 'rgba(255,251,250,0.15)' }}
          style={({ pressed }) => ({
            minHeight: 88,
            borderRadius: 28,
            backgroundColor: '#0F3D2E',
            paddingHorizontal: 22,
            marginVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: '#1F6F4A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name={g.icon} size={24} color="#FFFBFA" />
          </View>
          <Text style={{ color: '#FFFBFA', fontSize: 24, fontWeight: '700', flex: 1 }}>{t(language, g.key)}</Text>
          <Feather name="chevron-right" size={24} color="#E0A100" />
        </Pressable>
      ))}

      <View style={{ height: 8 }} />
      <BigButton label={t(language, 'reminders')} onPress={onReminders} tone="accent" />
    </Screen>
  );
}
