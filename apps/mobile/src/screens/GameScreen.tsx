import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getGame } from '@cognigame/game-engine';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { queueChange } from '../db/sync';

type Tile = { tileId: string; assetId: string; label: string };

export function GameScreen({ type, onExit }: { type: GameType; onExit: () => void }) {
  const language = useSession((s) => s.language);
  const difficulty = useSession((s) => s.difficulty);
  const game = getGame(type);
  const round = useMemo(() => game.buildRound(difficulty, language), [game, language, difficulty]);
  const started = useRef(Date.now());
  const [matches, setMatches] = useState(0);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  const payload = round.payload as Record<string, unknown>;
  const tiles = (payload.tiles as Tile[] | undefined) ?? [];
  const pairs = Number(payload.pairs ?? 0);

  useEffect(() => {
    if (type === 'memory_match' && pairs > 0 && lockedIds.length >= pairs * 2 && !done) {
      finish({ matches: pairs });
    }
    // finish is stable enough for this completion trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedIds, pairs, type, done]);

  function finish(raw: unknown) {
    if (done) return;
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
    const ok = result.gameType === 'emotional_engagement' || result.accuracy >= 0.5;
    setDone(ok ? t(language, 'wellDone') : t(language, 'tryAgain'));
    speak(language, ok ? 'wellDone' : 'tryAgain');
  }

  function flipTile(tile: Tile) {
    if (done || busy) return;
    if (lockedIds.includes(tile.tileId) || flipped.includes(tile.tileId)) return;
    const next = [...flipped, tile.tileId];
    setFlipped(next);
    if (next.length < 2) return;
    const [firstId, secondId] = next;
    const first = tiles.find((x) => x.tileId === firstId);
    const second = tiles.find((x) => x.tileId === secondId);
    if (first && second && first.assetId === second.assetId) {
      setLockedIds((prev) => [...prev, first.tileId, second.tileId]);
      setMatches((n) => n + 1);
      setFlipped([]);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setFlipped([]);
      setBusy(false);
    }, 900);
  }

  return (
    <Screen>
      <Text style={{ fontSize: 32, fontWeight: '700', color: '#0F3D2E', lineHeight: 40 }}>
        {t(language, round.promptKey)}
      </Text>
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, round.narrationKey)} tone="ghost" />

      {type === 'memory_match' ? (
        <View>
          <Text style={{ fontSize: 18, color: '#5C4A3A', marginBottom: 8 }}>
            {matches}/{pairs}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {tiles.map((tile) => {
              const open = flipped.includes(tile.tileId) || lockedIds.includes(tile.tileId);
              return (
                <Pressable
                  key={tile.tileId}
                  accessibilityRole="button"
                  accessibilityLabel={open ? tile.label : t(language, 'memoryMatch')}
                  disabled={busy || !!done}
                  onPress={() => flipTile(tile)}
                  style={({ pressed }) => ({
                    width: '47%',
                    minHeight: 96,
                    backgroundColor: lockedIds.includes(tile.tileId) ? '#1F6F4A' : open ? '#FFFBFA' : '#0F3D2E',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    opacity: pressed ? 0.88 : 1,
                    borderWidth: open && !lockedIds.includes(tile.tileId) ? 2 : 0,
                    borderColor: '#E0A100',
                  })}
                >
                  <Text
                    style={{
                      color: open && !lockedIds.includes(tile.tileId) ? '#0F3D2E' : '#FFFBFA',
                      fontSize: 22,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                  >
                    {open ? tile.label : '•'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {type === 'attention' ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          {((payload.options as { id: string; label?: string }[]) ?? []).map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={opt.label ?? opt.id}
              disabled={!!done}
              onPress={() => finish({ chosenId: opt.id })}
              style={({ pressed }) => ({
                minHeight: 80,
                borderRadius: 20,
                backgroundColor: '#0F3D2E',
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

      {type === 'pattern_recognition' ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          <View
            style={{
              minHeight: 72,
              borderRadius: 20,
              backgroundColor: String(payload.targetColor ?? '#1F6F4A'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel={t(language, 'pattern')}
          >
            <Text style={{ color: '#FFFBFA', fontSize: 22, fontWeight: '700' }}>{t(language, 'pattern')}</Text>
          </View>
          {((payload.options as { id: string; color?: string }[]) ?? []).map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={opt.id}
              disabled={!!done}
              onPress={() => finish({ chosenId: opt.id })}
              style={({ pressed }) => ({
                minHeight: 80,
                borderRadius: 20,
                backgroundColor: opt.color ?? '#0F3D2E',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ color: '#FFFBFA', fontSize: 22, fontWeight: '700', textTransform: 'capitalize' }}>
                {opt.id}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {type === 'daily_routine' ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          <Text style={{ fontSize: 18, color: '#5C4A3A' }}>
            {order.length}/{(payload.correctOrder as string[]).length}
          </Text>
          {(payload.steps as { id: string; label: string }[]).map((step) => {
            const used = order.includes(step.id);
            return (
              <BigButton
                key={step.id}
                label={used ? `${order.indexOf(step.id) + 1}. ${step.label}` : step.label}
                disabled={used || !!done}
                onPress={() => {
                  const next = [...order, step.id];
                  setOrder(next);
                  if (next.length === (payload.correctOrder as string[]).length) finish({ order: next });
                }}
              />
            );
          })}
        </View>
      ) : null}

      {type === 'emotional_engagement' ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {(payload.choices as { id: string; label: string }[]).map((c) => (
            <BigButton key={c.id} label={c.label} disabled={!!done} onPress={() => finish({ mood: c.id })} tone="accent" />
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
