import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getGame } from '@cognigame/game-engine';
import { t, type GameType } from '@cognigame/shared-types';
import { BigButton } from '../ui/BigButton';
import { Screen } from '../ui/Screen';
import { useSession } from '../state/session';
import { speak } from '../voice/tts';
import { queueChange, synchronizeIfOnline } from '../db/sync';

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
  const [roundNonce, setRoundNonce] = useState(0);
  const round = useMemo(
    () => game.buildRound(difficulty, language),
    [game, language, difficulty, roundNonce],
  );
  const started = useRef(Date.now());
  const [matches, setMatches] = useState(0);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);

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
    const finishedAt = Date.now();
    const result = game.score({ raw }, round, { startedAtMs: started.current, finishedAtMs: finishedAt });
    const id = sessionId();
    try {
      queueChange(
        'game_sessions',
        {
          id,
          patientId: useSession.getState().patientId,
          gameType: result.gameType,
          difficultyLevel: result.difficultyLevel,
          score: result.score,
          accuracy: result.accuracy,
          reactionTimeMs: result.reactionTimeMs,
          completedAt: finishedAt,
          fieldClocks: { '*': finishedAt },
          metadata: result.metadata ?? {},
        },
        'created',
      );
      const mood = (raw as { mood?: string } | null)?.mood;
      if (result.gameType === 'emotional_engagement' && mood) {
        queueChange(
          'mood_check_ins',
          {
            id: `mood-${id}`,
            patientId: useSession.getState().patientId,
            mood,
            recordedAt: finishedAt,
            fieldClocks: { mood: finishedAt },
          },
          'created',
        );
      }
      useSession.getState().rememberSession({
        id,
        gameType: result.gameType,
        completedAt: finishedAt,
        accuracy: result.accuracy,
      });
      void synchronizeIfOnline();
    } catch {
      // A failed local queue must not block the round result.
    }
    const ok = result.gameType === 'emotional_engagement' || result.accuracy >= 0.5;
    setPassed(ok);
    setDone(ok ? t(language, 'wellDone') : t(language, 'tryAgain'));
    speak(language, ok ? 'wellDone' : 'tryAgain');
  }

  function playAgain() {
    started.current = Date.now();
    setMatches(0);
    setFlipped([]);
    setLockedIds([]);
    setBusy(false);
    setOrder([]);
    setDone(null);
    setPassed(null);
    setRoundNonce((n) => n + 1);
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
      <Text style={{ fontSize: 32, fontWeight: '700', color: forest, lineHeight: 40, marginBottom: 16 }}>
        {t(language, round.promptKey)}
      </Text>

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
                  <Text style={{ fontSize: 36, lineHeight: 44, color: open && !matched ? ink : paper }}>
                    {open ? tile.emoji ?? '★' : '?'}
                  </Text>
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
              <Text style={{ fontSize: 36, color: ink }}>{opt.emoji ?? '•'}</Text>
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
          <View style={{ gap: 8 }}>
            {order.map((id, index) => {
              const step = (payload.steps as { id: string; label: string }[]).find((s) => s.id === id);
              return (
                <View
                  key={id}
                  style={{
                    backgroundColor: paper,
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 2,
                    borderColor: '#E4EDE6',
                  }}
                >
                  <Text style={{ color: ink, fontSize: 22, fontWeight: '700' }}>
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
              <Text style={{ fontSize: 36, color: ink }}>{c.emoji ?? '•'}</Text>
              <Text style={{ color: ink, fontSize: 24, fontWeight: '700', flex: 1 }}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {done ? (
        <View style={{ marginTop: 20, gap: 8 }}>
          <Text style={{ fontSize: 28, color: passed ? '#1F6F4A' : '#9B1D20', fontWeight: '700' }}>{done}</Text>
          {passed === false ? (
            <BigButton label={t(language, 'retry')} onPress={playAgain} tone="accent" />
          ) : null}
        </View>
      ) : null}
      <BigButton label={t(language, 'done')} onPress={onExit} tone="ghost" />
    </Screen>
  );
}
