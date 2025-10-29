/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#5c10bf';
const tintColorDark = '#1e34a8';

export const Colors = {
  light: {
    text: '#14205c',
    background: '#e0fafe',
    tint: tintColorLight,
    icon: '#1e34a8',
    tabIconDefault: '#9faaf0',
    tabIconSelected: tintColorLight,
    surface: '#f4f7ff',
    surfaceMuted: '#dbe5ff',
    border: '#b9c8ff',
    overlay: 'rgba(92, 16, 191, 0.12)',
    heroBackground: '#dcecff',
    heroAccent: '#c6dbff',
  },
  dark: {
    text: '#e0fafe',
    background: '#0b123f',
    tint: tintColorDark,
    icon: '#96a9ff',
    tabIconDefault: '#3949a6',
    tabIconSelected: tintColorDark,
    surface: '#121a58',
    surfaceMuted: '#182066',
    border: '#223080',
    overlay: 'rgba(30, 52, 168, 0.3)',
    heroBackground: '#10194f',
    heroAccent: '#142060',
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
