import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

type QuickAction = {
  href: string;
  title: string;
  description: string;
};

const ACTION_CARD_COLORS = {
  light: '#F4F8FF',
  dark: '#101723',
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: '/(tabs)/services',
    title: 'Serviços oficiais',
    description:
      'Consulte fontes aprovadas para leituras, notícias e horários de celebrações.',
  },
  {
    href: '/(tabs)/rosary',
    title: 'Guia do Rosário',
    description: 'Acompanhe as contas, mistérios diários e invocações do Santo Rosário.',
  },
  {
    href: '/(tabs)/prayers',
    title: 'Orações bilíngues',
    description: 'Reze em português e latim com busca rápida e cards acessíveis.',
  },
  {
    href: '/(tabs)/catechist',
    title: 'Assistente Catequista',
    description:
      'Envie perguntas por texto ou voz e receba respostas fundamentadas no magistério.',
  },
];

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E2ECF6', dark: '#0F1924' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.heroContainer}>
        <ThemedText type="title" style={styles.heroTitle}>
          Seu companheiro diário de oração
        </ThemedText>
        <ThemedText style={styles.heroLead}>
          Organize devocionais, acesse conteúdos oficiais da Igreja e conte com apoio
          espiritual inteligente em um único lugar.
        </ThemedText>
      </ThemedView>

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Acesso rápido
      </ThemedText>

      <ThemedView style={styles.actionList}>
        {QUICK_ACTIONS.map((action) => (
          <ActionCard key={action.href} {...action} />
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

function ActionCard({ href, title, description }: QuickAction) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => [styles.actionPressable, pressed && styles.actionPressed]}
        accessibilityRole="button"
        accessibilityHint={`Abrir ${title}`}
      >
        <ThemedView
          style={styles.actionCard}
          lightColor={ACTION_CARD_COLORS.light}
          darkColor={ACTION_CARD_COLORS.dark}
        >
          <ThemedText type="subtitle" style={styles.actionTitle}>
            {title}
          </ThemedText>
          <ThemedText style={styles.actionDescription}>{description}</ThemedText>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: 200,
    width: 320,
    bottom: -40,
    left: -20,
    position: 'absolute',
    opacity: 0.4,
  },
  heroContainer: {
    gap: 12,
    marginBottom: 24,
  },
  heroTitle: {
    fontFamily: Fonts.rounded,
  },
  heroLead: {
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: Fonts.serif,
    marginBottom: 12,
  },
  actionList: {
    gap: 12,
  },
  actionPressable: {
    borderRadius: 16,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionCard: {
    padding: 18,
    borderRadius: 16,
    gap: 8,
  },
  actionTitle: {
    fontFamily: Fonts.serif,
  },
  actionDescription: {
    lineHeight: 20,
  },
});

