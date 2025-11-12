import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bilingualPrayers, type BilingualPrayer } from '@/constants/bilingual-prayers';
import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function PrayersScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrayer, setSelectedPrayer] = useState<BilingualPrayer | null>(null);
  const [modalLanguage, setModalLanguage] = useState<'portuguese' | 'latin'>('portuguese');

  const handleSelectPrayer = (prayer: BilingualPrayer) => {
    setSelectedPrayer(prayer);
    setModalLanguage('portuguese');
  };

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
      headerBackgroundColor={{
        light: Colors.light.heroAccent,
        dark: Colors.dark.heroAccent,
      }}
      headerImage={
        <View style={styles.headerImage}>
          <View style={[styles.headerGlow, { backgroundColor: `${palette.tint}1A` }]} />
          <HolySpiritSymbol size={220} opacity={0.8} style={styles.headerSymbol} />
          <IconSymbol
            size={72}
            color={palette.tint}
            name="hands.sparkles.fill"
            style={styles.headerIcon}
          />
        </View>
      }>
      <ThemedView style={styles.titleContainer}>
        <HolySpiritSymbol size={96} opacity={0.18} style={styles.titleSymbol} />
        <ThemedText type="title" style={[styles.title, { fontFamily: Fonts.rounded }]}> 
          Orações
        </ThemedText>
        <ThemedText style={styles.lead}>
          Reze nas duas línguas tradicionais da Igreja e encontre rapidamente a oração que precisa.
        </ThemedText>
      </ThemedView>

      <ThemedView
        style={styles.searchContainer}
        lightColor={Colors.light.surface}
        darkColor={Colors.dark.surface}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Busque por título ou trecho"
          placeholderTextColor={
            colorScheme === 'dark' ? '#7C88C7' : '#7B82B6'
          }
          selectionColor={colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[
            styles.searchInput,
            {
              color: palette.text,
            },
          ]}
          accessibilityLabel="Buscar orações"
        />
      </ThemedView>

      {filteredPrayers.length === 0 ? (
        <ThemedView
          style={styles.emptyState}
          lightColor={Colors.light.surface}
          darkColor={Colors.dark.surface}
        >
          <ThemedText style={styles.emptyStateText}>
            Nenhuma oração encontrada. Ajuste sua busca e tente novamente.
          </ThemedText>
        </ThemedView>
      ) : (
        filteredPrayers.map((prayer) => (
          <Pressable
            key={prayer.id}
            accessibilityRole="button"
            accessibilityLabel={`Visualizar a oração ${prayer.title}`}
            onPress={() => handleSelectPrayer(prayer)}
            style={({ pressed }) => [
              styles.prayerPressable,
              pressed && styles.prayerPressablePressed,
            ]}
          >
            <ThemedView
              style={[
                styles.prayerCard,
                {
                  borderColor: `${palette.border}99`,
                  shadowColor: `${palette.tint}1A`,
                },
              ]}
              lightColor={Colors.light.surface}
              darkColor={Colors.dark.surface}
            >
              <View style={styles.prayerHeader}>
                <ThemedText
                  type="subtitle"
                  style={[styles.prayerTitle, { fontFamily: Fonts.serif }]}
                >
                  {prayer.title}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        ))
      )}
      <Modal
        animationType="slide"
        visible={selectedPrayer !== null}
        transparent
        onRequestClose={() => setSelectedPrayer(null)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={styles.modalContainer}
            lightColor={Colors.light.surface}
            darkColor={Colors.dark.surface}
          >
            <View style={styles.modalHeader}>
              <ThemedText
                type="subtitle"
                style={[styles.modalTitle, { fontFamily: Fonts.serif }]}
              >
                {selectedPrayer?.title}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar oração"
                onPress={() => setSelectedPrayer(null)}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol
                  name="xmark.circle.fill"
                  size={24}
                  color={palette.tint}
                />
              </Pressable>
            </View>
            <View style={styles.languageToggleContainer}>
              {(['portuguese', 'latin'] as const).map((language) => (
                <Pressable
                  key={language}
                  accessibilityRole="button"
                  accessibilityLabel={`Ler oração em ${
                    language === 'portuguese' ? 'português' : 'latim'
                  }`}
                  onPress={() => setModalLanguage(language)}
                  style={({ pressed }) => [
                    styles.languageToggleButton,
                    {
                      backgroundColor:
                        modalLanguage === language ? palette.tint : 'transparent',
                      borderColor:
                        modalLanguage === language
                          ? palette.tint
                          : `${palette.border}80`,
                    },
                    pressed && styles.languageToggleButtonPressed,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.languageToggleText,
                      {
                        color:
                          modalLanguage === language ? palette.surface : palette.text,
                      },
                    ]}
                  >
                    {language === 'portuguese' ? 'Português' : 'Latim'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ThemedText style={styles.prayerText}>
                {modalLanguage === 'portuguese'
                  ? selectedPrayer?.portuguese
                  : selectedPrayer?.latin}
              </ThemedText>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    opacity: 0.6,
    transform: [{ translateY: 32 }],
  },
  headerSymbol: {
    transform: [{ translateY: 30 }],
  },
  headerIcon: {
    position: 'absolute',
    bottom: 32,
    right: 48,
    opacity: 0.5,
  },
  titleContainer: {
    gap: 12,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  titleSymbol: {
    position: 'absolute',
    right: -20,
    top: -16,
  },
  title: {
    fontFamily: Fonts.rounded,
  },
  lead: {
    lineHeight: 22,
  },
  prayerPressable: {
    marginTop: 12,
  },
  prayerPressablePressed: {
    transform: [{ scale: 0.99 }],
  },
  prayerCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    shadowOpacity: 0.08,
    gap: 8,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prayerTitle: {
    fontSize: 18,
    flex: 1,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.serif,
  },
  languageToggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  languageToggleButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  languageToggleButtonPressed: {
    opacity: 0.8,
  },
  languageToggleText: {
    fontFamily: Fonts.rounded,
    fontSize: 14,
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 32,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    flex: 1,
  },
  modalContent: {
    paddingBottom: 16,
  },
});
