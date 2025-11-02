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
                  styles.optionRow,
                  {
                    borderColor: `${palette.border}55`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                    shadowColor: `${palette.tint}26`,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}
                android_ripple={{ color: `${palette.tint}1A` }}
              >
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
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionDescription} numberOfLines={2}>
                    {option.description}
                  </ThemedText>
                </View>
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
    paddingTop: 24,
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
  sectionHeader: {
    marginTop: 8,
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
    gap: 12,
    marginTop: 20,
  },
  optionRow: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 4,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.75,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  linkPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
