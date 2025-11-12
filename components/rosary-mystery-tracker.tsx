import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getTodayMysterySetId, type MysterySet } from '@/constants/rosary';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

type RosaryMysteryTrackerProps = {
  sets: MysterySet[];
  onSelectSet?: (set: MysterySet) => void;
};

export function RosaryMysteryTracker({ sets, onSelectSet }: RosaryMysteryTrackerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const accentColor = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({ light: '#686FA3', dark: '#9FA8D9' }, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');

  const todaySetId = useMemo(() => getTodayMysterySetId(sets), [sets]);

  if (sets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {sets.map((set) => {
        const isTodaySet = set.id === todaySetId;
        return (
          <Pressable
            key={set.id}
            onPress={() => onSelectSet?.(set)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir o terço com os ${set.title}`}
            style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.85 }]}
          >
            <ThemedView
              style={[
                styles.card,
                {
                  borderColor: `${borderColor}88`,
                  shadowColor: `${palette.tint}14`,
                  backgroundColor: surfaceMuted,
                },
                isTodaySet && {
                  borderColor: `${accentColor}AA`,
                  backgroundColor: `${accentColor}12`,
                  shadowColor: `${accentColor}26`,
                },
              ]}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <ThemedText
                    type="subtitle"
                    style={[styles.cardTitle, { fontFamily: Fonts.serif }]}
                  >
                    {set.title}
                  </ThemedText>
                  <ThemedText style={[styles.cardDays, { color: mutedText }]}>
                    {set.days}
                  </ThemedText>
                </View>
                {isTodaySet ? (
                  <ThemedView
                    style={[
                      styles.todayBadge,
                      { backgroundColor: `${accentColor}1F`, borderColor: `${accentColor}33` },
                    ]}
                  >
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.todayBadgeText, { color: accentColor }]}
                    >
                      Hoje
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <IconSymbol name="chevron.right.circle" size={28} color={accentColor} />
                )}
              </View>

              <ThemedText style={[styles.mysteryHint, { color: mutedText }]}>
                Toque para abrir o terço com estes mistérios.
              </ThemedText>

              <View style={styles.mysteryList}>
                {set.mysteries.map((mystery, index) => (
                  <View key={`${set.id}-${index}`} style={styles.mysteryItem}>
                    <ThemedView
                      style={[
                        styles.mysteryIndex,
                        { backgroundColor: `${palette.tint}14`, borderColor: `${palette.tint}33` },
                      ]}
                    >
                      <ThemedText
                        type="defaultSemiBold"
                        style={[styles.mysteryIndexLabel, { color: palette.tint }]}
                      >
                        {index + 1}
                      </ThemedText>
                    </ThemedView>
                    <ThemedText style={styles.mysteryLabel}>{mystery}</ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  cardPressable: {
    borderRadius: 18,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardHeaderText: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
  },
  cardDays: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  todayBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayBadgeText: {
    fontSize: 13,
    letterSpacing: 0.6,
  },
  mysteryHint: {
    fontSize: 13,
    lineHeight: 20,
  },
  mysteryList: {
    gap: 10,
  },
  mysteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mysteryIndex: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  mysteryIndexLabel: {
    fontSize: 13,
  },
  mysteryLabel: {
    flex: 1,
    lineHeight: 20,
  },
});

export type { MysterySet };
