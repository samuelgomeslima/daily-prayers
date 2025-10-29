import { Link } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SaintJosephLily } from '@/components/saint-joseph-lily';
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
      <SaintJosephLily size={160} opacity={0.15} style={styles.lilyTop} />
      <SaintJosephLily size={140} opacity={0.12} style={styles.lilyBottom} />
      <ThemedText style={styles.heading}>Mais recursos</ThemedText>
      <View style={styles.optionsContainer}>
        {OPTIONS.map((option) => (
          <Link key={option.href} href={option.href} asChild>
            <Pressable style={({ pressed }) => [
                styles.option,
                {
                  borderColor: `${palette.border}88`,
                  backgroundColor: pressed
                    ? `${palette.tint}1F`
                    : colorScheme === 'dark'
                      ? Colors.dark.surface
                      : Colors.light.surface,
                  shadowColor: `${palette.tint}1A`,
                },
              ]}
            >
              <IconSymbol
                name={option.icon}
                size={28}
                color={palette.tint}
                style={styles.optionIcon}
              />
              <View style={styles.textContainer}>
                <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                <ThemedText style={styles.optionDescription}>{option.description}</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={20} color={palette.icon} />
            </Pressable>
          </Link>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  lilyTop: {
    position: 'absolute',
    top: -40,
    right: -30,
  },
  lilyBottom: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    transform: [{ scaleX: -1 }],
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 2,
  },
  optionIcon: {
    marginRight: 4,
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
