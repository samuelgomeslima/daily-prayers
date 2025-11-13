import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
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
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { resolveApiEndpoint } from '@/utils/chat-endpoint';

const FEEDBACK_OPTIONS = [
  { value: 'suggestion', label: 'Sugestão' },
  { value: 'issue', label: 'Erro' },
  { value: 'compliment', label: 'Elogio' },
] as const;

type FeedbackType = (typeof FEEDBACK_OPTIONS)[number]['value'];

export default function SupportScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const background = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const mutedText = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'icon');

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportEndpoint = useMemo(
    () =>
      resolveApiEndpoint('/api/support-email', {
        envKeys: ['EXPO_PUBLIC_SUPPORT_BASE_URL', 'EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_SITE_URL'],
        extraKeys: ['supportBaseUrl', 'apiBaseUrl'],
      }),
    []
  );

  const handleSubmit = useCallback(async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      Alert.alert('Suporte', 'Descreva sua mensagem antes de enviar.');
      return;
    }

    if (!supportEndpoint) {
      Alert.alert(
        'Suporte indisponível',
        'Não foi possível determinar o endpoint de suporte. Verifique as variáveis EXPO_PUBLIC_SUPPORT_BASE_URL ou EXPO_PUBLIC_API_BASE_URL antes de tentar novamente.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(supportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          name: name.trim() || undefined,
          contact: contact.trim() || undefined,
          message: trimmedMessage,
        }),
      });

      if (!response.ok) {
        let extractedMessage: string | null = null;

        try {
          const payload = await response.json();
          const candidate = payload?.error?.message;
          if (typeof candidate === 'string' && candidate.trim()) {
            extractedMessage = candidate.trim();
          }
        } catch {
          // ignore parsing errors and fall back to the default message
        }

        throw new Error(
          extractedMessage ?? 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.'
        );
      }

      Alert.alert('Mensagem enviada', 'Recebemos sua mensagem e entraremos em contato se necessário.');
      setMessage('');
      setName('');
      setContact('');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar sua mensagem agora. Tente novamente em instantes.';
      Alert.alert('Não foi possível enviar a mensagem', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [contact, feedbackType, message, name, supportEndpoint]);

  return (
    <ThemedView style={styles.safeArea}>
      <HolySpiritSymbol size={200} opacity={0.08} style={styles.symbolTop} pointerEvents="none" />
      <HolySpiritSymbol size={160} opacity={0.08} style={styles.symbolBottom} pointerEvents="none" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 88, default: 0 })}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="title">Suporte ao usuário</ThemedText>
            <ThemedText style={[styles.intro, { color: mutedText }]}>
              Use este espaço para relatar erros, sugerir melhorias ou compartilhar elogios.
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: surface, borderColor: `${border}80` }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Tipo de mensagem
            </ThemedText>
            <View style={styles.typeRow}>
              {FEEDBACK_OPTIONS.map((option) => {
                const selected = option.value === feedbackType;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setFeedbackType(option.value)}
                    style={({ pressed }) => [
                      styles.typeButton,
                      {
                        borderColor: selected ? palette.tint : `${border}80`,
                        backgroundColor: selected ? `${palette.tint}1A` : background,
                      },
                      pressed && { opacity: 0.85 },
                    ]}
                    disabled={isSubmitting}
                  >
                    <IconSymbol
                      name={selected ? 'checkmark.circle.fill' : 'circle'}
                      size={20}
                      color={selected ? palette.tint : mutedText}
                    />
                    <ThemedText style={styles.typeLabel}>{option.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Nome (opcional)</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Como podemos te chamar?"
                placeholderTextColor={mutedText}
                style={[styles.textInput, { borderColor: `${border}80`, backgroundColor: background }]}
                autoCapitalize="words"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Contato (opcional)</ThemedText>
              <TextInput
                value={contact}
                onChangeText={setContact}
                placeholder="E-mail ou telefone para retorno"
                placeholderTextColor={mutedText}
                style={[styles.textInput, { borderColor: `${border}80`, backgroundColor: background }]}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <ThemedText style={styles.fieldLabel}>Mensagem</ThemedText>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Conte todos os detalhes que achar relevantes."
                placeholderTextColor={mutedText}
                style={[
                  styles.textInput,
                  styles.messageInput,
                  { borderColor: `${border}80`, backgroundColor: background },
                ]}
                multiline
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: palette.tint,
                  opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <IconSymbol name="paperplane.fill" size={18} color="#fff" />
              <ThemedText style={styles.submitLabel} lightColor="#fff" darkColor="#fff">
                {isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 20,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2,
  },
  cardTitle: {
    marginBottom: -8,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  messageInput: {
    minHeight: 160,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  symbolTop: {
    position: 'absolute',
    top: -60,
    right: -40,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    transform: [{ rotate: '-8deg' }],
  },
});
