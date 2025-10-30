import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
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
};

function ModelOptionButton({
  label,
  selected,
  disabled,
  onPress,
  accentColor,
}: ModelOptionButtonProps) {
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionButton,
        {
          borderColor,
          backgroundColor: selected ? `${accentColor}1A` : surfaceMuted,
        },
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.6 },
      ]}
    >
      <ThemedText style={styles.optionLabel}>{label}</ThemedText>
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
  const mutedText = useThemeColor({ light: '#6D73A8', dark: '#A3AAD9' }, 'icon');

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
    switch (availability.status) {
      case 'available':
        return {
          label: 'Disponível',
          dotColor: '#16A34A',
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.24)' : 'rgba(34, 197, 94, 0.12)',
          borderColor: isDark ? 'rgba(34, 197, 94, 0.32)' : 'rgba(34, 197, 94, 0.32)',
        };
      case 'unavailable':
        return {
          label: 'Indisponível',
          dotColor: '#DC2626',
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.24)' : 'rgba(248, 113, 113, 0.12)',
          borderColor: isDark ? 'rgba(248, 113, 113, 0.32)' : 'rgba(248, 113, 113, 0.32)',
        };
      default:
        return {
          label: 'Verificando...',
          dotColor: '#F59E0B',
          backgroundColor: isDark ? 'rgba(251, 191, 36, 0.24)' : 'rgba(253, 224, 71, 0.12)',
          borderColor: isDark ? 'rgba(251, 191, 36, 0.32)' : 'rgba(251, 191, 36, 0.32)',
        };
    }
  }, [availability.status, isDark]);

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
        <HolySpiritSymbol size={240} opacity={0.1} style={styles.symbolTop} pointerEvents="none" />
        <HolySpiritSymbol size={200} opacity={0.08} style={styles.symbolBottom} pointerEvents="none" />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.heading}>
            Configurações
          </ThemedText>
          <ThemedText style={[styles.intro, { color: mutedText }]}>
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
            <ThemedText style={styles.aiStatusMessage} lightColor="#4B5563" darkColor="#D1D5DB">
              {availabilityMessage}
            </ThemedText>
            {availability.status === 'unavailable' && availability.kind === 'config' ? (
              <ThemedText
                style={styles.aiStatusHint}
                lightColor="#6B7280"
                darkColor="#9CA3AF"
              >
                Configure a variável EXPO_PUBLIC_CHAT_BASE_URL na build do aplicativo para
                habilitar os assistentes.
              </ThemedText>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loadingBanner}>
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
            <ThemedText style={[styles.sectionDescription, { color: mutedText }]}>
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
              />
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              IA Católica
            </ThemedText>
            <ThemedText style={[styles.sectionDescription, { color: mutedText }]}>
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
    overflow: 'hidden',
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
    color: '#6B7280',
  },
  aiStatusCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 2,
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
    borderWidth: 1,
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
    backgroundColor: 'rgba(125, 112, 242, 0.08)',
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
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },
  optionLabel: {
    fontSize: 16,
    flex: 1,
  },
  symbolTop: {
    position: 'absolute',
    top: -60,
    right: -50,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    transform: [{ scaleX: -1 }],
  },
});
