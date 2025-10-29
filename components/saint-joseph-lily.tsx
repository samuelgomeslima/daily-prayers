import { StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type SaintJosephLilyProps = ViewProps & {
  size?: number;
  opacity?: number;
};

export function SaintJosephLily({ size = 160, opacity = 1, style, ...rest }: SaintJosephLilyProps) {
  const petalColor = useThemeColor({ light: '#F7F7FF', dark: '#DDE2FF' }, 'surface');
  const outlineColor = useThemeColor({ light: 'rgba(125, 112, 242, 0.45)', dark: 'rgba(165, 180, 255, 0.45)' }, 'tint');
  const stemColorLight = '#4A8F81';
  const stemColorDark = '#6DB6A8';
  const stemColor = useThemeColor({ light: stemColorLight, dark: stemColorDark }, 'icon');
  const centerColor = useThemeColor({ light: '#F7C873', dark: '#FFDFA6' }, 'tint');

  const width = size;
  const height = size * 1.25;
  const petalWidth = width * 0.42;
  const petalHeight = height * 0.58;

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
      {...rest}>
      <View
        style={[
          styles.stem,
          {
            backgroundColor: stemColor,
            width: width * 0.08,
            height: height * 0.55,
            top: height * 0.45,
            left: width / 2 - (width * 0.04),
          },
        ]}
      />
      <View
        style={[
          styles.leaf,
          {
            backgroundColor: stemColor,
            width: width * 0.46,
            height: height * 0.28,
            top: height * 0.58,
            left: width * 0.54,
            transform: [{ rotate: '28deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.leaf,
          {
            backgroundColor: stemColor,
            width: width * 0.46,
            height: height * 0.28,
            top: height * 0.58,
            left: -width * 0.0,
            transform: [{ rotate: '-28deg' }],
          },
        ]}
      />
      {Array.from({ length: 5 }).map((_, index) => {
        const rotation = [-18, 18, -56, 56, 0][index];
        const top = [height * 0.1, height * 0.1, height * 0.18, height * 0.18, height * 0.28][index];
        const left = [width * 0.07, width * 0.51, width * -0.02, width * 0.6, width * 0.29][index];

        return (
          <View
            key={`petal-${index}`}
            style={[
              styles.petal,
              {
                width: petalWidth,
                height: petalHeight,
                backgroundColor: petalColor,
                borderColor: outlineColor,
                top,
                left,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          />
        );
      })}
      <View
        style={[
          styles.center,
          {
            backgroundColor: centerColor,
            width: width * 0.22,
            height: width * 0.22,
            top: height * 0.42,
            left: width * 0.39,
          },
        ]}
      />
      <View
        style={[
          styles.center,
          {
            backgroundColor: '#FFFFFFDD',
            width: width * 0.16,
            height: width * 0.16,
            top: height * 0.38,
            left: width * 0.42,
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
  stem: {
    borderRadius: 999,
    position: 'absolute',
  },
  leaf: {
    position: 'absolute',
    borderRadius: 120,
    opacity: 0.85,
  },
  petal: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    opacity: 0.92,
  },
  center: {
    position: 'absolute',
    borderRadius: 999,
  },
});
