import { Pressable, Text, type GestureResponderEvent } from 'react-native';

const TONES = {
  primary: { bg: '#0F3D2E', fg: '#FFFBFA' },
  accent: { bg: '#E0A100', fg: '#14110F' },
  danger: { bg: '#9B1D20', fg: '#FFFBFA' },
  ghost: { bg: '#E4EDE6', fg: '#14110F' },
} as const;

export function BigButton({
  label,
  onPress,
  tone = 'primary',
  compact,
  disabled,
}: {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  tone?: keyof typeof TONES;
  compact?: boolean;
  disabled?: boolean;
}) {
  const colors = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: 'rgba(20,17,15,0.12)' }}
      style={({ pressed }) => ({
        minHeight: compact ? 64 : 72,
        minWidth: compact ? 64 : 72,
        borderRadius: 24,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginVertical: 8,
        opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
      })}
    >
      <Text style={{ color: colors.fg, fontSize: compact ? 20 : 24, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
