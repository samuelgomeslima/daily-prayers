import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type PrayerBeadType = 'marker' | 'large' | 'small';

type PrayerBead = {
  id: string;
  label: string;
  type: PrayerBeadType;
};

type PrayerSection = {
  title: string;
  description?: string;
  beads: PrayerBead[];
};

type PrayerSequence = {
  id: string;
  name: string;
  description: string;
  sections: PrayerSection[];
};

type PrayerBeadTrackerProps = {
  sequence: PrayerSequence;
};

export function PrayerBeadTracker({ sequence }: PrayerBeadTrackerProps) {
  const accentColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const markerIdleColor = useThemeColor({ light: '#E5ECF6', dark: '#1E2732' }, 'background');

  const totalBeads = useMemo(
    () => sequence.sections.reduce((total, section) => total + section.beads.length, 0),
    [sequence.sections]
  );

  const [markedBeads, setMarkedBeads] = useState<Set<string>>(new Set());

  const toggleBead = (beadId: string) => {
    setMarkedBeads((current) => {
      const updated = new Set(current);
      if (updated.has(beadId)) {
        updated.delete(beadId);
      } else {
        updated.add(beadId);
      }
      return updated;
    });
  };

  const reset = () => {
    setMarkedBeads(new Set());
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={[styles.title, { fontFamily: Fonts.serif }] }>
          {sequence.name}
        </ThemedText>
        <ThemedText style={styles.description}>{sequence.description}</ThemedText>
        <View style={styles.progressRow}>
          <View style={styles.progressIndicator}>
            <View
              style={[
                styles.progressFill,
                { width: `${(markedBeads.size / totalBeads) * 100}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
          <ThemedText style={styles.progressText}>
            {markedBeads.size} / {totalBeads} contas
          </ThemedText>
          <Pressable onPress={reset} style={styles.resetButton} accessibilityRole="button">
            {({ pressed }) => (
              <ThemedText
                type="defaultSemiBold"
                style={[
                  styles.resetLabel,
                  { color: accentColor },
                  pressed && { opacity: 0.6 },
                ]}>
                Reiniciar
              </ThemedText>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.sections}>
        {sequence.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.rounded }]}>
              {section.title}
            </ThemedText>
            {section.description ? (
              <ThemedText style={styles.sectionDescription}>{section.description}</ThemedText>
            ) : null}
            <View style={styles.beadRow}>
              {section.beads.map((bead) => {
                const isMarked = markedBeads.has(bead.id);

                return (
                  <Pressable
                    key={bead.id}
                    onPress={() => toggleBead(bead.id)}
                    style={({ pressed }) => [
                      styles.bead,
                      bead.type === 'small' && styles.smallBead,
                      bead.type === 'large' && styles.largeBead,
                      bead.type === 'marker' && styles.markerBead,
                      {
                        borderColor: isMarked ? accentColor : iconColor,
                        backgroundColor: isMarked
                          ? accentColor
                          : bead.type === 'marker'
                            ? markerIdleColor
                            : backgroundColor,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityLabel={bead.label}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isMarked }}
                  />
                );
              })}
            </View>
            <View style={styles.beadLabels}>
              {section.beads.map((bead) => (
                <ThemedText
                  key={`${bead.id}-label`}
                  style={[styles.beadLabel, { color: textColor }]}
                  numberOfLines={1}>
                  {bead.label}
                </ThemedText>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ThemedView>
  );
}

export type { PrayerBead, PrayerSection, PrayerSequence };

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    gap: 16,
    elevation: 1,
    shadowColor: '#00000025',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 22,
  },
  description: {
    lineHeight: 22,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIndicator: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#00000012',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    minWidth: 90,
    textAlign: 'center',
    fontFamily: Fonts.mono,
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  resetLabel: {
    fontSize: 14,
  },
  sections: {
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionDescription: {
    lineHeight: 20,
    color: '#687076',
  },
  beadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bead: {
    borderWidth: 2,
    borderRadius: 999,
    width: 28,
    height: 28,
  },
  smallBead: {
    width: 22,
    height: 22,
  },
  largeBead: {
    width: 28,
    height: 28,
  },
  markerBead: {
    width: 32,
    height: 32,
  },
  beadLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  beadLabel: {
    fontSize: 12,
    maxWidth: 70,
  },
});
