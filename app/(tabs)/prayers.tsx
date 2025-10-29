import { useMemo, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { SaintJosephLily } from '@/components/saint-joseph-lily';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { PrayerBeadTracker, type PrayerSequence } from '@/components/prayer-bead-tracker';
import { RosaryMysteryTracker } from '@/components/rosary-mystery-tracker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bilingualPrayers } from '@/constants/bilingual-prayers';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const dailyMysteries = [
  {
    id: 'joyful',
    title: 'Mistérios Gozosos',
    days: 'Segunda-feira e Sábado',
    mysteries: [
      '1º A Anunciação do Anjo Gabriel a Maria',
      '2º A visitação de Maria a Santa Isabel',
      '3º O nascimento de Jesus em Belém',
      '4º A apresentação de Jesus no Templo',
      '5º O reencontro de Jesus no Templo',
    ],
  },
  {
    id: 'sorrowful',
    title: 'Mistérios Dolorosos',
    days: 'Terça-feira e Sexta-feira',
    mysteries: [
      '1º A agonia de Jesus no Horto',
      '2º A flagelação de Jesus atado à coluna',
      '3º A coroação de espinhos',
      '4º Jesus carrega a cruz até o Calvário',
      '5º A crucifixão e morte de Jesus',
    ],
  },
  {
    id: 'glorious',
    title: 'Mistérios Gloriosos',
    days: 'Quarta-feira e Domingo',
    mysteries: [
      '1º A ressurreição do Senhor',
      '2º A ascensão de Jesus aos céus',
      '3º A vinda do Espírito Santo em Pentecostes',
      '4º A assunção de Maria ao céu',
      '5º A coroação de Maria como Rainha do Céu e da Terra',
    ],
  },
  {
    id: 'luminous',
    title: 'Mistérios Luminosos',
    days: 'Quinta-feira',
    mysteries: [
      '1º O Batismo de Jesus no Jordão',
      '2º As Bodas de Caná',
      '3º O anúncio do Reino de Deus com o convite à conversão',
      '4º A Transfiguração de Jesus',
      '5º A instituição da Eucaristia',
    ],
  },
];

const rosarySequence: PrayerSequence = {
  id: 'dominican-rosary',
  name: 'Santo Rosário',
  description:
    'Acompanhe cada conta do rosário dominicano, marcando Pai-Nossos, Ave-Marias e orações finais.',
  sections: [
    {
      title: 'Abertura',
      description:
        'Inicie com o Sinal da Cruz, reze o Credo, um Pai-Nosso, três Ave-Marias e o Glória ao Pai.',
      beads: [
        { id: 'rosary-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'rosary-opening-creed', label: 'Credo dos Apóstolos', type: 'large' },
        { id: 'rosary-opening-our-father', label: 'Pai-Nosso', type: 'large' },
        { id: 'rosary-opening-hail-1', label: 'Ave-Maria 1', type: 'small' },
        { id: 'rosary-opening-hail-2', label: 'Ave-Maria 2', type: 'small' },
        { id: 'rosary-opening-hail-3', label: 'Ave-Maria 3', type: 'small' },
        { id: 'rosary-opening-glory', label: 'Glória ao Pai', type: 'marker' },
      ],
    },
    ...Array.from({ length: 5 }, (_, index) => {
      const decadeNumber = index + 1;
      return {
        title: `Dezena ${decadeNumber}`,
        description:
          'Medite no mistério correspondente, reze um Pai-Nosso, dez Ave-Marias e o Glória ao Pai.',
        beads: [
          {
            id: `rosary-decade-${decadeNumber}-our-father`,
            label: 'Pai-Nosso',
            type: 'large',
          },
          ...Array.from({ length: 10 }, (_, beadIndex) => ({
            id: `rosary-decade-${decadeNumber}-hail-${beadIndex + 1}`,
            label: `Ave-Maria ${beadIndex + 1}`,
            type: 'small',
          })),
          {
            id: `rosary-decade-${decadeNumber}-glory`,
            label: 'Glória ao Pai',
            type: 'marker',
          },
        ],
      };
    }),
    {
      title: 'Conclusão',
      description: 'Reze a Salve Rainha e as jaculatórias finais.',
      beads: [
        { id: 'rosary-closing-hail-holy-queen', label: 'Salve Rainha', type: 'marker' },
        { id: 'rosary-closing-final-prayers', label: 'Orações finais', type: 'marker' },
      ],
    },
  ],
};

const divineMercySequence: PrayerSequence = {
  id: 'divine-mercy-chaplet',
  name: 'Terço da Divina Misericórdia',
  description: 'Use as contas do rosário para acompanhar as invocações da Divina Misericórdia.',
  sections: [
    {
      title: 'Abertura',
      description: 'Sinal da Cruz seguido de um Pai-Nosso, uma Ave-Maria e o Credo.',
      beads: [
        { id: 'mercy-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'mercy-opening-our-father', label: 'Pai-Nosso', type: 'large' },
        { id: 'mercy-opening-hail-mary', label: 'Ave-Maria', type: 'small' },
        { id: 'mercy-opening-creed', label: 'Creio', type: 'large' },
      ],
    },
    ...Array.from({ length: 5 }, (_, index) => {
      const decadeNumber = index + 1;
      return {
        title: `Dezena ${decadeNumber}`,
        description:
          'No Pai-Nosso reze “Eterno Pai...” e nas dez contas pequenas repita “Pela sua dolorosa Paixão...”.',
        beads: [
          {
            id: `mercy-decade-${decadeNumber}-eternal-father`,
            label: 'Eterno Pai',
            type: 'large',
          },
          ...Array.from({ length: 10 }, (_, beadIndex) => ({
            id: `mercy-decade-${decadeNumber}-passion-${beadIndex + 1}`,
            label: `Paixão ${beadIndex + 1}`,
            type: 'small',
          })),
        ],
      };
    }),
    {
      title: 'Conclusão',
      description: 'Finalize com “Santo Deus” (três vezes) e as orações opcionais.',
      beads: [
        { id: 'mercy-closing-holy-god-1', label: 'Santo Deus 1', type: 'marker' },
        { id: 'mercy-closing-holy-god-2', label: 'Santo Deus 2', type: 'marker' },
        { id: 'mercy-closing-holy-god-3', label: 'Santo Deus 3', type: 'marker' },
        { id: 'mercy-closing-final-prayer', label: 'Oração final', type: 'marker' },
      ],
    },
  ],
};

export default function PrayersScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrayers = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    if (!normalizedQuery) {
      return bilingualPrayers;
    }

    return bilingualPrayers.filter((prayer) => {
      const combinedText = `${prayer.title}\n${prayer.portuguese}\n${prayer.latin}`;
      return normalizeText(combinedText).includes(normalizedQuery);
    });
  }, [searchQuery]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: palette.backgroundGradientEnd,
        dark: palette.backgroundGradientEnd,
      }}
      headerImage={
        <SaintJosephLily
          size={340}
          opacity={colorScheme === 'dark' ? 0.45 : 0.3}
          style={styles.headerIllustration}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Orações e Terços
        </ThemedText>
        <ThemedText style={styles.lead} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          Reze nas duas línguas tradicionais da Igreja e acompanhe cada conta do rosário com os
          contadores interativos.
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={[styles.searchContainer, { borderColor: palette.border, shadowColor: palette.shadow }]}
        lightColor={Colors.light.surface}
        darkColor={Colors.dark.surface}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Busque por título ou trecho"
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.tint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.searchInput, { color: palette.text }]}
          accessibilityLabel="Buscar orações"
        />
      </ThemedView>

      {filteredPrayers.length === 0 ? (
        <ThemedView
          style={[styles.emptyState, { borderColor: palette.border }]}
          lightColor={Colors.light.surface}
          darkColor={Colors.dark.surface}
        >
          <ThemedText style={styles.emptyStateText} lightColor={palette.textMuted} darkColor={palette.textMuted}>
            Nenhuma oração encontrada. Ajuste sua busca e tente novamente.
          </ThemedText>
        </ThemedView>
      ) : (
        filteredPrayers.map((prayer) => (
          <ThemedView
            key={prayer.id}
            style={[styles.prayerCard, { borderColor: palette.border, shadowColor: palette.shadow }]}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}
          >
            <ThemedText type="subtitle" style={[styles.prayerTitle, { fontFamily: Fonts.serif }]}>
              {prayer.title}
            </ThemedText>

            <ThemedText style={styles.languageLabel} lightColor={palette.tint} darkColor={palette.accentSecondary}>
              Português
            </ThemedText>
            <ThemedText style={styles.prayerText}>{prayer.portuguese}</ThemedText>

            <ThemedText style={styles.languageLabel} lightColor={palette.tint} darkColor={palette.accentSecondary}>
              Latim
            </ThemedText>
            <ThemedText style={styles.prayerText}>{prayer.latin}</ThemedText>
          </ThemedView>
        ))
      )}

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}>
          Contador de Terços
        </ThemedText>
        <ThemedText style={styles.sectionDescription} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          Marque cada conta enquanto reza o Santo Rosário ou o Terço da Divina Misericórdia. O
          progresso fica visível em cada seção, facilitando retomar a oração caso se distraia.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}>
          Mistérios do Santo Terço por dia
        </ThemedText>
        <ThemedText style={styles.sectionDescription} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          Selecione o conjunto correspondente ao dia e marque cada mistério à medida que avança nas
          dezenas.
        </ThemedText>

        <RosaryMysteryTracker sets={dailyMysteries} />
      </ThemedView>

      <ThemedView style={styles.trackerWrapper}>
        <PrayerBeadTracker sequence={rosarySequence} />
      </ThemedView>
      <ThemedView style={styles.trackerWrapper}>
        <PrayerBeadTracker sequence={divineMercySequence} />
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerIllustration: {
    position: 'absolute',
    bottom: -70,
    right: -30,
  },
  titleContainer: {
    gap: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 22,
  },
  prayerCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 4,
  },
  prayerTitle: {
    fontSize: 18,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  prayerText: {
    lineHeight: 22,
  },
  searchContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
  },
  emptyState: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 22,
  },
  sectionDescription: {
    lineHeight: 22,
  },
  trackerWrapper: {
    marginTop: 24,
  },
});
