/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#7B74F2';
const tintColorDark = '#B8C4FF';

export const Colors = {
  light: {
    text: '#2A2550',
    textMuted: '#5F5A86',
    background: '#F5F3FF',
    backgroundGradientStart: '#F5F3FF',
    backgroundGradientEnd: '#E6ECFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#EFEAFF',
    surfaceTertiary: '#E2F0FF',
    highlight: '#DDE7FF',
    border: '#D5CCFF',
    shadow: 'rgba(82, 73, 156, 0.12)',
    tint: tintColorLight,
    accentSecondary: '#8DD2FF',
    icon: '#8A86B6',
    tabIconDefault: '#9C97C9',
    tabIconSelected: tintColorLight,
    lily: '#C0B5FF',
  },
  dark: {
    text: '#E7E9FF',
    textMuted: '#B6B9DE',
    background: '#111326',
    backgroundGradientStart: '#111326',
    backgroundGradientEnd: '#1C2540',
    surface: '#1D223A',
    surfaceSecondary: '#252C4A',
    surfaceTertiary: '#1F2B48',
    highlight: '#2F3A5C',
    border: '#2E3962',
    shadow: 'rgba(3, 7, 18, 0.6)',
    tint: tintColorDark,
    accentSecondary: '#6FB7FF',
    icon: '#8F97CC',
    tabIconDefault: '#7C83B7',
    tabIconSelected: tintColorDark,
    lily: '#7B8AFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
