import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';

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

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

const weekdayToSetId: Record<string, MysterySet['id']> = {
  Sunday: 'glorious',
  Monday: 'joyful',
  Tuesday: 'sorrowful',
  Wednesday: 'glorious',
  Thursday: 'luminous',
  Friday: 'sorrowful',
  Saturday: 'joyful',
};

const getTodaySetId = (sets: MysterySet[]): MysterySet['id'] | '' => {
  if (sets.length === 0) {
    return '';
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: SAO_PAULO_TIME_ZONE,
    });
    const weekday = formatter.format(new Date());
    const mappedId = weekdayToSetId[weekday];

    if (!mappedId) {
      return sets[0]?.id ?? '';
    }

    return sets.find((set) => set.id === mappedId)?.id ?? sets[0]?.id ?? '';
  } catch (error) {
    return sets[0]?.id ?? '';
  }
};

export function RosaryMysteryTracker({ sets }: RosaryMysteryTrackerProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const accentColor = useThemeColor({}, 'tint');
  const mutedText = useThemeColor({ light: '#686FA3', dark: '#9FA8D9' }, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const surfaceMuted = useThemeColor({}, 'surfaceMuted');

  const todaySetId = useMemo(() => getTodaySetId(sets), [sets]);
  const defaultSetId = todaySetId || sets[0]?.id || '';
  const [selectedSetId, setSelectedSetId] = useState(defaultSetId);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [completedMysteries, setCompletedMysteries] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedSetId((current) => {
      let nextId = current;

      if (todaySetId && current !== todaySetId) {
        nextId = todaySetId;
      } else if (!current && defaultSetId) {
        nextId = defaultSetId;
      } else if (!sets.some((set) => set.id === current)) {
        nextId = todaySetId || defaultSetId;
      }

      if (nextId !== current) {
        setExpandedSetId(null);
      }

      return nextId;
    });
  }, [todaySetId, defaultSetId, sets]);

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

  const isExpanded = expandedSetId === currentSet.id;

  const handleSetPress = (setId: string) => {
    setSelectedSetId((current) => {
      if (current === setId) {
        setExpandedSetId((expanded) => (expanded === setId ? null : setId));
        return current;
      }

      setExpandedSetId(setId);
      return setId;
    });
  };

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
          const isTodaySet = set.id === todaySetId;
          const isSetExpanded = expandedSetId === set.id;
          return (
            <Pressable
              key={set.id}
              onPress={() => handleSetPress(set.id)}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  borderColor,
                  backgroundColor: surfaceMuted,
                },
                isSelected && [
                  styles.tabButtonActive,
                  { borderColor: accentColor, backgroundColor: `${accentColor}1A` },
                ],
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, expanded: isSetExpanded }}
            >
              <View style={styles.tabLabelWrapper}>
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.tabButtonLabel,
                    { color: isSelected ? accentColor : mutedText },
                  ]}
                >
                  {set.title}
                </ThemedText>
                {isTodaySet && (
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
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ThemedView
        style={[
          styles.card,
          { borderColor: `${borderColor}88`, shadowColor: `${palette.tint}14` },
          currentSet.id === todaySetId && {
            borderColor: `${accentColor}AA`,
            backgroundColor: `${accentColor}10`,
            shadowColor: `${accentColor}26`,
          },
        ]}
        lightColor={Colors.light.surface}
        darkColor={Colors.dark.surface}
      >
        {currentSet.id === todaySetId && (
          <ThemedView
            style={[
              styles.todayBanner,
              { backgroundColor: `${accentColor}1F`, borderColor: `${accentColor}33` },
            ]}
          >
            <ThemedText
              type="defaultSemiBold"
              style={[styles.todayBannerText, { color: accentColor }]}
            >
              Mistérios indicados para hoje
            </ThemedText>
          </ThemedView>
        )}
        <ThemedText type="subtitle" style={[styles.cardTitle, { fontFamily: Fonts.serif }]}>
          {currentSet.title}
        </ThemedText>
        <ThemedText style={[styles.cardDays, { color: mutedText }]}>{currentSet.days}</ThemedText>

        {isExpanded ? (
          <>
            <View style={styles.cardHeaderRow}>
              <ThemedText style={[styles.progressLabel, { color: mutedText }]}>
                Mistérios concluídos: {completedCount} / {currentSet.mysteries.length}
              </ThemedText>
              <Pressable
                onPress={resetSetProgress}
                style={({ pressed }) => [
                  styles.resetButton,
                  { backgroundColor: `${accentColor}14` },
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.resetLabel, { color: accentColor }]}
                >
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
                      {
                        backgroundColor: surfaceMuted,
                        borderColor,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: isChecked ? accentColor : borderColor },
                        isChecked && { backgroundColor: accentColor },
                      ]}
                    />
                    <ThemedText style={styles.mysteryLabel}>{mystery}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.collapsedMessage}>
            <ThemedText style={[styles.collapsedText, { color: mutedText }]}>
              Toque em um mistério para visualizar os detalhes e acompanhar o progresso das dezenas.
            </ThemedText>
          </View>
        )}
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
    borderWidth: 1,
  },
  tabButtonActive: {},
  tabButtonLabel: {
    fontSize: 13,
  },
  tabLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayBadgeText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 1,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
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
  todayBanner: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  todayBannerText: {
    fontSize: 13,
    letterSpacing: 0.6,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  resetLabel: {
    fontSize: 13,
  },
  mysteryList: {
    gap: 8,
  },
  collapsedMessage: {
    paddingVertical: 16,
  },
  collapsedText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  mysteryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  mysteryLabel: {
    flex: 1,
    lineHeight: 20,
  },
});

export type { MysterySet };
