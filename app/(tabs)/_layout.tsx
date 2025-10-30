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
  const tabBarStyle = Platform.OS === 'web' ? styles.webTabBar : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.tabIconSelected,
        tabBarInactiveTintColor: palette.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          tabBarStyle,
          {
            backgroundColor: palette.surface,
            borderTopColor: palette.border,
          },
        ],
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
          title: 'Orações',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Orações" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="hands.sparkles.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rosaries"
        options={{
          title: 'Terços',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Terços" />,
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="sparkles" color={color} />,
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
        name="more"
        options={{
          title: 'Mais',
          tabBarLabel: ({ color }) => <TabBarLabel color={color} title="Mais" />,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="circle.grid.3x3.fill" color={color} />
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
  tabBar: {
    paddingTop: 10,
    paddingBottom: 16,
    height: 82,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  webTabBar: {
    paddingTop: 8,
    paddingBottom: 12,
    height: 76,
  },
});
