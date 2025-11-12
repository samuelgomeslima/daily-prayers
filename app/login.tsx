import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

const EMAIL_PLACEHOLDER = 'seu-email@exemplo.com';

export default function LoginScreen() {
  const router = useRouter();
  const { login, register, continueAsGuest, status } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const headerTitle = mode === 'login' ? 'Acesse sua conta' : 'Crie uma nova conta';
  const primaryButtonLabel = mode === 'login' ? 'Entrar' : 'Cadastrar';
  const switchLabel = mode === 'login' ? 'Criar conta' : 'Já tenho uma conta';

  const disabled = isSubmitting || !email || password.length < 8 || (mode === 'register' && !name.trim());

  const handleSwitchMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setFeedback(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (mode === 'login') {
        const result = await login(email.trim(), password);

        if (!result.success) {
          setFeedback(result.message ?? 'Não foi possível entrar. Verifique suas credenciais.');
          return;
        }

        router.replace('/');
        return;
      }

      const result = await register({ email: email.trim(), password, name: name.trim() });

      if (!result.success) {
        setFeedback(result.message ?? 'Não foi possível concluir o cadastro agora.');
        return;
      }

      setFeedback(
        result.message ??
          'Cadastro realizado com sucesso. Enviamos um e-mail com o link para confirmação. Depois de confirmar, volte para fazer login.'
      );
      setMode('login');
    } finally {
      setIsSubmitting(false);
    }
  }, [disabled, email, login, mode, name, password, register, router]);

  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Entre para sincronizar seus dados espirituais, acompanhar planos de vida e salvar suas preferências.'
        : 'Crie sua conta gratuita para registrar orações, acompanhar o plano de vida e escolher os modelos de IA preferidos.',
    [mode]
  );

  const infoMessage = mode === 'register'
    ? 'Após o cadastro, confirme o e-mail enviado para ativar sua conta.'
    : 'Se ainda não confirmou seu e-mail, procure o link de ativação na sua caixa de entrada.';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [router, status]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}>
      <ThemedView style={styles.container} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
        <HolySpiritSymbol size={240} opacity={0.1} style={styles.symbolTop} />
        <HolySpiritSymbol size={200} opacity={0.08} style={styles.symbolBottom} />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                {headerTitle}
              </ThemedText>
              <ThemedText style={styles.subtitle}>{description}</ThemedText>
            </View>

            {mode === 'register' ? (
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.fieldLabel}>Nome completo</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Como podemos chamar você?"
                  placeholderTextColor={`${palette.text}66`}
                  style={[styles.input, { borderColor: `${palette.border}80`, color: palette.text }]}
                  autoCapitalize="words"
                  textContentType="name"
                  returnKeyType="next"
                />
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>E-mail</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder={EMAIL_PLACEHOLDER}
                placeholderTextColor={`${palette.text}66`}
                style={[styles.input, { borderColor: `${palette.border}80`, color: palette.text }]}
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Senha</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Mínimo de 8 caracteres"
                placeholderTextColor={`${palette.text}66`}
                style={[styles.input, { borderColor: `${palette.border}80`, color: palette.text }]}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            <ThemedText style={[styles.infoMessage, { color: `${palette.text}80` }]}>
              {infoMessage}
            </ThemedText>

            {feedback ? (
              <ThemedText style={[styles.feedback, { color: palette.tint }]}>{feedback}</ThemedText>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={disabled}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: disabled ? `${palette.tint}55` : palette.tint,
                  transform: [{ translateY: pressed && !disabled ? 1 : 0 }],
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.primaryLabel}>{primaryButtonLabel}</ThemedText>
              )}
            </Pressable>

            <Pressable onPress={handleSwitchMode} style={styles.switchModeButton}>
              <ThemedText style={[styles.switchModeLabel, { color: palette.tint }]}>{switchLabel}</ThemedText>
            </Pressable>

            <View style={styles.guestContainer}>
              <ThemedText style={styles.guestLabel}>Quer explorar antes?</ThemedText>
              <Pressable
                onPress={() => {
                  void continueAsGuest();
                  router.replace('/');
                }}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  {
                    borderColor: `${palette.tint}80`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <ThemedText style={[styles.secondaryLabel, { color: palette.tint }]}>Continuar como convidado</ThemedText>
              </Pressable>
            </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  content: {
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.75,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.85,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  infoMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedback: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00000033',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
  },
  switchModeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  guestContainer: {
    marginTop: 12,
    gap: 8,
    alignItems: 'center',
  },
  guestLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  secondaryButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  symbolTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -70,
    left: -30,
    transform: [{ rotate: '-6deg' }],
  },
});
