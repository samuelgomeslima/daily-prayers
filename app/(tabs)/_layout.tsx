import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme ?? 'light'];
  const baseTabBarStyle = {
    backgroundColor: palette.surface,
    borderTopColor: palette.border,
    height: 78,
    paddingTop: 6,
    paddingBottom: 12,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  } as const;
  const tabBarStyle = Platform.OS === 'web' ? [styles.webTabBar, baseTabBarStyle] : baseTabBarStyle;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tint,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Home" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'Orações e Terços',
          tabBarLabel: ({ color }) => (
            <TabBarLabel color={color} title="Orações e Terços" />
          ),
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hands.sparkles.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="catechist"
        options={{
          title: 'Catequista',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Catequista" />,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="book.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'IA Católica',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="IA Católica" />,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Anotações',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Anotações" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.and.pencil" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configurações',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Configurações" />,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

type TabBarLabelProps = {
  color: string;
  title: string;
};

function TabBarLabel({ color, title }: TabBarLabelProps) {
  return (
    <ThemedText
      numberOfLines={2}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      style={[styles.tabLabel, { color }]}
    >
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  webTabBar: {
    paddingTop: 10,
    paddingBottom: 16,
    height: 82,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
});
