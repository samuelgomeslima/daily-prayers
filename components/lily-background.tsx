import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { SaintJosephLily } from './saint-joseph-lily';

type LilyBackgroundProps = {
  variant?: 'default' | 'compact';
  style?: StyleProp<ViewStyle>;
};

export function LilyBackground({ variant = 'default', style }: LilyBackgroundProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const layout = variant === 'compact' ? compactLayout : defaultLayout;

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <View
        style={[
          styles.halo,
          layout.halo,
          {
            backgroundColor: palette.highlight,
            opacity: isDark ? 0.32 : 0.68,
          },
        ]}
      />
      <View
        style={[
          styles.halo,
          layout.lowerHalo,
          {
            backgroundColor: palette.surfaceSecondary,
            opacity: isDark ? 0.2 : 0.35,
          },
        ]}
      />
      <SaintJosephLily
        size={layout.primarySize}
        opacity={isDark ? 0.35 : 0.22}
        style={[styles.primary, layout.primary]}
      />
      <SaintJosephLily
        size={layout.secondarySize}
        opacity={isDark ? 0.25 : 0.16}
        style={[styles.secondary, layout.secondary]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  primary: {
    position: 'absolute',
    transform: [{ rotate: '10deg' }],
  },
  secondary: {
    position: 'absolute',
    transform: [{ rotate: '-12deg' }],
  },
});

const defaultLayout = {
  halo: {
    top: -160,
    right: -110,
    width: 360,
    height: 360,
  },
  lowerHalo: {
    bottom: -180,
    left: -120,
    width: 320,
    height: 320,
  },
  primary: {
    top: -120,
    right: -70,
  },
  secondary: {
    bottom: -150,
    left: -90,
  },
  primarySize: 340,
  secondarySize: 220,
} as const;

const compactLayout = {
  halo: {
    top: -120,
    right: -80,
    width: 280,
    height: 280,
  },
  lowerHalo: {
    bottom: -140,
    left: -90,
    width: 260,
    height: 260,
  },
  primary: {
    top: -90,
    right: -50,
  },
  secondary: {
    bottom: -120,
    left: -70,
  },
  primarySize: 260,
  secondarySize: 180,
} as const;
