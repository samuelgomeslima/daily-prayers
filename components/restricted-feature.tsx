import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

type RestrictedFeatureProps = {
  featureName: string;
  children?: ReactNode;
};

export function RestrictedFeature({ featureName, children }: RestrictedFeatureProps) {
  const { status, continueAsGuest } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  if (status === 'loading') {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={palette.tint} />
        <ThemedText style={styles.loadingText}>Carregando sessão...</ThemedText>
      </ThemedView>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'unauthenticated') {
    return (
      <ThemedView style={styles.wrapper} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
        <View style={[styles.card, { borderColor: `${palette.border}66`, backgroundColor: palette.surface }]}
        >
          <ThemedText style={styles.title}>Entre para acessar {featureName}</ThemedText>
          <ThemedText style={styles.subtitle}>
            Crie uma conta gratuita para desbloquear este recurso. Você também pode continuar como convidado, com acesso
            limitado às páginas Home, Orações e Terços.
          </ThemedText>
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: palette.tint },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={styles.primaryLabel}>Fazer login ou cadastrar</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => continueAsGuest()}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: `${palette.tint}80` },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={[styles.secondaryLabel, { color: palette.tint }]}>Continuar como convidado</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.wrapper} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
      <View style={[styles.card, { borderColor: `${palette.border}66`, backgroundColor: palette.surface }]}
      >
        <ThemedText style={styles.title}>Recurso exclusivo para membros</ThemedText>
        <ThemedText style={styles.subtitle}>
          O recurso {featureName} está disponível somente para usuários autenticados. Faça login para aproveitar tudo o que o
          Daily Prayers oferece.
        </ThemedText>
        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: palette.tint },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText style={styles.primaryLabel}>Ir para a tela de login</ThemedText>
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#00000025',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
