import { Image } from 'expo-image';
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
          Direcionamos os usuários para o portal oficial do Vaticano, garantindo acesso
          direto às constituições, homilias e textos litúrgicos publicados pela Santa Sé
          no site original.
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Também destacamos as notícias em português do Vatican News, atualizadas pela
          própria Santa Sé. Ambos os canais são abertos no navegador do dispositivo para
          respeitar as diretrizes de acesso e funcionamento de cada site.
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

      <FeatureCard title="Liturgia Diária (Brasil)">
        <ThemedText style={styles.cardText}>
          Conteúdo sincronizado com o portal da Canção Nova, garantindo acesso às leituras,
          salmos e orações publicados em{' '}
          <ExternalLink href="https://liturgia.cancaonova.com/pb/">
            <ThemedText type="link">liturgia.cancaonova.com</ThemedText>
          </ExternalLink>
          . Respeitamos o formato original exibindo o link oficial em todas as sessões do app.
        </ThemedText>
        <ThemedText style={styles.cardNote}>
          • Conteúdo armazenado localmente apenas para leitura offline temporária, sempre
          com sincronização direta diária da fonte oficial.
        </ThemedText>
      </FeatureCard>

      <FeatureCard title="Jejum e Abstinência">
        <ThemedText style={styles.cardText}>
          Para orientar os fiéis nos tempos penitenciais, indicamos as normas oficiais da
          Conferência Nacional dos Bispos do Brasil (CNBB), que destacam a obrigatoriedade
          da abstinência de carne às sextas-feiras da Quaresma e o jejum na Quarta-feira de
          Cinzas e na Sexta-feira Santa para maiores de 18 e menores de 60 anos.
        </ThemedText>
        <ThemedText style={styles.cardText}>
          Recomendamos também iniciativas paroquiais para adaptar o jejum às realidades
          locais, sempre incentivando acompanhamento espiritual e a prática de obras de
          caridade como parte do compromisso penitencial.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.cnbb.org.br/"> 
            <ThemedText type="link">Orientações sobre jejum – CNBB</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.vatican.va/content/francesco/pt/messages/lent.html">
            <ThemedText type="link">Mensagens de Quaresma do Papa</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote}>
          • Incentivamos o uso de lembretes e notas no aplicativo para registrar os propósitos
          pessoais de jejum e práticas de caridade, fortalecendo a vivência comunitária.
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
          Não há API nacional unificada. Mantemos cadastro manual colaborativo e indicamos o
          guia atualizado da Arquidiocese de Belo Horizonte para ampliar a cobertura.
        </ThemedText>
        <View style={styles.actions}>
          <ExternalLink href="https://www.missadiariabh.com/missadiaria">
            <ThemedText type="link">Missas – missadiariabh.com</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.missadiariabh.com/confissoes">
            <ThemedText type="link">Confissões – missadiariabh.com</ThemedText>
          </ExternalLink>
        </View>
        <ThemedText style={styles.cardNote}>
          • Fichas cadastradas pela comunidade contam com revisão editorial, e os deep links
          levam direto aos horários oficiais mantidos pela arquidiocese.
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
});
