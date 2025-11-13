import { DarkTheme, DefaultTheme, ThemeProvider, useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { ModelSettingsProvider } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { user, isInitializing } = useAuth();
  const theme = useTheme();
  const isAuthenticated = Boolean(user);

  if (isInitializing) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ title: 'IA Católica' }} />
      <Stack.Screen
        name="life-plan"
        options={{ title: 'Plano de Vida', headerShown: false }}
      />
      <Stack.Screen name="notes" options={{ title: 'Anotações' }} />
      <Stack.Screen name="settings" options={{ title: 'Configurações' }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', title: 'Modal' }}
      />
    </Stack>
  );
}

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
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <RootNavigator />
          <StatusBar style={statusBarStyle} backgroundColor={navigationTheme.colors.background} />
        </ThemeProvider>
      </AuthProvider>
    </ModelSettingsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
