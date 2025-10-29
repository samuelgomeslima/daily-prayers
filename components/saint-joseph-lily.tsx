import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type SaintJosephLilyProps = {
  size?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function SaintJosephLily({ size = 280, opacity = 0.6, style }: SaintJosephLilyProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={style}
      opacity={opacity}
    >
      <Defs>
        <LinearGradient id="petalGradient" x1="0" y1="0" x2="0" y2="200">
          <Stop offset="0%" stopColor={palette.surfaceSecondary} stopOpacity={0.95} />
          <Stop offset="50%" stopColor={palette.lily} stopOpacity={0.85} />
          <Stop offset="100%" stopColor={palette.accentSecondary} stopOpacity={0.75} />
        </LinearGradient>
        <LinearGradient id="stemGradient" x1="0" y1="0" x2="0" y2="200">
          <Stop offset="0%" stopColor={palette.tint} stopOpacity={0.8} />
          <Stop offset="100%" stopColor={palette.accentSecondary} stopOpacity={0.9} />
        </LinearGradient>
      </Defs>

      <Path
        d="M100 115 C88 132 86 160 100 190 C114 160 112 132 100 115 Z"
        fill="url(#stemGradient)"
        opacity={0.85}
      />

      <Path
        d="M100 110 C60 120 38 100 42 72 C46 48 72 36 94 58 C84 22 102 6 118 20 C132 33 130 66 120 86 C140 68 164 74 170 96 C176 118 152 138 122 126 C132 150 120 170 100 170 C80 170 68 150 78 126 C48 138 24 118 30 96 C36 74 60 68 80 86 C70 66 68 33 82 20 C98 6 116 22 106 58 C128 36 154 48 158 72 C162 100 140 120 100 110 Z"
        fill="url(#petalGradient)"
      />

      <Circle cx="100" cy="104" r="10" fill={palette.tint} opacity={0.65} />
      <Circle cx="100" cy="104" r="4" fill={palette.surface} />
    </Svg>
  );
}
