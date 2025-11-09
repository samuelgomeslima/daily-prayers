import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ApiError } from '@/utils/api-client';

export default function LoginScreen() {
  const { status, login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/(tabs)');
    }
  }, [router, status]);

  const handleSubmit = useCallback(async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      Alert.alert('Acesso', 'Informe e-mail e senha para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: normalizedEmail, password: normalizedPassword });
      setEmail('');
      setPassword('');
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof ApiError) {
        Alert.alert('Não foi possível entrar', error.message);
      } else {
        Alert.alert('Não foi possível entrar', 'Tente novamente em instantes.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, login, router]);

  return (
    <ThemedView style={styles.container} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 80, android: 0, default: 0 })}
      >
        <View style={styles.heroContainer}>
          <HolySpiritSymbol size={160} opacity={0.15} style={styles.heroSymbol} />
          <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
            Daily Prayers
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Entre com suas credenciais para acessar suas práticas, anotações e progresso espiritual sincronizados.
          </ThemedText>
        </View>

        <ThemedView
          style={[styles.formContainer, { borderColor: `${palette.border}66`, shadowColor: `${palette.tint}1A` }]}
          lightColor={Colors.light.surface}
          darkColor={Colors.dark.surface}
        >
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>E-mail</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              placeholder="voce@exemplo.com"
              placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#6B7280'}
              style={[styles.input, { color: palette.text, borderColor: `${palette.border}88`, backgroundColor: palette.surface }]}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Senha</ThemedText>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              placeholder="Digite sua senha"
              placeholderTextColor={colorScheme === 'dark' ? '#94A3B8' : '#6B7280'}
              style={[styles.input, { color: palette.text, borderColor: `${palette.border}88`, backgroundColor: palette.surface }]}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: palette.tint,
                opacity: pressed || isSubmitting ? 0.8 : 1,
              },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={palette.background} />
            ) : (
              <ThemedText style={styles.submitLabel} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
                Entrar
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>

        <View style={styles.hintBox}>
          <ThemedText style={styles.hintText}>
            Precisa de uma conta? Solicite ao administrador para criar um usuário no painel administrativo.
          </ThemedText>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  heroSymbol: {
    position: 'absolute',
    top: -40,
    opacity: 0.12,
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  formContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 20,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 3,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  hintBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.75,
  },
});
