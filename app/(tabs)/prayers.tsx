import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bilingualPrayers } from '@/constants/bilingual-prayers';
import { Fonts } from '@/constants/theme';

export default function PrayersScreen() {
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

      {bilingualPrayers.map((prayer) => (
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
      ))}
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
});
