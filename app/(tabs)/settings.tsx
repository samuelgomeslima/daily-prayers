import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useModelSettings } from '@/contexts/model-settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

const MODEL_LABELS = {
  'gpt-5-mini': 'GPT-5 Mini',
  'gpt-4o-mini': 'GPT-4o Mini',
} as const;

type ModelKey = keyof typeof MODEL_LABELS;

type ModelOptionButtonProps = {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
  accentColor: string;
  isDark: boolean;
};

function ModelOptionButton({
  label,
  selected,
  disabled,
  onPress,
  accentColor,
  isDark,
}: ModelOptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.optionButton,
        selected && {
          borderColor: accentColor,
          backgroundColor: isDark
            ? 'rgba(56, 189, 248, 0.16)'
            : 'rgba(10, 126, 164, 0.12)',
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.heading}>
            Configurações
          </ThemedText>
          <ThemedText style={styles.intro}>
            Personalize quais modelos de IA serão utilizados nos assistentes do
            aplicativo.
          </ThemedText>

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
            <ThemedText style={styles.sectionDescription}>
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
                isDark={isDark}
              />
            ))}
          </View>

          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              IA Católica
            </ThemedText>
            <ThemedText style={styles.sectionDescription}>
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
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.12)',
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
    color: '#6B7280',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
});
