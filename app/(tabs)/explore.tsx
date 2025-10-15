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

      <Collapsible title="Configuração do Assistente Catequista">
        <ThemedText>
          1. No portal do OpenAI, copie o <ThemedText type="defaultSemiBold">ID do agente</ThemedText> que você criou (Assistants → seu agente → “Agent ID”).
        </ThemedText>
        <ThemedText>
          2. No Azure Static Web Apps (ou no ambiente onde as funções estão rodando), defina as variáveis <ThemedText type="defaultSemiBold">OPENAI_API_KEY</ThemedText> e <ThemedText type="defaultSemiBold">OPENAI_CATECHIST_AGENT_ID</ThemedText> com os valores correspondentes.
        </ThemedText>
        <ThemedText>
          3. Se quiser testar em dispositivos físicos, exponha o endpoint configurando <ThemedText type="defaultSemiBold">EXPO_PUBLIC_CATECHIST_BASE_URL</ThemedText> (ou reutilize <ThemedText type="defaultSemiBold">EXPO_PUBLIC_CHAT_BASE_URL</ThemedText>) apontando para a URL pública da Static Web App.
        </ThemedText>
        <ThemedText>
          4. Publique as alterações. Depois que as funções forem atualizadas, abra a aba do assistente e envie uma mensagem para validar se o agente está respondendo conforme o esperado.
        </ThemedText>
      </Collapsible>

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

      <Collapsible title="Fluxo da Liturgia Diária (Canção Nova)">
        <ThemedText>
          Sincronização diária com{' '}
          <ExternalLink href="https://liturgia.cancaonova.com/pb/">
            <ThemedText type="link">liturgia.cancaonova.com</ThemedText>
          </ExternalLink>{' '}
          garantindo que leituras, salmos e orações sigam a publicação oficial disponibilizada pela comunidade Canção Nova.
        </ThemedText>
        <ThemedText>
          Implementamos cache local apenas para uso offline de curto prazo e exibimos aviso sobre a
          procedência da fonte em todas as telas relacionadas.
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
          Também oferecemos deep links para os guias oficiais da Arquidiocese de Belo Horizonte,
          com horários publicados em{' '}
          <ExternalLink href="https://www.missadiariabh.com/missadiaria">
            <ThemedText type="link">missadiariabh.com/missadiaria</ThemedText>
          </ExternalLink>{' '}
          e as agendas de confissões em{' '}
          <ExternalLink href="https://www.missadiariabh.com/confissoes">
            <ThemedText type="link">missadiariabh.com/confissoes</ThemedText>
          </ExternalLink>{' '}
          para complementar a busca do usuário.
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
