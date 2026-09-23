import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { GameType } from '@cognigame/shared-types';
import { PairScreen } from './src/screens/PairScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { GameScreen } from './src/screens/GameScreen';
import { RemindersScreen } from './src/screens/RemindersScreen';
import { ErrorBoundary } from './src/ui/ErrorBoundary';
import './global.css';

export type RootStack = {
  Pair: undefined;
  Home: undefined;
  Game: { type: GameType };
  Reminders: undefined;
};

const Stack = createNativeStackNavigator<RootStack>();

export default function App() {
  const [paired, setPaired] = useState(false);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
              {!paired ? (
                <Stack.Screen name="Pair">
                  {() => <PairScreen onPaired={() => setPaired(true)} />}
                </Stack.Screen>
              ) : (
                <>
                  <Stack.Screen name="Home">
                    {({ navigation }) => (
                      <HomeScreen
                        onPlay={(type) => navigation.navigate('Game', { type })}
                        onReminders={() => navigation.navigate('Reminders')}
                      />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Game">
                    {({ route, navigation }) => (
                      <GameScreen type={route.params.type} onExit={() => navigation.goBack()} />
                    )}
                  </Stack.Screen>
                  <Stack.Screen name="Reminders">
                    {({ navigation }) => <RemindersScreen onBack={() => navigation.goBack()} />}
                  </Stack.Screen>
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
