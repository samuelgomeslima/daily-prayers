import { Link } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HolySpiritSymbol } from '@/components/holy-spirit-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type MoreOption = {
  title: string;
  description: string;
  icon: Parameters<typeof IconSymbol>[0]['name'];
  href: string;
};

const OPTIONS: MoreOption[] = [
  {
    title: 'IA Católica',
    description: 'Converse com a assistente e receba orientações pastorais.',
    icon: 'bubble.left.and.bubble.right.fill',
    href: '/chat',
  },
  {
    title: 'Plano de Vida',
    description: 'Defina práticas espirituais e acompanhe seu progresso.',
    icon: 'hands.sparkles.fill',
    href: '/life-plan',
  },
  {
    title: 'Anotações',
    description: 'Registre inspirações, intenções e lembretes espirituais.',
    icon: 'square.and.pencil',
    href: '/notes',
  },
  {
    title: 'Configurações',
    description: 'Ajuste preferências de oração, notificações e tema.',
    icon: 'gearshape.fill',
    href: '/settings',
  },
];

export default function MoreScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <ThemedView style={styles.container} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
      <HolySpiritSymbol size={220} opacity={0.12} style={styles.symbolTop} />
      <HolySpiritSymbol size={180} opacity={0.1} style={styles.symbolBottom} />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View
          style={[
            styles.heroCard,
            {
              borderColor: `${palette.border}55`,
              backgroundColor: colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
              shadowColor: `${palette.tint}26`,
            },
          ]}
        >
          <View
            style={[
              styles.heroAccent,
              {
                backgroundColor: colorScheme === 'dark' ? `${palette.tint}26` : `${palette.tint}1F`,
              },
            ]}
          />
          <View
            style={[
              styles.heroBadge,
              {
                borderColor: `${palette.tint}33`,
                backgroundColor: colorScheme === 'dark' ? `${palette.tint}1F` : `${palette.tint}14`,
              },
            ]}
          >
            <IconSymbol name="sparkles" size={16} color={palette.tint} />
            <ThemedText style={[styles.heroBadgeText, { color: palette.tint }]}>Ferramentas pastorais</ThemedText>
          </View>
          <ThemedText style={styles.heading}>Mais recursos</ThemedText>
          <ThemedText style={styles.subtitle}>
            Aprofunde sua experiência espiritual com ferramentas pensadas para o seu dia a dia de oração.
          </ThemedText>
          <View style={styles.tagList}>
            {['Planejamento diário', 'Direção espiritual', 'Notas inspiradas'].map((tag) => (
              <View
                key={tag}
                style={[
                  styles.tag,
                  {
                    borderColor: `${palette.tint}35`,
                    backgroundColor: colorScheme === 'dark' ? `${palette.tint}22` : `${palette.tint}18`,
                  },
                ]}
              >
                <ThemedText style={[styles.tagText, { color: palette.tint }]}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Ferramentas em destaque</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Escolha uma área e aprofunde sua vivência espiritual com curadoria pastoral.
          </ThemedText>
        </View>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => (
            <Link key={option.href} href={option.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: `${palette.border}55`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                    shadowColor: `${palette.tint}26`,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}
                android_ripple={{ color: `${palette.tint}1A` }}
              >
                <View style={styles.optionHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: colorScheme === 'dark' ? `${palette.tint}22` : `${palette.tint}18`,
                        borderColor: `${palette.tint}35`,
                      },
                    ]}
                  >
                    <IconSymbol name={option.icon} size={24} color={palette.tint} />
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={palette.icon} />
                </View>
                <View style={styles.textContainer}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionDescription}>{option.description}</ThemedText>
                  <View style={styles.optionFooter}>
                    <View
                      style={[
                        styles.linkPill,
                        {
                          borderColor: `${palette.tint}33`,
                          backgroundColor: colorScheme === 'dark' ? `${palette.tint}20` : `${palette.tint}15`,
                        },
                      ]}
                    >
                      <IconSymbol name="arrow.up.right" size={14} color={palette.tint} />
                      <ThemedText style={[styles.linkPillText, { color: palette.tint }]}>Abrir recurso</ThemedText>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 56,
  },
  symbolTop: {
    position: 'absolute',
    top: -70,
    right: -60,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    transform: [{ scaleX: -1 }, { rotate: '-6deg' }],
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 16,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 36,
    elevation: 6,
  },
  heroAccent: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
    borderRadius: 24,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    marginTop: 32,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.7,
  },
  optionsContainer: {
    gap: 18,
    marginTop: 20,
  },
  option: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 5,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    gap: 10,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.78,
  },
  optionFooter: {
    flexDirection: 'row',
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
  },
  linkPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
