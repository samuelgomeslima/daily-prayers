import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/contexts/auth-context';

type AuthMode = 'signIn' | 'signUp';

function validateEmail(email: string) {
  return /.+@.+\..+/.test(email.trim());
}

export function LoginView() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const inputBackground = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({ light: '#6D7699', dark: '#A1AAD6' }, 'icon');
  const accentColor = useThemeColor({}, 'tint');
  const overlayColor = useThemeColor({}, 'overlay');

  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggleMode = () => {
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!validateEmail(normalizedEmail)) {
      setError('Informe um e-mail válido.');
      return;
    }

    if (normalizedPassword.length < 6) {
      setError('A senha deve conter ao menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signIn') {
        const result = await signIn(normalizedEmail, normalizedPassword);

        if (!result.success) {
          setError(result.message ?? 'Não foi possível entrar.');
        }

        return;
      }

      const result = await signUp(normalizedEmail, normalizedPassword);

      if (!result.success) {
        setError(result.message ?? 'Não foi possível concluir o cadastro.');
        return;
      }

      setMode('signIn');
      setMessage(
        result.requiresConfirmation
          ? result.message ?? 'Confirme seu e-mail e, em seguida, entre com sua conta.'
          : 'Conta criada com sucesso. Faça login para continuar.'
      );
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ThemedView style={styles.container}>
        <HolySpiritSymbol size={220} opacity={0.12} style={styles.symbolTop} pointerEvents="none" />
        <HolySpiritSymbol size={180} opacity={0.08} style={styles.symbolBottom} pointerEvents="none" />

        <View style={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Daily Prayers
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: palette.icon }]}>
              Entre com sua conta para acessar suas orações, anotações e acompanhamentos.
            </ThemedText>
          </View>

          <ThemedView style={[styles.card, { borderColor, backgroundColor: inputBackground }]}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}
          >
            <ThemedText type="subtitle" style={styles.cardTitle}>
              {mode === 'signIn' ? 'Acessar conta' : 'Criar conta'}
            </ThemedText>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>E-mail</ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="seu-email@exemplo.com"
                placeholderTextColor={placeholderColor}
                style={[
                  styles.input,
                  { backgroundColor: overlayColor, borderColor, color: textColor },
                ]}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Senha</ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                autoCapitalize="none"
                style={[
                  styles.input,
                  { backgroundColor: overlayColor, borderColor, color: textColor },
                ]}
                editable={!isSubmitting}
              />
            </View>

            {error ? (
              <ThemedText style={[styles.feedback, styles.error]}>
                {error}
              </ThemedText>
            ) : null}

            {message ? (
              <ThemedText style={[styles.feedback, styles.message]}>
                {message}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: accentColor },
                pressed && !isSubmitting && styles.primaryButtonPressed,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.primaryButtonLabel}>
                  {mode === 'signIn' ? 'Entrar' : 'Cadastrar'}
                </ThemedText>
              )}
            </Pressable>

            <Pressable onPress={handleToggleMode} disabled={isSubmitting}>
              <ThemedText style={[styles.toggleText, { color: accentColor }]}> 
                {mode === 'signIn'
                  ? 'Não tem uma conta? Cadastre-se agora.'
                  : 'Já tem uma conta? Faça login.'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 18,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  feedback: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 18,
  },
  error: {
    color: '#DC2626',
  },
  message: {
    color: '#047857',
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  symbolTop: {
    position: 'absolute',
    top: -80,
    right: -60,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -90,
    left: -50,
    transform: [{ scaleX: -1 }],
  },
});
