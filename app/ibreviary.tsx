import { useState, type CSSProperties } from 'react';
import { ActivityIndicator, Platform, StyleSheet } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const IBREVIARY_URL = 'https://www.ibreviary.org/m2/breviario.php?l=pt';

export default function IbreviaryScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const tint = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Liturgia das Horas</ThemedText>
        <ThemedText style={styles.description}>
          Conteúdo oficial provido pelo iBreviary enquanto os acordos próprios são
          formalizados. A navegação ocorre dentro do aplicativo mantendo a identidade visual da
          fonte original.
        </ThemedText>
        <ExternalLink href="https://www.ibreviary.org">
          <ThemedText type="link">Visitar ibreviary.org</ThemedText>
        </ExternalLink>
      </ThemedView>

      <ThemedView style={styles.webViewContainer}>
        {Platform.OS === 'web' ? (
          <iframe title="iBreviary" src={IBREVIARY_URL} style={styles.iframe as CSSProperties} />
        ) : (
          <WebViewContent onLoaded={() => setIsLoading(false)} />
        )}
        {isLoading && Platform.OS !== 'web' ? (
          <ActivityIndicator size="large" color={tint} style={styles.spinner} />
        ) : null}
      </ThemedView>

      <ThemedText style={styles.footerText}>
        Dica: utilize o menu interno do iBreviary para alternar entre horas, leituras e outras
        orações do dia.
      </ThemedText>
    </ThemedView>
  );
}

type WebViewContentProps = {
  onLoaded: () => void;
};

function WebViewContent({ onLoaded }: WebViewContentProps) {
  // Importação isolada para manter o bundle web enxuto.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WebView } = require('react-native-webview');

  return (
    <WebView
      source={{ uri: IBREVIARY_URL }}
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
