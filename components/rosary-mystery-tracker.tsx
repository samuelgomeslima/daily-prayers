import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getTodayMysterySetId, type MysterySet } from '@/constants/rosary';
import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { IconSymbol } from './ui/icon-symbol';

type RosaryMysteryTrackerProps = {
  sets: MysterySet[];
  onSelectSet?: (set: MysterySet) => void;
};

export function RosaryMysteryTracker({ sets, onSelectSet }: RosaryMysteryTrackerProps) {
  const accentColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');

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
            style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.7 }]}
          >
            <ThemedView
              style={[
                styles.card,
                { borderColor: `${borderColor}99` },
                isTodaySet && {
                  borderColor: `${accentColor}88`,
                  backgroundColor: `${accentColor}12`,
                },
              ]}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardText}>
                  <ThemedText
                    type="subtitle"
                    style={[styles.cardTitle, { fontFamily: Fonts.serif }]}
                  >
                    {set.title}
                  </ThemedText>
                  {isTodaySet && (
                    <ThemedText
                      type="defaultSemiBold"
                      style={[styles.todayLabel, { color: accentColor }]}
                    >
                      Mistérios de hoje
                    </ThemedText>
                  )}
                </View>
                <IconSymbol name="chevron.right" size={22} color={accentColor} />
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
    gap: 12,
  },
  cardPressable: {
    borderRadius: 16,
  },
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
  },
  todayLabel: {
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

export type { MysterySet };
