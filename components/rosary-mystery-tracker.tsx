import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type MysterySet = {
  id: string;
  title: string;
  days: string;
  mysteries: string[];
};

type RosaryMysteryTrackerProps = {
  sets: MysterySet[];
};

export function RosaryMysteryTracker({ sets }: RosaryMysteryTrackerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const accentColor = useThemeColor({}, 'tint');
  const cardBackground = colorScheme === 'dark' ? palette.surfaceSecondary : palette.surface;
  const mutedText = palette.textMuted;
  const pillBackground = colorScheme === 'dark' ? 'rgba(184, 196, 255, 0.18)' : 'rgba(123, 116, 242, 0.12)';
  const pillBorder = colorScheme === 'dark' ? 'rgba(184, 196, 255, 0.3)' : 'rgba(123, 116, 242, 0.22)';

  const defaultSetId = sets[0]?.id;
  const [selectedSetId, setSelectedSetId] = useState(defaultSetId ?? '');
  const [completedMysteries, setCompletedMysteries] = useState<Set<string>>(new Set());

  const currentSet = useMemo(() => {
    if (selectedSetId) {
      return sets.find((set) => set.id === selectedSetId) ?? sets[0];
    }
    return sets[0];
  }, [selectedSetId, sets]);

  const completedCount = useMemo(() => {
    if (!currentSet) {
      return 0;
    }
    return currentSet.mysteries.reduce((count, _mystery, index) => {
      const key = `${currentSet.id}-${index}`;
      return completedMysteries.has(key) ? count + 1 : count;
    }, 0);
  }, [completedMysteries, currentSet]);

  if (!currentSet) {
    return null;
  }

  const toggleMystery = (index: number) => {
    const key = `${currentSet.id}-${index}`;
    setCompletedMysteries((current) => {
      const updated = new Set(current);
      if (updated.has(key)) {
        updated.delete(key);
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  const resetSetProgress = () => {
    setCompletedMysteries((current) => {
      if (current.size === 0) {
        return current;
      }

      const updated = new Set(current);
      currentSet.mysteries.forEach((_, index) => {
        updated.delete(`${currentSet.id}-${index}`);
      });
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {sets.map((set) => {
          const isSelected = set.id === currentSet.id;
          return (
            <Pressable
              key={set.id}
              onPress={() => setSelectedSetId(set.id)}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  backgroundColor: pillBackground,
                  borderColor: isSelected ? accentColor : pillBorder,
                },
                isSelected && styles.tabButtonActive,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <ThemedText
                type="defaultSemiBold"
                style={[styles.tabButtonLabel, { color: isSelected ? accentColor : palette.text }]}
              >
                {set.title}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedView
        style={[styles.card, { backgroundColor: cardBackground, borderColor: palette.border, shadowColor: palette.shadow }]}
        lightColor={Colors.light.surface}
        darkColor={Colors.dark.surface}
      >
        <ThemedText type="subtitle" style={[styles.cardTitle, { fontFamily: Fonts.serif }]}>
          {currentSet.title}
        </ThemedText>
        <ThemedText style={[styles.cardDays, { color: mutedText }]}>{currentSet.days}</ThemedText>

        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.progressLabel}>
            Mistérios concluídos: {completedCount} / {currentSet.mysteries.length}
          </ThemedText>
          <Pressable
            onPress={resetSetProgress}
            style={({ pressed }) => [
              styles.resetButton,
              { borderColor: pillBorder, backgroundColor: pillBackground },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
          >
            <ThemedText type="defaultSemiBold" style={[styles.resetLabel, { color: accentColor }]}>
              Reiniciar
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.mysteryList}>
          {currentSet.mysteries.map((mystery, index) => {
            const key = `${currentSet.id}-${index}`;
            const isChecked = completedMysteries.has(key);
            return (
              <Pressable
                key={key}
                onPress={() => toggleMystery(index)}
                style={({ pressed }) => [
                  styles.mysteryItem,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isChecked }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isChecked ? accentColor : pillBorder,
                      backgroundColor: isChecked ? accentColor : pillBackground,
                    },
                  ]}
                />
                <ThemedText style={styles.mysteryLabel}>{mystery}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  tabButtonActive: {
    opacity: 1,
  },
  tabButtonLabel: {
    fontSize: 13,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
  },
  cardDays: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: Fonts.mono,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  resetLabel: {
    fontSize: 13,
  },
  mysteryList: {
    gap: 8,
  },
  mysteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
  },
  mysteryLabel: {
    flex: 1,
    lineHeight: 20,
  },
});

export type { MysterySet };
