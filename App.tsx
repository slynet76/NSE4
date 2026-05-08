import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '@/screens/HomeScreen';
import LessonScreen from '@/screens/LessonScreen';
import QuizScreen from '@/screens/QuizScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { initDb } from '@/lib/db';
import { ensurePermissions, getReminder, scheduleDailyReminder } from '@/lib/notifications';
import { theme } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: theme.bg,
    card: theme.bg,
    text: theme.text,
    border: theme.border,
    primary: theme.primary,
  },
};

export default function App() {
  useEffect(() => {
    initDb();
    (async () => {
      await ensurePermissions();
      const r = await getReminder();
      if (r.enabled) await scheduleDailyReminder(r.hour, r.minute, true);
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.text,
            contentStyle: { backgroundColor: theme.bg },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: 'Leçon' }} />
          <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quiz' }} />
          <Stack.Screen
            name="Progress"
            component={ProgressScreen}
            options={{ title: 'Progression' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Réglages' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
