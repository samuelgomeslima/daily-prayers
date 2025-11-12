import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ConfirmEmailScreen() {
  const { confirmEmail } = useAuth();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
  const [message, setMessage] = useState<string>('Confirmando endereço de e-mail...');
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  useEffect(() => {
    if (!token || typeof token !== 'string') {
      setStatus('error');
      setMessage('Token de confirmação ausente. Verifique o link recebido no e-mail.');
      return;
    }

    let isMounted = true;

    (async () => {
      const result = await confirmEmail(token);

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setStatus('success');
        setMessage(result.message ?? 'E-mail confirmado com sucesso. Faça login para continuar.');
      } else {
        setStatus('error');
        setMessage(result.message ?? 'Não foi possível confirmar o e-mail. Solicite um novo link de confirmação.');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [confirmEmail, token]);

  return (
    <ThemedView style={styles.container} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
      <View style={[styles.card, { borderColor: `${palette.border}66`, backgroundColor: palette.surface }]}>
        <ThemedText type="title" style={styles.title}>Confirmação de e-mail</ThemedText>
        <View style={styles.feedbackRow}>
          {status === 'waiting' ? (
            <ActivityIndicator size="small" color={palette.tint} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: status === 'success' ? '#16A34A' : '#DC2626' }]} />
          )}
          <ThemedText style={styles.message}>{message}</ThemedText>
        </View>

        <Pressable
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: palette.tint, opacity: pressed ? 0.9 : 1 },
          ]}>
          <ThemedText style={styles.buttonLabel}>
            {status === 'success' ? 'Ir para o login' : 'Voltar para o login'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    gap: 16,
    shadowColor: '#00000022',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
