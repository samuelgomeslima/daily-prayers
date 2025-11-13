import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ModelSettingsProvider } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const lightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      primary: Colors.light.tint,
      card: Colors.light.surface,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  };

  const darkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      primary: Colors.dark.tint,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  };

  const navigationTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';

  return (
    <ModelSettingsProvider>
      <ThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat"
            options={{ title: 'IA Católica' }}
          />
          <Stack.Screen
            name="life-plan"
            options={{ title: 'Plano de Vida', headerShown: false }}
          />
          <Stack.Screen
            name="notes"
            options={{ title: 'Anotações' }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: 'Configurações' }}
          />
          <Stack.Screen
            name="support"
            options={{ title: 'Suporte' }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: 'modal', title: 'Modal' }}
          />
        </Stack>
        <StatusBar style={statusBarStyle} backgroundColor={navigationTheme.colors.background} />
      </ThemeProvider>
    </ModelSettingsProvider>
  );
}
