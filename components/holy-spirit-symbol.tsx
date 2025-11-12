import { StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type HolySpiritSymbolProps = ViewProps & {
  size?: number;
  opacity?: number;
};

export function HolySpiritSymbol({ size = 160, opacity = 1, style, pointerEvents, ...rest }: HolySpiritSymbolProps) {
  const auraColor = useThemeColor(
    { light: 'rgba(5, 142, 217, 0.12)', dark: 'rgba(76, 184, 248, 0.16)' },
    'overlay'
  );
  const doveColor = useThemeColor({ light: '#ffffff', dark: '#E3F4FF' }, 'surface');
  const accentColor = useThemeColor({ light: '#058ED9', dark: '#4CB8F8' }, 'tint');
  const rayColor = useThemeColor({ light: '#6FC4F1', dark: '#2C9BD7' }, 'icon');

  const width = size;
  const height = size * 1.1;

  return (
    <View
      style={[
        styles.wrapper,
        {
          width,
          height,
          opacity,
        },
        style,
      ]}
      pointerEvents={pointerEvents ?? 'none'}
      {...rest}>
      <View
        style={[
          styles.aura,
          {
            backgroundColor: auraColor,
            width,
            height,
            borderRadius: width,
          },
        ]}
      />

      {Array.from({ length: 5 }).map((_, index) => {
        const baseAngle = (-40 + index * 20).toString();
        return (
          <View
            key={`ray-${index}`}
            style={[
              styles.ray,
              {
                backgroundColor: rayColor,
                width: width * 0.06,
                height: height * 0.32,
                top: height * 0.08,
                left: width / 2 - (width * 0.03),
                transform: [
                  { rotate: `${baseAngle}deg` },
                  { translateY: -height * 0.05 },
                ],
              },
            ]}
          />
        );
      })}

      <View
        style={[
          styles.body,
          {
            backgroundColor: doveColor,
            width: width * 0.44,
            height: height * 0.34,
            top: height * 0.4,
            left: width * 0.28,
            borderRadius: width,
          },
        ]}
      />

      <View
        style={[
          styles.head,
          {
            backgroundColor: doveColor,
            width: width * 0.16,
            height: width * 0.16,
            top: height * 0.3,
            left: width * 0.42,
            borderRadius: width,
          },
        ]}
      />

      <View
        style={[
          styles.accent,
          {
            backgroundColor: accentColor,
            width: width * 0.16,
            height: width * 0.16,
            top: height * 0.52,
            left: width * 0.42,
            borderRadius: width,
          },
        ]}
      />

      <View
        style={[
          styles.tail,
          {
            backgroundColor: doveColor,
            width: width * 0.28,
            height: height * 0.32,
            top: height * 0.54,
            left: width * 0.36,
            borderBottomLeftRadius: width,
            borderBottomRightRadius: width,
          },
        ]}
      />

      <View
        style={[
          styles.wing,
          {
            backgroundColor: doveColor,
            width: width * 0.64,
            height: height * 0.28,
            top: height * 0.38,
            left: -width * 0.04,
            borderRadius: width,
            transform: [{ rotate: '-16deg' }],
          },
        ]}
      />

      <View
        style={[
          styles.wing,
          {
            backgroundColor: doveColor,
            width: width * 0.64,
            height: height * 0.28,
            top: height * 0.38,
            left: width * 0.4,
            borderRadius: width,
            transform: [{ rotate: '16deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  aura: {
    position: 'absolute',
  },
  ray: {
    position: 'absolute',
    borderRadius: 999,
  },
  body: {
    position: 'absolute',
  },
  head: {
    position: 'absolute',
  },
  accent: {
    position: 'absolute',
    opacity: 0.85,
  },
  tail: {
    position: 'absolute',
  },
  wing: {
    position: 'absolute',
    opacity: 0.92,
  },
});
