import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { ModelSettingsProvider } from '@/contexts/model-settings-context';
import { useAuth } from '@/hooks/use-auth';
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
    <AuthProvider>
      <ModelSettingsProvider>
        <ThemeProvider value={navigationTheme}>
          <AppRouter statusBarStyle={statusBarStyle} statusBarBackground={navigationTheme.colors.background} />
        </ThemeProvider>
      </ModelSettingsProvider>
    </AuthProvider>
  );
}

type AppRouterProps = {
  statusBarStyle: 'light' | 'dark';
  statusBarBackground: string;
};

function AppRouter({ statusBarStyle, statusBarBackground }: AppRouterProps) {
  const { status } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const stackKey = status === 'authenticated' ? 'auth-stack' : 'guest-stack';

  if (status === 'checking') {
    return (
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}
      >
        <ActivityIndicator size="large" color={palette.tint} />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return (
      <>
        <Stack key={stackKey}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={statusBarStyle} backgroundColor={statusBarBackground} />
      </>
    );
  }

  return (
    <>
      <Stack key={stackKey}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ title: 'IA Católica' }} />
        <Stack.Screen name="life-plan" options={{ title: 'Plano de Vida', headerShown: false }} />
        <Stack.Screen name="notes" options={{ title: 'Anotações' }} />
        <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={statusBarStyle} backgroundColor={statusBarBackground} />
    </>
  );
}
