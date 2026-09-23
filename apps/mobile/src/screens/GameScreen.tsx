import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getGame } from '@cognigame/game-engine';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { queueChange } from '../db/sync';

type Tile = { tileId: string; assetId: string; label: string; emoji?: string };
type Choice = { id: string; label?: string; emoji?: string; color?: string; glyph?: string };

const ink = '#14110F';
const forest = '#0F3D2E';
const paper = '#FFFBFA';
const bark = '#5C4A3A';
const turmeric = '#E0A100';

function sessionId() {
  return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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
    try {
      queueChange(
        'game_sessions',
        {
          id: sessionId(),
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
        },
        'created',
      );
    } catch {
      // A failed local queue must not block the round result.
    }
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
      <Text style={{ fontSize: 32, fontWeight: '700', color: forest, lineHeight: 40 }}>
        {t(language, round.promptKey)}
      </Text>
      <BigButton label={t(language, 'listen')} onPress={() => speak(language, round.narrationKey)} tone="ghost" />

      {type === 'memory_match' ? (
        <View>
          <Text style={{ fontSize: 20, color: bark, marginBottom: 12, fontWeight: '600' }}>
            {matches}/{pairs}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 }}>
            {tiles.map((tile) => {
              const matched = lockedIds.includes(tile.tileId);
              const open = flipped.includes(tile.tileId) || matched;
              return (
                <Pressable
                  key={tile.tileId}
                  accessibilityRole="button"
                  accessibilityLabel={open ? tile.label : t(language, 'memoryMatch')}
                  disabled={busy || !!done}
                  onPress={() => flipTile(tile)}
                  style={({ pressed }) => ({
                    width: '48%',
                    minHeight: 120,
                    backgroundColor: matched ? '#1F6F4A' : open ? paper : forest,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 12,
                    opacity: pressed ? 0.88 : 1,
                    borderWidth: 2,
                    borderColor: open && !matched ? turmeric : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 36, lineHeight: 44 }}>{open ? tile.emoji ?? '★' : '?'}</Text>
                  <Text
                    style={{
                      color: matched ? paper : open ? forest : paper,
                      fontSize: 18,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    {open ? tile.label : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {type === 'attention' ? (
        <View style={{ gap: 12, marginTop: 8 }}>
          {((payload.options as Choice[]) ?? []).map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={opt.label ?? opt.id}
              disabled={!!done}
              onPress={() => finish({ chosenId: opt.id })}
              style={({ pressed }) => ({
                minHeight: 88,
                borderRadius: 20,
                backgroundColor: paper,
                borderWidth: 2,
                borderColor: '#E4EDE6',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                gap: 14,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontSize: 36 }}>{opt.emoji ?? '•'}</Text>
              <Text style={{ color: ink, fontSize: 24, fontWeight: '700', flex: 1 }}>{opt.label ?? opt.id}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {type === 'pattern_recognition' ? (
        <View style={{ gap: 12, marginTop: 8 }}>
          <View
            style={{
              minHeight: 120,
              borderRadius: 20,
              backgroundColor: paper,
              borderWidth: 3,
              borderColor: turmeric,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
            accessibilityLabel={t(language, 'pattern')}
          >
            <Text style={{ fontSize: 56, color: String(payload.targetColor ?? forest), lineHeight: 64 }}>
              {String(payload.targetGlyph ?? '●')}
            </Text>
            <Text style={{ color: ink, fontSize: 22, fontWeight: '700', marginTop: 4 }}>
              {String(payload.targetLabel ?? t(language, 'pattern'))}
            </Text>
          </View>
          {((payload.options as Choice[]) ?? []).map((opt) => (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityLabel={opt.label ?? opt.id}
              disabled={!!done}
              onPress={() => finish({ chosenId: opt.id })}
              style={({ pressed }) => ({
                minHeight: 88,
                borderRadius: 20,
                backgroundColor: paper,
                borderWidth: 2,
                borderColor: '#E4EDE6',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                gap: 14,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontSize: 36, color: opt.color ?? forest }}>{opt.glyph ?? '●'}</Text>
              <Text style={{ color: ink, fontSize: 24, fontWeight: '700', flex: 1 }}>{opt.label ?? opt.id}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {type === 'daily_routine' ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ fontSize: 20, color: bark, fontWeight: '600' }}>
            {order.length}/{(payload.correctOrder as string[]).length}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {order.map((id, index) => {
              const step = (payload.steps as { id: string; label: string }[]).find((s) => s.id === id);
              return (
                <View
                  key={id}
                  style={{
                    backgroundColor: forest,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: paper, fontSize: 16, fontWeight: '700' }}>
                    {index + 1}. {step?.label ?? id}
                  </Text>
                </View>
              );
            })}
          </View>
          {(payload.steps as { id: string; label: string }[]).map((step) => {
            const used = order.includes(step.id);
            return (
              <BigButton
                key={step.id}
                label={step.label}
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
        <View style={{ gap: 12, marginTop: 8 }}>
          {(payload.choices as { id: string; label: string; emoji?: string }[]).map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              disabled={!!done}
              onPress={() => finish({ mood: c.id })}
              style={({ pressed }) => ({
                minHeight: 88,
                borderRadius: 20,
                backgroundColor: paper,
                borderWidth: 2,
                borderColor: '#E4EDE6',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 18,
                gap: 14,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontSize: 36 }}>{c.emoji ?? '•'}</Text>
              <Text style={{ color: ink, fontSize: 24, fontWeight: '700', flex: 1 }}>{c.label}</Text>
            </Pressable>
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
