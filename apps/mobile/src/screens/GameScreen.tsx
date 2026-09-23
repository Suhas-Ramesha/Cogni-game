import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getGame } from '@cognigame/game-engine';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { queueChange } from '../db/sync';

export function GameScreen({ type, onExit }: { type: GameType; onExit: () => void }) {
  const language = useSession((s) => s.language);
  const game = getGame(type);
  const round = useMemo(() => game.buildRound(2, language), [game, language]);
  const started = useRef(Date.now());
  const [matches, setMatches] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  function finish(raw: unknown) {
    const result = game.score({ raw }, round, { startedAtMs: started.current, finishedAtMs: Date.now() });
    const row = {
      id: crypto.randomUUID?.() ?? `sess-${Date.now()}`,
      patient_id: useSession.getState().patientId,
      game_type: result.gameType,
      difficulty_level: result.difficultyLevel,
      score: result.score,
      accuracy: result.accuracy,
      reaction_time_ms: result.reactionTimeMs,
      completed_at: Date.now(),
      field_clocks: JSON.stringify({ '*': Date.now() }),
      created_at: Date.now(),
      updated_at: Date.now(),
      metadata: JSON.stringify(result.metadata ?? {}),
    };
    queueChange('game_sessions', row, 'created');
    setDone(result.accuracy >= 0.5 ? t(language, 'wellDone') : t(language, 'tryAgain'));
    speak(language, result.accuracy >= 0.5 ? 'wellDone' : 'tryAgain');
  }

  const payload = round.payload as Record<string, unknown>;

  return (
    <Screen>
      <Text style={{ fontSize: 32, fontWeight: '700', color: '#0F3D2E', lineHeight: 40 }}>
        {t(language, round.promptKey)}
      </Text>
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, round.narrationKey)} tone="ghost" />

      {type === 'memory_match' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
          {(payload.tiles as { tileId: string; label: string }[]).map((tile) => (
            <Pressable
              key={tile.tileId}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              onPress={() => {
                const next = matches + 1;
                setMatches(next);
                const pairs = Number(payload.pairs);
                if (next >= pairs) finish({ matches: pairs });
              }}
              style={({ pressed }) => ({
                width: '47%',
                minHeight: 88,
                backgroundColor: '#1F6F4A',
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 12,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ color: '#FFFBFA', fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
                {tile.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {type === 'attention' || type === 'pattern_recognition' ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          {((payload.options as { id: string; label?: string; color?: string }[]) ?? []).map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={opt.label ?? opt.id}
              onPress={() => finish({ chosenId: opt.id })}
              style={({ pressed }) => ({
                minHeight: 80,
                borderRadius: 20,
                backgroundColor: opt.color ?? '#0F3D2E',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ color: '#FFFBFA', fontSize: 24, fontWeight: '700' }}>{opt.label ?? opt.id}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {type === 'daily_routine' ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {(payload.steps as { id: string; label: string }[]).map((step) => (
            <BigButton
              key={step.id}
              label={step.label}
              onPress={() => {
                const next = [...order, step.id];
                setOrder(next);
                if (next.length === (payload.correctOrder as string[]).length) finish({ order: next });
              }}
            />
          ))}
        </View>
      ) : null}

      {type === 'emotional_engagement' ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {(payload.choices as { id: string; emoji: string; label: string }[]).map((c) => (
            <BigButton key={c.id} label={c.label} onPress={() => finish({ mood: c.id })} tone="accent" />
          ))}
        </View>
      ) : null}

      {done ? (
        <Text style={{ fontSize: 28, marginTop: 24, color: '#1F6F4A', fontWeight: '700' }}>{done}</Text>
      ) : null}
      <BigButton label={t(language, 'done')} onPress={onExit} tone="ghost" />
    </Screen>
  );
}
