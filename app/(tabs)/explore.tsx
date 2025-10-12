import { StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D6E6F5', dark: '#1E2732' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#5B7997"
          name="books.vertical"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Guia de implementação
        </ThemedText>
        <ThemedText>
          Detalhes práticos para operacionalizar cada fonte litúrgica dentro do aplicativo.
        </ThemedText>
      </ThemedView>

      <Collapsible title="Recursos oficiais do Vaticano">
        <ThemedText>
          Orientamos o acesso direto ao portal{' '}
          <ExternalLink href="https://www.vatican.va/content/vatican/pt.html">
            <ThemedText type="link">vatican.va</ThemedText>
          </ExternalLink>{' '}
          para consultar constituições apostólicas, homilias e documentos litúrgicos da Santa Sé,
          preservando a experiência original publicada pelo Vaticano.
        </ThemedText>
        <ThemedText>
          As notícias em português do{' '}
          <ExternalLink href="https://www.vaticannews.va/pt.html">
            <ThemedText type="link">vaticannews.va</ThemedText>
          </ExternalLink>{' '}
          são abertas no navegador do dispositivo, evitando bloqueios de incorporação e seguindo as
          diretrizes canônicas de uso dos portais oficiais.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Fluxo da Liturgia Diária (CNBB)">
        <ThemedText>
          Sincronização diária com{' '}
          <ExternalLink href="https://liturgia.cnbb.org.br/">
            <ThemedText type="link">liturgia.cnbb.org.br</ThemedText>
          </ExternalLink>{' '}
          garantindo que leituras, salmos e orações sigam a publicação oficial.
        </ThemedText>
        <ThemedText>
          Implementamos cache local apenas para uso offline de curto prazo e exibimos aviso sobre a
          procedência CNBB em todas as telas relacionadas.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Santo do Dia com cache e créditos">
        <ThemedText>
          Dados carregados de portais autorizados (ex.:{' '}
          <ExternalLink href="https://santo.cancaonova.com/">
            <ThemedText type="link">Canção Nova</ThemedText>
          </ExternalLink>
          ) e armazenados por 24 horas. Após esse período, uma nova requisição é realizada e os
          créditos são mantidos visíveis no card do santo.
        </ThemedText>
        <ThemedText>
          Implementamos fallback para quando não há conteúdo atualizado, exibindo mensagem amigável
          e link direto para a fonte.
        </ThemedText>
      </Collapsible>

      <Collapsible title="Cadastro manual de horários de missa">
        <ThemedText>
          Como não existe API nacional, adotamos formulários de envio no aplicativo. As entradas
          ficam associadas à paróquia e são revisadas antes da publicação.
        </ThemedText>
        <ThemedText>
          Também oferecemos deep links para buscadores externos como{' '}
          <ExternalLink href="https://www.horariodemissa.com.br/">
            <ThemedText type="link">horariodemissa.com.br</ThemedText>
          </ExternalLink>{' '}
          e o aplicativo global Horários de Missa para complementar a busca do usuário.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#5B7997',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    gap: 8,
  },
});
