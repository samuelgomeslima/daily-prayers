import { type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LoginView } from '@/components/login-view';

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <HolySpiritSymbol size={160} opacity={0.12} pointerEvents="none" />
        <ActivityIndicator size="large" color={palette.tint} />
        <ThemedText style={styles.loadingText}>
          Carregando suas informações seguras...
        </ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
