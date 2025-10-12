import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { PrayerBeadTracker, type PrayerSequence } from '@/components/prayer-bead-tracker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

const rosarySequence: PrayerSequence = {
  id: 'dominican-rosary',
  name: 'Santo Rosário',
  description: 'Acompanhe cada conta do rosário dominicano, marcando Pai-Nossos, Ave-Marias e orações finais.',
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

export default function RosaryScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F4E9F7', dark: '#1F1527' }}
      headerImage={
        <IconSymbol
          size={320}
          color="#B47BC7"
          name="circle.grid.3x3.fill"
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Contador de Terços
        </ThemedText>
        <ThemedText style={styles.lead}>
          Marque cada conta enquanto reza o Santo Rosário ou o Terço da Divina Misericórdia. O progresso fica visível em cada seção, facilitando retomar a oração caso se distraia.
        </ThemedText>
      </ThemedView>

      <PrayerBeadTracker sequence={rosarySequence} />
      <PrayerBeadTracker sequence={divineMercySequence} />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    position: 'absolute',
    bottom: -80,
    left: -20,
    opacity: 0.2,
  },
  titleContainer: {
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 22,
  },
});
