import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function AuthToggle({
  mode,
  onToggle,
}: {
  mode: 'login' | 'register';
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.toggleContainer}>
      <ThemedText style={styles.toggleText}>
        {mode === 'login'
          ? 'Ainda não possui uma conta? Cadastre-se'
          : 'Já possui cadastro? Entre na sua conta'}
      </ThemedText>
    </Pressable>
  );
}

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const router = useRouter();
  const { user, login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [router, user]);

  const title = mode === 'login' ? 'Entrar' : 'Criar conta';
  const submitLabel = mode === 'login' ? 'Entrar' : 'Cadastrar';

  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Acesse seu plano espiritual, anotações e recursos exclusivos após realizar o login.'
        : 'Crie uma conta gratuita para salvar suas anotações e acompanhar sua jornada de oração.',
    [mode]
  );

  const handleSubmit = async () => {
    setError(null);

    try {
      if (mode === 'login') {
        await login({ email: email.trim().toLowerCase(), password });
      } else {
        await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
      }
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : 'Não foi possível concluir a solicitação.';
      setError(message);
    }
  };

  const isSubmitDisabled =
    isLoading ||
    !email.trim() ||
    !password.trim() ||
    (mode === 'register' && name.trim().length < 2);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedView style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            <ThemedText style={styles.description}>{description}</ThemedText>

            {mode === 'register' ? (
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Nome completo</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Maria de Lourdes"
                  placeholderTextColor={palette.icon}
                  autoCapitalize="words"
                  style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                  returnKeyType="next"
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>E-mail</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                placeholderTextColor={palette.icon}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Senha</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo de 6 caracteres"
                placeholderTextColor={palette.icon}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                style={[styles.input, { borderColor: palette.border, color: palette.text }]}
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (!isSubmitDisabled) {
                    void handleSubmit();
                  }
                }}
              />
            </View>

            {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : null}

            <Pressable
              onPress={() => {
                if (!isSubmitDisabled) {
                  void handleSubmit();
                }
              }}
              disabled={isSubmitDisabled}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: palette.tint,
                  opacity: isSubmitDisabled ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.background} />
              ) : (
                <ThemedText style={styles.submitLabel}>{submitLabel}</ThemedText>
              )}
            </Pressable>

            <AuthToggle
              mode={mode}
              onToggle={() => {
                setMode((current) => (current === 'login' ? 'register' : 'login'));
                setError(null);
              }}
            />
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    fontSize: 16,
    opacity: 0.8,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  toggleContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
