import { useMemo, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bilingualPrayers } from '@/constants/bilingual-prayers';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function PrayersScreen() {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrayers = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim());

    if (!normalizedQuery) {
      return bilingualPrayers;
    }

    return bilingualPrayers.filter((prayer) => {
      const combinedText = `${prayer.title}\n${prayer.portuguese}\n${prayer.latin}`;
      return normalizeText(combinedText).includes(normalizedQuery);
    });
  }, [searchQuery]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#F9F6EF', dark: '#1B1A14' }}
      headerImage={
        <IconSymbol
          size={320}
          color="#C0A162"
          name="hands.sparkles.fill"
          style={styles.headerIcon}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}>
          Orações
        </ThemedText>
        <ThemedText style={styles.lead}>
          Reze nas duas línguas tradicionais da Igreja. Memorize cada texto, acompanhe o seu
          diretor espiritual ou partilhe com o grupo de oração.
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={styles.searchContainer}
        lightColor="#FFFFFF"
        darkColor="#111312"
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Busque por título ou trecho"
          placeholderTextColor={
            colorScheme === 'dark' ? '#9BA1A6' : '#687076'
          }
          selectionColor={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              color: colorScheme === 'dark' ? Colors.dark.text : Colors.light.text,
            },
          ]}
          accessibilityLabel="Buscar orações"
        />
      </ThemedView>

      {filteredPrayers.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <ThemedText style={styles.emptyStateText}>
            Nenhuma oração encontrada. Ajuste sua busca e tente novamente.
          </ThemedText>
        </ThemedView>
      ) : (
        filteredPrayers.map((prayer) => (
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
        ))
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerIcon: {
    position: 'absolute',
    bottom: -80,
    right: -20,
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
  prayerCard: {
    marginTop: 24,
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
  searchContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 16,
  },
  emptyState: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
