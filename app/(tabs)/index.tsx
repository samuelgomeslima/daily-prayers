import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';

const CARD_COLORS = {
  light: '#F2F6FB',
  dark: '#1C252F',
};

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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>
          Conteúdo litúrgico oficial
        </ThemedText>
        <ThemedText style={styles.lead}>
          Resumo das integrações aprovadas para disponibilizar leituras, ofício diário,
          santos e horários de celebrações no aplicativo.
        </ThemedText>
      </ThemedView>

      <FeatureCard title="Documentos e Liturgia (Vaticano)">
        <ThemedText style={styles.cardText}>
          Incorporamos o portal oficial do Vaticano para acesso direto às constituições,
          homilias e textos litúrgicos publicados pela Santa Sé. Todo o conteúdo é
          consumido via WebView preservando a formatação e os avisos canônicos.
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Também disponibilizamos um atalho para as notícias em português do Vatican News
          com atualização contínua do Vaticano. Ambos os canais estão acessíveis dentro do
          aplicativo ou no navegador.
        </ThemedText>
        <View style={styles.actions}>
          <Link href="/vatican" style={styles.actionLink}>
            <ThemedText type="link">Abrir recursos do Vaticano</ThemedText>
          </Link>
          <ExternalLink href="https://www.vatican.va/content/vatican/pt.html">
            <ThemedText type="link">Portal oficial do Vaticano</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.vaticannews.va/pt.html">
            <ThemedText type="link">Vatican News em português</ThemedText>
          </ExternalLink>
        </View>
      </FeatureCard>

      <FeatureCard title="Liturgia Diária (Brasil)">
        <ThemedText style={styles.cardText}>
          Referência primária fornecida pela CNBB. Todo conteúdo diário é validado contra a
          publicação oficial ({' '}
          <ExternalLink href="https://liturgia.cnbb.org.br/">
            <ThemedText type="link">Liturgia Diária CNBB</ThemedText>
          </ExternalLink>
          {' '}
          ) e quaisquer APIs próprias são desenvolvidas apenas com autorização formal da
          conferência episcopal.
        </ThemedText>
        <ThemedText style={styles.cardNote}>
          • Conteúdo armazenado localmente apenas para leitura offline temporária, sempre
          com sincronização diária direta da fonte oficial.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Santo do Dia">
        <ThemedText style={styles.cardText}>
          Consumimos portais católicos confiáveis, como Canção Nova, e mantemos cache
          diário para reduzir acessos consecutivos. Créditos e links diretos são exibidos
          no app junto ao conteúdo resumido.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://santo.cancaonova.com/">
            <ThemedText type="link">Santo do Dia – Canção Nova</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote}>
          • O cache é renovado diariamente e limpo automaticamente para garantir que novas
          biografias sejam carregadas com pontualidade.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Horários de Missas e Confissões">
        <ThemedText style={styles.cardText}>
          Não há API nacional unificada. Adotamos cadastro manual colaborativo dentro do
          app e oferecemos atalhos para buscadores consolidados para ampliar a cobertura.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.horariodemissa.com.br/">
            <ThemedText type="link">horariodemissa.com.br</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://apps.apple.com/br/app/hor%C3%A1rios-de-missa/id1381090076">
            <ThemedText type="link">App Horários de Missa (global)</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote}>
          • Fichas cadastradas pela comunidade contam com revisão editorial e deep links
          abrem pesquisas externas quando necessário.
        </ThemedText>
      </FeatureCard>
    </ParallaxScrollView>
  );
}

type FeatureCardProps = {
  title: string;
  children: ReactNode;
};

function FeatureCard({ title, children }: FeatureCardProps) {
  return (
    <ThemedView style={styles.card} lightColor={CARD_COLORS.light} darkColor={CARD_COLORS.dark}>
      <ThemedText type="subtitle" style={styles.cardTitle}>
        {title}
      </ThemedText>
      {children}
    </ThemedView>
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
  titleContainer: {
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 20,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
  },
  cardText: {
    lineHeight: 20,
  },
  cardNote: {
    lineHeight: 20,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionLink: {
    textDecorationLine: 'none',
  },
});
