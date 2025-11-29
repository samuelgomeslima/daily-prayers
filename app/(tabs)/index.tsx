import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CARD_COLORS = {
  light: Colors.light.surface,
  dark: Colors.dark.surface,
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <ParallaxScrollView>
      <View style={styles.content}>
        <ThemedView style={styles.titleContainer}>
          <HolySpiritSymbol size={110} opacity={0.22} style={styles.titleSymbol} />
          <ThemedText type="title" style={styles.title}>
            Conteúdo litúrgico oficial
          </ThemedText>
          <ThemedText style={styles.lead}>
            Resumo das integrações aprovadas para disponibilizar leituras, ofício diário,
            santos e horários de celebrações no aplicativo.
          </ThemedText>
        </ThemedView>

        <FeatureCard title="Liturgia Diária (Brasil)">
          <View style={styles.actions}>
            <ExternalLink href="https://liturgia.cancaonova.com/pb/">
              <ThemedText type="link">liturgia.cancaonova.com</ThemedText>
            </ExternalLink>
          </View>
        </FeatureCard>

        <FeatureCard title="Horários de Missas e Confissões">
          <View style={styles.actions}>
            <ExternalLink href="https://www.missadiariabh.com/missadiaria">
              <ThemedText type="link">Missas – missadiariabh.com</ThemedText>
            </ExternalLink>
            <ExternalLink href="https://www.missadiariabh.com/confissoes">
              <ThemedText type="link">Confissões – missadiariabh.com</ThemedText>
            </ExternalLink>
          </View>
        </FeatureCard>

        <FeatureCard title="Santo do Dia">
          <View style={styles.actions}>
            <ExternalLink href="https://santo.cancaonova.com/">
              <ThemedText type="link">Santo do Dia – Canção Nova</ThemedText>
            </ExternalLink>
          </View>
        </FeatureCard>

        <FeatureCard title="Jejum e Abstinência">
          <View style={styles.actions}>
            <ExternalLink href="https://www.cnbb.org.br/">
              <ThemedText type="link">Orientações sobre jejum – CNBB</ThemedText>
            </ExternalLink>
            <ExternalLink href="https://www.vatican.va/content/francesco/pt/messages/lent.html">
              <ThemedText type="link">Mensagens de Quaresma do Papa</ThemedText>
            </ExternalLink>
          </View>
        </FeatureCard>

        <FeatureCard title="Documentos e Liturgia (Vaticano)">
          <View style={styles.actions}>
            <ExternalLink href="https://www.vatican.va/content/vatican/pt.html">
              <ThemedText type="link">Portal oficial do Vaticano</ThemedText>
            </ExternalLink>
            <ExternalLink href="https://www.vaticannews.va/pt.html">
              <ThemedText type="link">Vatican News em português</ThemedText>
            </ExternalLink>
          </View>
        </FeatureCard>
      </View>
    </ParallaxScrollView>
  );
}

type FeatureCardProps = {
  title: string;
  children: ReactNode;
};

function FeatureCard({ title, children }: FeatureCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <ThemedView
      style={[styles.card, { borderColor: `${palette.border}80`, shadowColor: `${palette.tint}26` }]}
      lightColor={CARD_COLORS.light}
      darkColor={CARD_COLORS.dark}
    >
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  titleContainer: {
    gap: 6,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  titleSymbol: {
    position: 'absolute',
    right: -20,
    top: -30,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 20,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 6,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
