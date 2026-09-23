import { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  footer,
  scroll = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4EDE1' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: 24 }}>{children}</View>
        )}
        {footer ? <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
