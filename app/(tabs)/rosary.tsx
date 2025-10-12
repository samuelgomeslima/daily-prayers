import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { PrayerBeadTracker, type PrayerSequence } from '@/components/prayer-bead-tracker';
import { RosaryMysteryTracker } from '@/components/rosary-mystery-tracker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

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

const bilingualPrayers = [
  {
    id: 'salve-rainha',
    title: 'Salve Rainha',
    portuguese:
      'Salve, Rainha, Mãe de misericórdia; vida, doçura e esperança nossa, salve. A vós bradamos, os degredados filhos de Eva. A vós suspiramos, gemendo e chorando neste vale de lágrimas. Eia, pois, advogada nossa, esses vossos olhos misericordiosos a nós volvei. E depois deste desterro, mostrai-nos Jesus, bendito fruto do vosso ventre. Ó clemente, ó piedosa, ó doce sempre Virgem Maria. Rogai por nós, santa Mãe de Deus, para que sejamos dignos das promessas de Cristo. Amém.',
    latin:
      'Salve, Regina, mater misericordiae; vita, dulcedo, et spes nostra, salve. Ad te clamamus, exsules filii Hevae. Ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia ergo, advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria. Ora pro nobis, sancta Dei Genetrix, ut digni efficiamur promissionibus Christi. Amen.',
  },
  {
    id: 'magnificat',
    title: 'Magnificat',
    portuguese:
      'A minha alma engrandece o Senhor, e o meu espírito se alegra em Deus, meu Salvador; porque olhou para a humildade de sua serva; doravante todas as gerações me chamarão bem-aventurada; porque o Poderoso fez em mim maravilhas, e Santo é o seu nome. Sua misericórdia se estende, de geração em geração, sobre os que o temem. Manifestou o poder do seu braço: dispersou os soberbos de coração. Derrubou do trono os poderosos e exaltou os humildes. Encheu de bens os famintos, e despediu os ricos de mãos vazias. Acolheu Israel, seu servo, lembrado de sua misericórdia, conforme prometera aos nossos pais, em favor de Abraão e de sua descendência, para sempre. Amém.',
    latin:
      'Magnificat anima mea Dominum; et exsultavit spiritus meus in Deo salutari meo, quia respexit humilitatem ancillae suae. Ecce enim ex hoc beatam me dicent omnes generationes, quia fecit mihi magna qui potens est, et sanctum nomen eius, et misericordia eius in progenies et progenies timentibus eum. Fecit potentiam in brachio suo; dispersit superbos mente cordis sui. Deposuit potentes de sede et exaltavit humiles. Esurientes implevit bonis et divites dimisit inanes. Suscepit Israel puerum suum, recordatus misericordiae suae, sicut locutus est ad patres nostros, Abraham et semini eius in saecula. Amen.',
  },
  {
    id: 'pater-noster',
    title: 'Pai-Nosso (Pater Noster)',
    portuguese:
      'Pai nosso que estais no céu, santificado seja o vosso nome; venha a nós o vosso reino; seja feita a vossa vontade, assim na terra como no céu; o pão nosso de cada dia nos dai hoje; perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido; e não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.',
    latin:
      'Pater noster, qui es in caelis, sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie; et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo. Amen.',
  },
  {
    id: 'ave-maria',
    title: 'Ave-Maria',
    portuguese:
      'Ave Maria, cheia de graça, o Senhor é convosco; bendita sois vós entre as mulheres, e bendito é o fruto do vosso ventre, Jesus. Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora de nossa morte. Amém.',
    latin:
      'Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.',
  },
  {
    id: 'gloria-patri',
    title: 'Glória ao Pai (Gloria Patri)',
    portuguese:
      'Glória ao Pai, ao Filho e ao Espírito Santo. Como era no princípio, agora e sempre. Amém.',
    latin:
      'Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.',
  },
];

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

      <ThemedView style={styles.section}>
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}
        >
          Mistérios do Santo Terço por dia
        </ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Selecione o conjunto correspondente ao dia e marque cada mistério à medida que avança
          nas dezenas.
        </ThemedText>

        <RosaryMysteryTracker sets={dailyMysteries} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText
          type="subtitle"
          style={[styles.sectionTitle, { fontFamily: Fonts.serif }]}
        >
          Orações em Português e Latim
        </ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Reze nas duas línguas tradicionais da Igreja: memorize, acompanhe o áudio do seu
          diretor espiritual ou partilhe com o seu grupo de oração.
        </ThemedText>

        {bilingualPrayers.map((prayer) => (
          <ThemedView
            key={prayer.id}
            style={styles.prayerCard}
            lightColor="#F2F7F5"
            darkColor="#0F1D1A"
          >
            <ThemedText
              type="subtitle"
              style={[styles.prayerTitle, { fontFamily: Fonts.serif }]}
            >
              {prayer.title}
            </ThemedText>

            <ThemedText
              style={styles.languageLabel}
              lightColor="#356859"
              darkColor="#9FE2BF"
            >
              Português
            </ThemedText>
            <ThemedText style={styles.prayerText}>{prayer.portuguese}</ThemedText>

            <ThemedText
              style={styles.languageLabel}
              lightColor="#356859"
              darkColor="#9FE2BF"
            >
              Latim
            </ThemedText>
            <ThemedText style={styles.prayerText}>{prayer.latin}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
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
  prayerCard: {
    padding: 18,
    borderRadius: 16,
    gap: 8,
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
});
