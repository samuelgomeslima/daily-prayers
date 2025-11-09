import { useCallback, useMemo, useState } from 'react';
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

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

type AuthMode = 'login' | 'register';

type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name';
  textContentType?: 'emailAddress' | 'password' | 'name';
};

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
}: InputFieldProps) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'surface');
  const placeholderColor = useThemeColor({ light: '#7B83C0', dark: '#A0A8E6' }, 'icon');

  return (
    <View style={styles.fieldContainer}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        textContentType={textContentType}
        style={[styles.input, { borderColor, color: textColor, backgroundColor }]}
      />
    </View>
  );
}

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const accentColor = useThemeColor({}, 'tint');
  const surface = useThemeColor({}, 'surface');
  const overlay = useThemeColor({}, 'overlay');
  const textColor = useThemeColor({}, 'text');
  const mutedText = useThemeColor({ light: '#5E6598', dark: '#B2B9EA' }, 'icon');

  const { login, register } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta';
  const description =
    mode === 'login'
      ? 'Acesse seu companheiro de oração com seus dados cadastrados.'
      : 'Cadastre-se para acompanhar suas orações, plano de vida e anotações em qualquer dispositivo.';

  const toggleLabel =
    mode === 'login'
      ? 'Não tem conta? Cadastre-se'
      : 'Já possui cadastro? Fazer login';

  const canSubmit = useMemo(() => {
    if (isSubmitting) {
      return false;
    }

    if (!email.trim() || !password.trim()) {
      return false;
    }

    if (mode === 'register' && !displayName.trim()) {
      return false;
    }

    return true;
  }, [displayName, email, isSubmitting, mode, password]);

  const handleToggleMode = useCallback(() => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        email: email.trim(),
        password: password.trim(),
      };

      if (mode === 'login') {
        await login(payload);
      } else {
        await register({ ...payload, displayName: displayName.trim() });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível completar a operação. Tente novamente em instantes.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, displayName, email, login, mode, password, register]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.flexContainer}>
      <ThemedView style={[styles.container, { backgroundColor: surface }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[styles.logoWrapper, { backgroundColor: overlay }]}>
            <HolySpiritSymbol size={64} color={accentColor} />
          </View>
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: textColor }]}>{title}</ThemedText>
            <ThemedText style={[styles.subtitle, { color: mutedText }]}>{description}</ThemedText>
          </View>
          <View style={styles.form}>
            <InputField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="voce@exemplo.com"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {mode === 'register' ? (
              <InputField
                label="Nome"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Como devemos chamar você?"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
              />
            ) : null}
            <InputField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
          </View>
          {errorMessage ? (
            <ThemedText style={[styles.errorMessage, { color: palette.negative }]}>{errorMessage}</ThemedText>
          ) : null}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: canSubmit ? palette.tint : `${palette.tint}80`,
                shadowColor: `${palette.tint}44`,
              },
              pressed && canSubmit ? styles.primaryButtonPressed : null,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonLabel} type="defaultSemiBold">
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
              </ThemedText>
            )}
          </Pressable>
          <Pressable onPress={handleToggleMode} style={styles.toggleButton}>
            <ThemedText style={[styles.toggleLabel, { color: accentColor }]}>{toggleLabel}</ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  logoWrapper: {
    alignSelf: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  header: {
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorMessage: {
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonLabel: {
    color: '#fff',
    fontSize: 17,
  },
  toggleButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 15,
  },
});
