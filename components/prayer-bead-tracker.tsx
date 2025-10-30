import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const accentColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const surfaceColor = useThemeColor({}, 'surface');
  const markerIdleColor = useThemeColor({}, 'surfaceMuted');
  const borderColor = useThemeColor({}, 'border');
  const overlayColor = useThemeColor({}, 'overlay');
  const mutedText = useThemeColor({ light: '#6E76A4', dark: '#9EA6D9' }, 'icon');

  const totalBeads = useMemo(
    () => sequence.sections.reduce((total, section) => total + section.beads.length, 0),
    [sequence.sections]
  );

  const [markedBeads, setMarkedBeads] = useState<Set<string>>(new Set());
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [targetRounds, setTargetRounds] = useState(1);
  const [focusSectionIndex, setFocusSectionIndex] = useState<number | null>(null);

  const beadOrder = useMemo(
    () => sequence.sections.flatMap((section) => section.beads.map((bead) => bead.id)),
    [sequence.sections]
  );

  const beadMetadata = useMemo(() => {
    const entries = new Map<
      string,
      { sectionTitle: string; label: string; sectionIndex: number; beadIndex: number }
    >();
    sequence.sections.forEach((section, sectionIndex) => {
      section.beads.forEach((bead, beadIndex) => {
        entries.set(bead.id, {
          sectionTitle: section.title,
          label: bead.label,
          sectionIndex,
          beadIndex,
        });
      });
    });
    return entries;
  }, [sequence.sections]);

  const currentBeadId = useMemo(
    () => beadOrder.find((beadId) => !markedBeads.has(beadId)),
    [beadOrder, markedBeads]
  );

  const previousMarkedBeadId = useMemo(() => {
    for (let index = beadOrder.length - 1; index >= 0; index -= 1) {
      const beadId = beadOrder[index];
      if (markedBeads.has(beadId)) {
        return beadId;
      }
    }
    return undefined;
  }, [beadOrder, markedBeads]);

  const currentBeadInfo = currentBeadId ? beadMetadata.get(currentBeadId) : undefined;
  const progressPercentage = (markedBeads.size / totalBeads) * 100;
  const allBeadsMarked = markedBeads.size === totalBeads;
  const minimumTarget = Math.max(1, roundsCompleted + 1);
  const currentRoundNumber = roundsCompleted + 1;
  const goalReached = roundsCompleted >= targetRounds;
  const isFocusModeActive = focusSectionIndex !== null;
  const focusSection =
    focusSectionIndex !== null ? sequence.sections[focusSectionIndex] ?? null : null;
  const focusSectionBeads = focusSection?.beads ?? [];
  const focusSectionMarked = focusSectionBeads.filter((bead) => markedBeads.has(bead.id));
  const focusSectionCompleted =
    focusSectionBeads.length > 0 && focusSectionMarked.length === focusSectionBeads.length;
  const focusSectionCurrentBead = focusSectionBeads.find((bead) => !markedBeads.has(bead.id));
  const focusSectionTitle = focusSection?.title?.toLowerCase() ?? '';
  const focusNextButtonLabel = focusSectionTitle.includes('dezena')
    ? 'Ir para a próxima dezena'
    : 'Ir para a próxima etapa';

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

  const markNextBead = () => {
    if (!currentBeadId) {
      return;
    }

    setMarkedBeads((current) => {
      if (current.has(currentBeadId)) {
        return current;
      }

      const updated = new Set(current);
      updated.add(currentBeadId);
      return updated;
    });
  };

  const undoLastBead = () => {
    if (!previousMarkedBeadId) {
      return;
    }

    setMarkedBeads((current) => {
      if (!current.has(previousMarkedBeadId)) {
        return current;
      }

      const updated = new Set(current);
      updated.delete(previousMarkedBeadId);
      return updated;
    });
  };

  const completeCurrentRound = () => {
    setMarkedBeads(new Set());
    setRoundsCompleted((current) => {
      const updated = current + 1;
      setTargetRounds((goal) => Math.max(goal, updated));
      return updated;
    });
  };

  const adjustTargetRounds = (delta: number) => {
    setTargetRounds((current) => {
      const proposed = current + delta;
      if (delta < 0) {
        return Math.max(minimumTarget, proposed);
      }

      return Math.max(minimumTarget, proposed);
    });
  };

  const openFocusMode = () => {
    if (currentBeadId) {
      const nextSectionIndex = beadMetadata.get(currentBeadId)?.sectionIndex ?? 0;
      setFocusSectionIndex(nextSectionIndex);
      return;
    }

    setFocusSectionIndex(Math.max(0, sequence.sections.length - 1));
  };

  const closeFocusMode = () => {
    setFocusSectionIndex(null);
  };

  const goToNextFocusSection = () => {
    if (focusSectionIndex === null) {
      return;
    }

    const nextIndex = sequence.sections.findIndex((section, index) => {
      if (index <= focusSectionIndex) {
        return false;
      }

      return section.beads.some((bead) => !markedBeads.has(bead.id));
    });

    if (nextIndex === -1) {
      closeFocusMode();
      return;
    }

    setFocusSectionIndex(nextIndex);
  };

  return (
    <ThemedView
      style={[styles.container, { borderColor: `${borderColor}88`, shadowColor: `${palette.tint}1F` }]}
      lightColor={Colors.light.surface}
      darkColor={Colors.dark.surface}
    >
      <Modal
        visible={isFocusModeActive}
        transparent
        animationType="slide"
        onRequestClose={closeFocusMode}
      >
        <View style={styles.focusOverlay}>
          <ThemedView
            style={[
              styles.focusContainer,
              { borderColor: `${borderColor}66`, shadowColor: `${palette.tint}26` },
            ]}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}
          >
            {focusSection ? (
              <>
                <View style={styles.focusHeader}>
                  <ThemedText type="subtitle" style={[styles.focusTitle, { fontFamily: Fonts.serif }]}>
                    {focusSection.title}
                  </ThemedText>
                  <Pressable
                    onPress={closeFocusMode}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.focusCloseButton, pressed && { opacity: 0.6 }]}
                  >
                    <ThemedText style={[styles.focusCloseLabel, { color: accentColor }]}>Fechar</ThemedText>
                  </Pressable>
                </View>
                {focusSection.description ? (
                  <ThemedText style={[styles.focusDescription, { color: mutedText }]}>
                    {focusSection.description}
                  </ThemedText>
                ) : null}
                <ThemedText style={[styles.focusProgress, { color: mutedText }]}>
                  {focusSectionMarked.length} / {focusSectionBeads.length} contas desta etapa
                </ThemedText>
                {focusSectionCurrentBead ? (
                  <ThemedText style={styles.focusCurrentBead}>
                    Próxima oração: {focusSectionCurrentBead.label}
                  </ThemedText>
                ) : (
                  <ThemedText style={styles.focusCurrentBead}>
                    Esta dezena foi concluída.
                  </ThemedText>
                )}
                <View style={styles.focusFlowControls}>
                  <Pressable
                    onPress={undoLastBead}
                    disabled={!previousMarkedBeadId}
                    style={({ pressed }) => [
                      styles.focusFlowButton,
                      { borderColor, backgroundColor: markerIdleColor },
                      !previousMarkedBeadId && styles.focusFlowButtonDisabled,
                      pressed && previousMarkedBeadId && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar uma conta"
                  >
                    <ThemedText style={styles.focusFlowButtonLabel}>Voltar conta</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={markNextBead}
                    disabled={!currentBeadId}
                    style={({ pressed }) => [
                      styles.focusFlowButton,
                      styles.focusFlowButtonPrimary,
                      { borderColor, backgroundColor: `${accentColor}1A` },
                      !currentBeadId && styles.focusFlowButtonDisabled,
                      pressed && currentBeadId && { opacity: 0.7 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Avançar para a próxima conta"
                  >
                    <ThemedText
                      style={[styles.focusFlowButtonLabel, styles.focusFlowButtonLabelPrimary]}
                    >
                      Avançar conta
                    </ThemedText>
                  </Pressable>
                </View>
                {focusSectionCompleted ? (
                  <Pressable
                    onPress={goToNextFocusSection}
                    style={({ pressed }) => [
                      styles.focusNextSectionButton,
                      { backgroundColor: accentColor },
                      pressed && { opacity: 0.85 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={focusNextButtonLabel}
                  >
                    <ThemedText style={styles.focusNextSectionLabel}>
                      {focusNextButtonLabel}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </ThemedView>
        </View>
      </Modal>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={[styles.title, { fontFamily: Fonts.serif }] }>
          {sequence.name}
        </ThemedText>
        <ThemedText style={styles.description}>{sequence.description}</ThemedText>
        <View style={styles.roundSummary}>
          <View style={styles.roundCounter}>
            <ThemedText style={styles.roundCounterLabel}>Terços rezados</ThemedText>
            <ThemedText style={[styles.roundCounterValue, { color: accentColor }]}>
              {roundsCompleted}
            </ThemedText>
          </View>
          <View style={styles.roundTargetControl}>
            <Pressable
              onPress={() => adjustTargetRounds(-1)}
              disabled={targetRounds <= minimumTarget}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  borderColor,
                  backgroundColor: markerIdleColor,
                },
                pressed && { opacity: 0.6 },
                targetRounds <= minimumTarget && styles.adjustButtonDisabled,
              ]}
              accessibilityLabel="Diminuir meta de terços"
              accessibilityRole="button"
            >
              <ThemedText style={styles.adjustButtonLabel}>−</ThemedText>
            </Pressable>
            <View style={[styles.targetBadge, { backgroundColor: overlayColor }] }>
              <ThemedText style={styles.targetBadgeLabel}>{targetRounds}</ThemedText>
            </View>
            <Pressable
              onPress={() => adjustTargetRounds(1)}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  borderColor,
                  backgroundColor: markerIdleColor,
                },
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="Aumentar meta de terços"
              accessibilityRole="button"
            >
              <ThemedText style={styles.adjustButtonLabel}>+</ThemedText>
            </Pressable>
          </View>
        </View>
        <ThemedText style={[styles.roundHelperText, { color: mutedText }]}>
          {goalReached
            ? 'Meta alcançada! Você pode iniciar outro terço quando desejar.'
            : `Terço atual: ${currentRoundNumber} de ${targetRounds}`}
        </ThemedText>
        <View style={styles.progressRow}>
          <View style={[styles.progressIndicator, { backgroundColor: overlayColor }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
          <ThemedText style={[styles.progressText, { color: mutedText }]}>
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
        <View style={styles.flowSection}>
          <Pressable
            onPress={openFocusMode}
            style={({ pressed }) => [
              styles.focusModeButton,
              { borderColor, backgroundColor: `${accentColor}12` },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Iniciar modo focado na dezena atual"
          >
            <ThemedText style={[styles.focusModeButtonLabel, { color: accentColor }]}>
              Modo dezena a dezena
            </ThemedText>
          </Pressable>
          <View style={styles.flowControls}>
            <Pressable
              onPress={undoLastBead}
              disabled={!previousMarkedBeadId}
              style={({ pressed }) => [
                styles.flowButton,
                {
                  borderColor,
                  backgroundColor: markerIdleColor,
                },
                !previousMarkedBeadId && styles.flowButtonDisabled,
                pressed && previousMarkedBeadId && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Voltar uma conta"
            >
              <ThemedText style={styles.flowButtonLabel}>Voltar conta</ThemedText>
            </Pressable>
            <Pressable
              onPress={markNextBead}
              disabled={!currentBeadId}
              style={({ pressed }) => [
                styles.flowButton,
                styles.flowButtonPrimary,
                {
                  borderColor,
                  backgroundColor: `${accentColor}1A`,
                },
                !currentBeadId && styles.flowButtonDisabled,
                pressed && currentBeadId && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Avançar para a próxima conta"
            >
              <ThemedText style={[styles.flowButtonLabel, styles.flowButtonLabelPrimary]}>
                Avançar conta
              </ThemedText>
            </Pressable>
          </View>
          {currentBeadInfo ? (
            <ThemedText style={[styles.currentBeadHelper, { color: mutedText }]}>
              Próxima oração: {currentBeadInfo.label} ({currentBeadInfo.sectionTitle})
            </ThemedText>
          ) : (
            <ThemedText style={[styles.currentBeadHelper, { color: mutedText }]}>
              Todas as contas deste terço foram marcadas.
            </ThemedText>
          )}
          {allBeadsMarked ? (
            <Pressable
              onPress={completeCurrentRound}
              style={({ pressed }) => [
                styles.completeRoundButton,
                { backgroundColor: accentColor },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
            >
              <ThemedText style={styles.completeRoundLabel}>
                Registrar terço concluído
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sections}>
        {sequence.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { fontFamily: Fonts.rounded }]}>
              {section.title}
            </ThemedText>
            {section.description ? (
              <ThemedText style={[styles.sectionDescription, { color: mutedText }]}>
                {section.description}
              </ThemedText>
            ) : null}
            <View style={styles.beadRow}>
              {section.beads.map((bead) => {
                const isMarked = markedBeads.has(bead.id);
                const isCurrent = currentBeadId === bead.id;

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
                            : surfaceColor,
                        opacity: isCurrent || isMarked ? 1 : 0.55,
                      },
                      isCurrent && styles.currentBead,
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  focusOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(16, 20, 40, 0.65)',
  },
  focusContainer: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  focusTitle: {
    fontSize: 20,
  },
  focusCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  focusCloseLabel: {
    fontWeight: '600',
  },
  focusDescription: {
    lineHeight: 20,
  },
  focusProgress: {
    fontFamily: Fonts.mono,
  },
  focusCurrentBead: {
    fontSize: 16,
    fontWeight: '600',
  },
  focusFlowControls: {
    flexDirection: 'row',
    gap: 12,
  },
  focusFlowButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  focusFlowButtonPrimary: {},
  focusFlowButtonDisabled: {
    opacity: 0.4,
  },
  focusFlowButtonLabel: {
    fontFamily: Fonts.mono,
  },
  focusFlowButtonLabelPrimary: {
    fontWeight: '600',
  },
  focusNextSectionButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  focusNextSectionLabel: {
    color: '#ffffff',
    fontWeight: '600',
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
  roundSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  roundCounter: {
    flexDirection: 'column',
    gap: 4,
  },
  roundCounterLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roundCounterValue: {
    fontSize: 24,
    fontFamily: Fonts.rounded,
  },
  roundTargetControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  adjustButtonDisabled: {
    opacity: 0.4,
  },
  adjustButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  targetBadge: {
    minWidth: 48,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
  },
  targetBadgeLabel: {
    fontFamily: Fonts.mono,
    fontSize: 16,
  },
  roundHelperText: {
    fontSize: 13,
  },
  progressIndicator: {
    flex: 1,
    height: 8,
    borderRadius: 999,
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
  flowControls: {
    flexDirection: 'row',
    gap: 12,
  },
  flowSection: {
    marginTop: 12,
    gap: 12,
  },
  focusModeButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  focusModeButtonLabel: {
    fontFamily: Fonts.mono,
    fontWeight: '600',
  },
  flowButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  flowButtonPrimary: {},
  flowButtonDisabled: {
    opacity: 0.4,
  },
  flowButtonLabel: {
    fontFamily: Fonts.mono,
  },
  flowButtonLabelPrimary: {
    fontWeight: '600',
  },
  currentBeadHelper: {
    marginTop: 8,
    fontSize: 13,
  },
  completeRoundButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeRoundLabel: {
    fontWeight: '600',
    color: '#ffffff',
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
  currentBead: {
    transform: [{ scale: 1.1 }],
    borderWidth: 2,
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
