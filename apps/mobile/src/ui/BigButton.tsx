import { Pressable, Text } from 'react-native';

export function BigButton({
  label,
  onPress,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'accent' | 'danger' | 'ghost';
}) {
  const bg =
    tone === 'accent' ? '#E0A100' : tone === 'danger' ? '#9B1D20' : tone === 'ghost' ? '#E7F0EA' : '#0F3D2E';
  const color = tone === 'accent' || tone === 'ghost' ? '#14110F' : '#F6EFE4';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: 72,
        minWidth: 72,
        borderRadius: 24,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        marginVertical: 8,
      }}
    >
      <Text style={{ color, fontSize: 24, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
