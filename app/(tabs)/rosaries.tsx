import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { PrayerBeadTracker, type PrayerSequence } from '@/components/prayer-bead-tracker';
import { RosaryMysteryTracker, type MysterySet } from '@/components/rosary-mystery-tracker';
import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const dailyMysteries: MysterySet[] = [
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

const mercySequence: PrayerSequence = {
  id: 'divine-mercy-chaplet',
  name: 'Terço da Misericórdia',
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

const saintJosephSequence: PrayerSequence = {
  id: 'saint-joseph-chaplet',
  name: 'Terço de São José',
  description:
    'Recorde as virtudes do patrono da Igreja, pedindo sua intercessão paternal em cada conta.',
  sections: [
    {
      title: 'Abertura',
      description: 'Sinal da Cruz seguido de uma oração a São José e um Pai-Nosso.',
      beads: [
        { id: 'joseph-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'joseph-opening-prayer', label: 'Oração a São José', type: 'large' },
        { id: 'joseph-opening-our-father', label: 'Pai-Nosso', type: 'large' },
      ],
    },
    ...Array.from({ length: 5 }, (_, index) => {
      const decadeNumber = index + 1;
      return {
        title: `Dezena ${decadeNumber}`,
        description:
          'No Pai-Nosso medite em São José e nas contas menores repita “São José, valei-nos!”.',
        beads: [
          {
            id: `joseph-decade-${decadeNumber}-our-father`,
            label: 'Pai-Nosso',
            type: 'large',
          },
          ...Array.from({ length: 10 }, (_, beadIndex) => ({
            id: `joseph-decade-${decadeNumber}-hail-${beadIndex + 1}`,
            label: `São José ${beadIndex + 1}`,
            type: 'small',
          })),
          {
            id: `joseph-decade-${decadeNumber}-glory`,
            label: 'Glória ao Pai',
            type: 'marker',
          },
        ],
      };
    }),
    {
      title: 'Conclusão',
      description: 'Reze o Lembrai-vos de São José e agradeça pela proteção recebida.',
      beads: [
        { id: 'joseph-closing-remember', label: 'Lembrai-vos', type: 'marker' },
        { id: 'joseph-closing-final-prayer', label: 'Agradecimento final', type: 'marker' },
      ],
    },
  ],
};

const immaculateHeartSequence: PrayerSequence = {
  id: 'immaculate-heart-chaplet',
  name: 'Terço do Imaculado Coração de Maria',
  description:
    'Consagre-se ao Imaculado Coração meditando sobre sua ternura materna e pedidos de reparação.',
  sections: [
    {
      title: 'Abertura',
      description: 'Inicie com o Sinal da Cruz, ato de consagração e um Pai-Nosso.',
      beads: [
        { id: 'immaculate-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'immaculate-opening-consecration', label: 'Ato de Consagração', type: 'large' },
        { id: 'immaculate-opening-our-father', label: 'Pai-Nosso', type: 'large' },
      ],
    },
    ...Array.from({ length: 5 }, (_, index) => {
      const decadeNumber = index + 1;
      return {
        title: `Dezena ${decadeNumber}`,
        description:
          'Ofereça cada dezena em reparação ao Imaculado Coração rezando “Coração de Maria, intercedei por nós”.',
        beads: [
          {
            id: `immaculate-decade-${decadeNumber}-our-father`,
            label: 'Pai-Nosso',
            type: 'large',
          },
          ...Array.from({ length: 10 }, (_, beadIndex) => ({
            id: `immaculate-decade-${decadeNumber}-invocation-${beadIndex + 1}`,
            label: `Intercedei ${beadIndex + 1}`,
            type: 'small',
          })),
          {
            id: `immaculate-decade-${decadeNumber}-glory`,
            label: 'Glória ao Pai',
            type: 'marker',
          },
        ],
      };
    }),
    {
      title: 'Conclusão',
      description: 'Finalize com o Magnificat e a oração do Ângelus opcional.',
      beads: [
        { id: 'immaculate-closing-magnificat', label: 'Magnificat', type: 'marker' },
        { id: 'immaculate-closing-angelus', label: 'Ângelus', type: 'marker' },
      ],
    },
  ],
};

const byzantineSequence: PrayerSequence = {
  id: 'byzantine-chaplet',
  name: 'Terço Bizantino (Chotki)',
  description:
    'Percorra a corda de oração com a Oração de Jesus, marcando cada invocação compassada.',
  sections: [
    {
      title: 'Início',
      description: 'Sinal da Cruz oriental e invocações à Santíssima Trindade.',
      beads: [
        { id: 'byzantine-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'byzantine-opening-trisagion', label: 'Triságion', type: 'large' },
      ],
    },
    ...Array.from({ length: 4 }, (_, segmentIndex) => {
      const segmentNumber = segmentIndex + 1;
      return {
        title: `Série ${segmentNumber}`,
        description:
          'Repita a Oração de Jesus em cada nó, mantendo o ritmo de respiração e a atenção no Nome.',
        beads: [
          ...Array.from({ length: 25 }, (_, beadIndex) => ({
            id: `byzantine-series-${segmentNumber}-jesus-prayer-${beadIndex + 1}`,
            label: `Oração de Jesus ${beadIndex + 1}`,
            type: 'small',
          })),
        ],
      };
    }),
    {
      title: 'Conclusão',
      description: 'Agradeça em silêncio e encerre com o Pai-Nosso e o Hino à Mãe de Deus.',
      beads: [
        { id: 'byzantine-closing-our-father', label: 'Pai-Nosso', type: 'large' },
        { id: 'byzantine-closing-theotokos', label: 'Hino à Mãe de Deus', type: 'marker' },
      ],
    },
  ],
};

const missionarySequence: PrayerSequence = {
  id: 'missionary-chaplet',
  name: 'Terço Missionário',
  description:
    'Reze pelos cinco continentes oferecendo cada dezena por uma intenção missionária específica.',
  sections: [
    {
      title: 'Abertura',
      description: 'Sinal da Cruz, oração do Espírito Santo e um Pai-Nosso.',
      beads: [
        { id: 'missionary-opening-cross', label: 'Sinal da Cruz', type: 'marker' },
        { id: 'missionary-opening-holy-spirit', label: 'Vinde Espírito Santo', type: 'large' },
        { id: 'missionary-opening-our-father', label: 'Pai-Nosso', type: 'large' },
      ],
    },
    ...[
      { continent: 'África', color: 'verde' },
      { continent: 'Américas', color: 'vermelho' },
      { continent: 'Europa', color: 'branco' },
      { continent: 'Oceania', color: 'azul' },
      { continent: 'Ásia', color: 'amarelo' },
    ].map(({ continent, color }, index) => ({
      title: `Dezena ${index + 1} — ${continent}`,
      description: `Ofereça pelas missões na ${continent}, lembrando o significado da cor ${color}.`,
      beads: [
        {
          id: `missionary-decade-${index + 1}-our-father`,
          label: 'Pai-Nosso',
          type: 'large',
        },
        ...Array.from({ length: 10 }, (_, beadIndex) => ({
          id: `missionary-decade-${index + 1}-hail-${beadIndex + 1}`,
          label: `Ave-Maria ${beadIndex + 1}`,
          type: 'small',
        })),
        {
          id: `missionary-decade-${index + 1}-glory`,
          label: 'Glória ao Pai',
          type: 'marker',
        },
      ],
    })),
    {
      title: 'Conclusão',
      description: 'Reze a oração do Anjo Missionário e a bênção final.',
      beads: [
        { id: 'missionary-closing-prayer', label: 'Oração Missionária', type: 'marker' },
        { id: 'missionary-closing-blessing', label: 'Bênção final', type: 'marker' },
      ],
    },
  ],
};

const sequences: PrayerSequence[] = [
  rosarySequence,
  mercySequence,
  saintJosephSequence,
  immaculateHeartSequence,
  byzantineSequence,
  missionarySequence,
];

export default function RosariesScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [expandedSequenceId, setExpandedSequenceId] = useState<string | null>(null);

  const toggleSequence = (sequenceId: string) => {
    setExpandedSequenceId((current) => (current === sequenceId ? null : sequenceId));
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: Colors.light.heroAccent,
        dark: Colors.dark.heroAccent,
      }}
      headerImage={
        <View style={styles.headerImage}>
          <View style={[styles.headerGlow, { backgroundColor: `${palette.tint}1A` }]} />
          <HolySpiritSymbol size={220} opacity={0.8} style={styles.headerSymbol} />
          <IconSymbol
            size={72}
            color={palette.tint}
            name="sparkles"
            style={styles.headerIcon}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <HolySpiritSymbol size={96} opacity={0.18} style={styles.titleSymbol} />
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}> 
          Terços
        </ThemedText>
        <ThemedText style={styles.lead}>
          Explore os mistérios do dia e acompanhe cada conta somente do terço que estiver rezando,
          com contadores interativos sempre ao seu alcance.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}>
          Mistérios do Santo Terço por dia
        </ThemedText>
        <ThemedText style={styles.sectionDescription}>
          O conjunto correspondente ao dia em São Paulo fica automaticamente em destaque. Marque
          cada mistério ao avançar pelas dezenas.
        </ThemedText>

        <RosaryMysteryTracker sets={dailyMysteries} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}>
          Contadores interativos
        </ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Abra apenas o terço desejado para visualizar o contador completo e manter o foco na oração
          atual.
        </ThemedText>

        {sequences.map((sequence) => {
          const isExpanded = expandedSequenceId === sequence.id;
          return (
            <ThemedView
              key={sequence.id}
              style={[
                styles.sequenceCard,
                {
                  borderColor: `${palette.border}99`,
                  shadowColor: `${palette.tint}1A`,
                },
                isExpanded && {
                  borderColor: palette.tint,
                  backgroundColor: `${palette.tint}0D`,
                  shadowColor: `${palette.tint}33`,
                },
              ]}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}
            >
              <Pressable
                onPress={() => toggleSequence(sequence.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                style={({ pressed }) => [
                  styles.sequenceHeader,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.sequenceHeaderText}>
                  <ThemedText
                    type="subtitle"
                    style={[styles.sequenceTitle, { fontFamily: Fonts.serif }]}
                  >
                    {sequence.name}
                  </ThemedText>
                  <ThemedText
                    style={styles.sequenceHint}
                    lightColor={`${Colors.light.text}7A`}
                    darkColor={`${Colors.dark.text}7A`}
                  >
                    Toque para {isExpanded ? 'fechar' : 'abrir'} o contador interativo.
                  </ThemedText>
                </View>
                <IconSymbol
                  name={isExpanded ? 'chevron.up.circle.fill' : 'chevron.down.circle'}
                  size={28}
                  color={palette.tint}
                />
              </Pressable>
              <ThemedText style={styles.sequenceDescription}>{sequence.description}</ThemedText>

              {isExpanded && (
                <View style={styles.trackerWrapper}>
                  <PrayerBeadTracker sequence={sequence} />
                </View>
              )}
            </ThemedView>
          );
        })}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    opacity: 0.6,
    transform: [{ translateY: 32 }],
  },
  headerSymbol: {
    transform: [{ translateY: 30 }],
  },
  headerIcon: {
    position: 'absolute',
    bottom: 32,
    right: 48,
    opacity: 0.5,
  },
  titleContainer: {
    gap: 12,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  titleSymbol: {
    position: 'absolute',
    right: -20,
    top: -16,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
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
  sequenceCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.08,
  },
  sequenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  sequenceHeaderText: {
    flex: 1,
    gap: 8,
  },
  sequenceTitle: {
    fontSize: 20,
  },
  sequenceDescription: {
    lineHeight: 22,
  },
  sequenceHint: {
    fontSize: 13,
  },
  trackerWrapper: {
    marginTop: 8,
  },
});
