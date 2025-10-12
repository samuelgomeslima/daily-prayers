import { useState, type CSSProperties } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const SOURCES = {
  documents: {
    label: 'Portal Vaticano',
    url: 'https://www.vatican.va/content/vatican/pt.html',
    summary:
      'Acesso aos textos oficiais da Santa Sé com constituições apostólicas, homilias, cartas e documentos litúrgicos.',
  },
  news: {
    label: 'Vatican News',
    url: 'https://www.vaticannews.va/pt.html',
    summary:
      'Cobertura jornalística diária, transmissões e boletins diretamente da comunicação oficial do Vaticano.',
  },
} as const;

type SourceKey = keyof typeof SOURCES;

export default function VaticanScreen() {
  const [selectedSource, setSelectedSource] = useState<SourceKey>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const tint = useThemeColor({}, 'tint');
  const icon = useThemeColor({}, 'icon');
  const background = useThemeColor({}, 'background');

  const activeSource = SOURCES[selectedSource];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Vaticano em foco</ThemedText>
        <ThemedText style={styles.description}>
          Consulte diretamente as publicações oficiais e notícias em português do Vaticano.
          Os conteúdos carregam dentro do aplicativo preservando o layout original e os
          avisos canônicos de cada site.
        </ThemedText>
        <View style={styles.headerLinks}>
          <ExternalLink href="https://www.vatican.va/content/vatican/pt.html">
            <ThemedText type="link">Abrir vatican.va</ThemedText>
          </ExternalLink>
          <ExternalLink href="https://www.vaticannews.va/pt.html">
            <ThemedText type="link">Abrir Vatican News</ThemedText>
          </ExternalLink>
        </View>
      </ThemedView>

      <View style={styles.toggleGroup}>
        {(Object.keys(SOURCES) as SourceKey[]).map((key) => {
          const isActive = key === selectedSource;
          const source = SOURCES[key];

          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              onPress={() => {
                setSelectedSource(key);
                setIsLoading(true);
              }}
              style={({ pressed }) => [
                styles.toggleButton,
                {
                  borderColor: isActive ? tint : icon,
                  backgroundColor: isActive ? tint : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <ThemedText
                type="defaultSemiBold"
                style={styles.toggleLabel}
                lightColor={isActive ? '#fff' : undefined}
                darkColor={isActive ? background : undefined}>
                {source.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText style={styles.summary}>{activeSource.summary}</ThemedText>

      <ThemedView style={styles.webViewContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            key={activeSource.url}
            title={activeSource.label}
            src={activeSource.url}
            onLoad={() => setIsLoading(false)}
            style={styles.iframe as CSSProperties}
          />
        ) : (
          <WebViewContent
            key={activeSource.url}
            url={activeSource.url}
            onLoaded={() => setIsLoading(false)}
          />
        )}
        {isLoading && Platform.OS !== 'web' ? (
          <ActivityIndicator size="large" color={tint} style={styles.spinner} />
        ) : null}
      </ThemedView>

      <ThemedText style={styles.footerText}>
        Dica: utilize os menus internos para navegar entre documentos, transmissões e
        destaques do Vaticano diretamente no site oficial.
      </ThemedText>
    </ThemedView>
  );
}

type WebViewContentProps = {
  url: string;
  onLoaded: () => void;
};

function WebViewContent({ url, onLoaded }: WebViewContentProps) {
  // Importação isolada para manter o bundle web enxuto.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WebView } = require('react-native-webview');

  return (
    <WebView
      source={{ uri: url }}
      startInLoadingState
      onLoadEnd={onLoaded}
      onError={onLoaded}
      style={styles.nativeWebView}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  description: {
    lineHeight: 20,
  },
  headerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summary: {
    lineHeight: 20,
  },
  webViewContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nativeWebView: {
    flex: 1,
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: '0px',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -12,
  },
  footerText: {
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
