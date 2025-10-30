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
      <HolySpiritSymbol size={160} opacity={0.15} style={styles.symbolTop} />
      <HolySpiritSymbol size={140} opacity={0.12} style={styles.symbolBottom} />
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View
          style={[
            styles.headerCard,
            {
              borderColor: `${palette.border}55`,
              backgroundColor: colorScheme === 'dark' ? Colors.dark.surfaceMuted : Colors.light.surfaceMuted,
              shadowColor: `${palette.tint}1A`,
            },
          ]}
        >
          <ThemedText style={styles.heading}>Mais recursos</ThemedText>
          <ThemedText style={styles.subtitle}>
            Aprofunde sua experiência espiritual com ferramentas pensadas para o seu dia a dia de oração.
          </ThemedText>
        </View>
        <View style={styles.optionsContainer}>
          {OPTIONS.map((option) => (
            <Link key={option.href} href={option.href} asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: `${palette.border}66`,
                    backgroundColor: colorScheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
                    shadowColor: `${palette.tint}1A`,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: colorScheme === 'dark' ? `${palette.tint}22` : `${palette.tint}15`,
                      borderColor: `${palette.tint}30`,
                    },
                  ]}
                >
                  <IconSymbol name={option.icon} size={24} color={palette.tint} />
                </View>
                <View style={styles.textContainer}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionDescription}>{option.description}</ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={20} color={palette.icon} />
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
    paddingBottom: 40,
  },
  symbolTop: {
    position: 'absolute',
    top: -40,
    right: -30,
  },
  symbolBottom: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    transform: [{ scaleX: -1 }],
  },
  headerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.82,
  },
  optionsContainer: {
    gap: 16,
    marginTop: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 1,
    gap: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.75,
  },
});
