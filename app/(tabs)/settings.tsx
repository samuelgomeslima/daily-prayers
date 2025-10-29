import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { LilyBackground } from '@/components/lily-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveChatEndpoint } from '@/utils/chat-endpoint';

const MODEL_LABELS = {
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-4o-mini': 'GPT-4o Mini',
} as const;

type ModelKey = keyof typeof MODEL_LABELS;

type AiAvailabilityState =
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; message: string; kind?: 'config' | 'network' | 'error' };

type ModelOptionButtonProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  accentColor: string;
  palette: (typeof Colors)['light'];
  isDark: boolean;
};

function ModelOptionButton({
  label,
  selected,
  disabled,
  onPress,
  accentColor,
  palette,
  isDark,
}: ModelOptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionButton,
        { borderColor: selected ? accentColor : palette.border, backgroundColor: palette.surface },
        selected && {
          backgroundColor: isDark
            ? 'rgba(184, 196, 255, 0.2)'
            : 'rgba(123, 116, 242, 0.12)',
        },
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <ThemedText style={styles.optionLabel} lightColor={palette.text} darkColor={palette.text}>
        {label}
      </ThemedText>
      {selected ? (
        <IconSymbol name="checkmark.circle.fill" size={24} color={accentColor} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [availability, setAvailability] = useState<AiAvailabilityState>({ status: 'checking' });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetAvailability = useCallback((value: AiAvailabilityState) => {
    if (isMountedRef.current) {
      setAvailability(value);
    }
  }, []);

  const checkAvailability = useCallback(async () => {
    safeSetAvailability({ status: 'checking' });

    const endpoint = resolveChatEndpoint();

    if (!endpoint) {
      safeSetAvailability({
        status: 'unavailable',
        message:
          'O endpoint da IA não está configurado. Defina EXPO_PUBLIC_CHAT_BASE_URL antes de usar os assistentes.',
        kind: 'config',
      });
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{}',
      });

      if (response.ok || response.status === 400) {
        safeSetAvailability({ status: 'available' });
        return;
      }

      let extractedMessage: string | null = null;

      try {
        const payload = await response.json();
        const candidate = payload?.error?.message;

        if (typeof candidate === 'string' && candidate.trim()) {
          extractedMessage = candidate.trim();
        }
      } catch {
        // Ignore JSON parsing errors and fall back to generic messaging.
      }

      let fallbackMessage =
        response.status >= 500
          ? 'A IA apresentou uma instabilidade. Tente novamente em instantes.'
          : 'Não foi possível validar a disponibilidade agora. Tente novamente em instantes.';

      if (response.status === 401 || response.status === 403) {
        fallbackMessage =
          'O servidor recusou a verificação de disponibilidade. Confira as credenciais configuradas.';
      } else if (response.status === 429) {
        fallbackMessage =
          'A IA atingiu o limite de uso temporariamente. Aguarde alguns minutos antes de tentar novamente.';
      }

      safeSetAvailability({
        status: 'unavailable',
        message: extractedMessage ?? fallbackMessage,
        kind: 'error',
      });
    } catch {
      safeSetAvailability({
        status: 'unavailable',
        message: 'Não foi possível conectar-se à IA. Verifique sua conexão e tente novamente.',
        kind: 'network',
      });
    }
  }, [safeSetAvailability]);

  useEffect(() => {
    void checkAvailability();
  }, [checkAvailability]);

  const {
    catechistModel,
    chatModel,
    setCatechistModel,
    setChatModel,
    isLoading,
    availableModels,
  } = useModelSettings();

  const modelItems = useMemo(
    () =>
      availableModels.map((model) => ({
        value: model,
        label: MODEL_LABELS[model as ModelKey],
      })),
    [availableModels]
  );

  const statusVisual = useMemo(() => {
    const successColor = '#7DD9C1';
    const dangerColor = '#F2A6B5';
    switch (availability.status) {
      case 'available':
        return {
          label: 'Disponível',
          dotColor: successColor,
          backgroundColor: isDark ? 'rgba(125, 217, 193, 0.24)' : 'rgba(125, 217, 193, 0.14)',
          borderColor: 'rgba(125, 217, 193, 0.32)',
        };
      case 'unavailable':
        return {
          label: 'Indisponível',
          dotColor: dangerColor,
          backgroundColor: isDark ? 'rgba(242, 166, 181, 0.28)' : 'rgba(242, 166, 181, 0.16)',
          borderColor: 'rgba(242, 166, 181, 0.34)',
        };
      default:
        return {
          label: 'Verificando...',
          dotColor: palette.accentSecondary,
          backgroundColor: isDark ? 'rgba(143, 183, 255, 0.25)' : 'rgba(141, 210, 255, 0.16)',
          borderColor: 'rgba(141, 210, 255, 0.3)',
        };
    }
  }, [availability.status, isDark, palette.accentSecondary]);

  const availabilityMessage = useMemo(() => {
    if (availability.status === 'available') {
      return 'A IA está respondendo normalmente.';
    }

    if (availability.status === 'checking') {
      return 'Verificando disponibilidade...';
    }

    return availability.message;
  }, [availability]);

  const isCheckingAvailability = availability.status === 'checking';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <LilyBackground style={styles.decorations} variant="compact" />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.heading}>
            Configurações
          </ThemedText>
          <ThemedText style={[styles.intro, { color: palette.textMuted }]}>
            Personalize quais modelos de IA serão utilizados nos assistentes do
            aplicativo.
          </ThemedText>

          <View
            style={[
              styles.aiStatusCard,
              {
                backgroundColor: statusVisual.backgroundColor,
                borderColor: statusVisual.borderColor,
              },
            ]}
          >
            <View style={styles.aiStatusHeader}>
              <View style={styles.aiStatusHeaderLeft}>
                <ThemedText type="subtitle" style={styles.aiStatusTitle}>
                  Disponibilidade da IA
                </ThemedText>
                <View style={styles.aiStatusState}>
                  <View
                    style={[styles.aiStatusDot, { backgroundColor: statusVisual.dotColor }]}
                  />
                  <ThemedText style={styles.aiStatusStateText}>
                    {statusVisual.label}
                  </ThemedText>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  void checkAvailability();
                }}
                disabled={isCheckingAvailability}
                style={({ pressed }) => [
                  styles.aiStatusAction,
                  { borderColor: palette.tint },
                  isCheckingAvailability && styles.aiStatusActionDisabled,
                  pressed && !isCheckingAvailability && styles.aiStatusActionPressed,
                ]}
              >
                {isCheckingAvailability ? (
                  <ActivityIndicator size="small" color={palette.tint} />
                ) : (
                  <ThemedText
                    style={styles.aiStatusActionLabel}
                    lightColor={palette.tint}
                    darkColor={palette.tint}
                  >
                    Atualizar
                  </ThemedText>
                )}
              </Pressable>
            </View>
            <ThemedText style={styles.aiStatusMessage} lightColor={palette.text} darkColor={palette.text}>
              {availabilityMessage}
            </ThemedText>
            {availability.status === 'unavailable' && availability.kind === 'config' ? (
              <ThemedText style={styles.aiStatusHint} lightColor={palette.textMuted} darkColor={palette.textMuted}>
                Configure a variável EXPO_PUBLIC_CHAT_BASE_URL na build do aplicativo para
                habilitar os assistentes.
              </ThemedText>
            ) : null}
          </View>

          {isLoading ? (
            <View
              style={[
                styles.loadingBanner,
                {
                  backgroundColor: isDark
                    ? 'rgba(184, 196, 255, 0.18)'
                    : 'rgba(123, 116, 242, 0.12)',
                  borderColor: palette.border,
                },
              ]}
            >
              <ActivityIndicator color={palette.tint} size="small" />
              <ThemedText style={styles.loadingText}>
                Carregando preferências salvas...
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Assistente Catequista
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: palette.textMuted }]}>
              Define qual modelo responde às suas perguntas com base nas obras
              católicas disponíveis.
            </ThemedText>
            {modelItems.map((item) => (
              <ModelOptionButton
                key={`catechist-${item.value}`}
                label={item.label}
                selected={catechistModel === item.value}
                onPress={() => setCatechistModel(item.value)}
                disabled={isLoading}
                accentColor={palette.tint}
                palette={palette}
                isDark={isDark}
              />
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              IA Católica
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: palette.textMuted }]}>
              Escolhe o modelo usado na experiência de chat espiritual e de
              orientação pastoral.
            </ThemedText>
            {modelItems.map((item) => (
              <ModelOptionButton
                key={`chat-${item.value}`}
                label={item.label}
                selected={chatModel === item.value}
                onPress={() => setChatModel(item.value)}
                disabled={isLoading}
                accentColor={palette.tint}
                palette={palette}
                isDark={isDark}
              />
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 24,
  },
  heading: {
    marginBottom: 8,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
  },
  aiStatusCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  aiStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  aiStatusHeaderLeft: {
    flex: 1,
    gap: 8,
  },
  aiStatusTitle: {
    marginBottom: 0,
  },
  aiStatusState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  aiStatusStateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiStatusMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  aiStatusHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  aiStatusAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  aiStatusActionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiStatusActionDisabled: {
    opacity: 0.5,
  },
  aiStatusActionPressed: {
    opacity: 0.85,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  loadingText: {
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  optionButton: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  decorations: {
    ...StyleSheet.absoluteFillObject,
  },
});
