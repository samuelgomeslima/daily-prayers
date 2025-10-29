/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#730fad';
const tintColorDark = '#0064b2';

export const Colors = {
  light: {
    text: '#1A0E32',
    background: '#ffffff',
    tint: tintColorLight,
    icon: '#0064b2',
    tabIconDefault: '#9FA6D9',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    surfaceMuted: '#EDE7F9',
    border: '#D2C5F1',
    overlay: 'rgba(115, 15, 173, 0.12)',
    heroBackground: '#F0F6FF',
    heroAccent: '#E5F1FF',
  },
  dark: {
    text: '#ffffff',
    background: '#0A0F2A',
    tint: tintColorDark,
    icon: '#8ABFE6',
    tabIconDefault: '#405B8A',
    tabIconSelected: tintColorDark,
    surface: '#141C3F',
    surfaceMuted: '#1B2352',
    border: '#233870',
    overlay: 'rgba(0, 100, 178, 0.2)',
    heroBackground: '#121B45',
    heroAccent: '#172A55',
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
