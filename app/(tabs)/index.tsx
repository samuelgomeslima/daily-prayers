import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { SaintJosephLily } from '@/components/saint-joseph-lily';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FeatureCardProps = {
  title: string;
  children: ReactNode;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const cardColors = useMemo(
    () => ({
      light: Colors.light.surface,
      dark: Colors.dark.surface,
    }),
    []
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        light: palette.backgroundGradientEnd,
        dark: palette.backgroundGradientEnd,
      }}
      headerImage={
        <SaintJosephLily
          size={360}
          opacity={colorScheme === 'dark' ? 0.5 : 0.35}
          style={styles.headerIllustration}
        />
      }
    >
      <ThemedView style={styles.pageIntro}>
        <View style={styles.pageTitleWrapper}>
          <View style={[styles.pageAccent, { backgroundColor: palette.tint }]} />
          <ThemedText type="title" style={styles.title}>
            Conteúdo litúrgico oficial
          </ThemedText>
        </View>
        <ThemedText style={styles.lead} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          Resumo das integrações aprovadas para disponibilizar leituras, ofício diário, santos e horários de celebrações no
          aplicativo.
        </ThemedText>
      </ThemedView>

      <FeatureCard title="Documentos e Liturgia (Vaticano)" cardColors={cardColors}>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Direcionamos os usuários para o portal oficial do Vaticano, garantindo acesso direto às constituições, homilias e
          textos litúrgicos publicados pela Santa Sé no site original.
        </ThemedText>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Também destacamos as notícias em português do Vatican News, atualizadas pela própria Santa Sé. Ambos os canais são
          abertos no navegador do dispositivo para respeitar as diretrizes de acesso e funcionamento de cada site.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.vatican.va/content/vatican/pt.html">
            <ThemedText type="link">Portal oficial do Vaticano</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.vaticannews.va/pt.html">
            <ThemedText type="link">Vatican News em português</ThemedText>
          </ExternalLink>
        </View>
      </FeatureCard>

      <FeatureCard title="Liturgia Diária (Brasil)" cardColors={cardColors}>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Conteúdo sincronizado com o portal da Canção Nova, garantindo acesso às leituras, salmos e orações publicados em{' '}
          <ExternalLink href="https://liturgia.cancaonova.com/pb/">
            <ThemedText type="link">liturgia.cancaonova.com</ThemedText>
          </ExternalLink>
          . Respeitamos o formato original exibindo o link oficial em todas as sessões do app.
        </ThemedText>
        <ThemedText style={styles.cardNote} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          • Conteúdo armazenado localmente apenas para leitura offline temporária, sempre com sincronização direta diária da
          fonte oficial.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Jejum e Abstinência" cardColors={cardColors}>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Para orientar os fiéis nos tempos penitenciais, indicamos as normas oficiais da Conferência Nacional dos Bispos do
          Brasil (CNBB), que destacam a obrigatoriedade da abstinência de carne às sextas-feiras da Quaresma e o jejum na
          Quarta-feira de Cinzas e na Sexta-feira Santa para maiores de 18 e menores de 60 anos.
        </ThemedText>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Recomendamos também iniciativas paroquiais para adaptar o jejum às realidades locais, sempre incentivando
          acompanhamento espiritual e a prática de obras de caridade como parte do compromisso penitencial.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.cnbb.org.br/">
            <ThemedText type="link">Orientações sobre jejum – CNBB</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.vatican.va/content/francesco/pt/messages/lent.html">
            <ThemedText type="link">Mensagens de Quaresma do Papa</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          • Incentivamos o uso de lembretes e notas no aplicativo para registrar os propósitos pessoais de jejum e práticas de
          caridade, fortalecendo a vivência comunitária.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Santo do Dia" cardColors={cardColors}>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Consumimos portais católicos confiáveis, como Canção Nova, e mantemos cache diário para reduzir acessos consecutivos.
          Créditos e links diretos são exibidos no app junto ao conteúdo resumido.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://santo.cancaonova.com/">
            <ThemedText type="link">Santo do Dia – Canção Nova</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          • O cache é renovado diariamente e limpo automaticamente para garantir que novas biografias sejam carregadas com
          pontualidade.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Horários de Missas e Confissões" cardColors={cardColors}>
        <ThemedText style={styles.cardText} lightColor={palette.text} darkColor={palette.text}>
          Não há API nacional unificada. Mantemos cadastro manual colaborativo e indicamos o guia atualizado da Arquidiocese de
          Belo Horizonte para ampliar a cobertura.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.missadiariabh.com/missadiaria">
            <ThemedText type="link">Missas – missadiariabh.com</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.missadiariabh.com/confissoes">
            <ThemedText type="link">Confissões – missadiariabh.com</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote} lightColor={palette.textMuted} darkColor={palette.textMuted}>
          • Fichas cadastradas pela comunidade contam com revisão editorial, e os deep links levam direto aos horários oficiais
          mantidos pela arquidiocese.
        </ThemedText>
      </FeatureCard>
    </ParallaxScrollView>
  );
}

type InternalFeatureCardProps = FeatureCardProps & {
  cardColors: { light: string; dark: string };
};

function FeatureCard({ title, children, cardColors }: InternalFeatureCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <ThemedView
      style={[styles.card, { shadowColor: palette.shadow, borderColor: palette.border }]}
      lightColor={cardColors.light}
      darkColor={cardColors.dark}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardMarker, { backgroundColor: palette.tint }]} />
        <ThemedText type="subtitle" style={styles.cardTitle}>
          {title}
        </ThemedText>
      </View>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerIllustration: {
    position: 'absolute',
    bottom: -60,
    right: -40,
  },
  pageIntro: {
    gap: 16,
    marginBottom: 32,
  },
  pageTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageAccent: {
    width: 6,
    height: 48,
    borderRadius: 999,
  },
  title: {
    fontFamily: Fonts.rounded,
    flex: 1,
  },
  lead: {
    lineHeight: 22,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardMarker: {
    width: 14,
    height: 14,
    borderRadius: 999,
    opacity: 0.85,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
  },
  cardText: {
    lineHeight: 22,
  },
  cardNote: {
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
