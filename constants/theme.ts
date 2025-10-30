/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0CB7F2';
const tintColorDark = '#4AD0FF';

export const Colors = {
  light: {
    text: '#043049',
    background: '#F2FBFF',
    tint: tintColorLight,
    icon: '#0A7FA9',
    tabIconDefault: '#8DD8F4',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    surfaceMuted: '#E2F4FC',
    border: '#B6E6F8',
    overlay: 'rgba(12, 183, 242, 0.12)',
    heroBackground: '#E6F7FE',
    heroAccent: '#D0F0FC',
  },
  dark: {
    text: '#F4FBFF',
    background: '#071C2A',
    tint: tintColorDark,
    icon: '#7FD8FF',
    tabIconDefault: '#2B4F63',
    tabIconSelected: tintColorDark,
    surface: '#0C2838',
    surfaceMuted: '#123548',
    border: '#1F4B60',
    overlay: 'rgba(74, 208, 255, 0.18)',
    heroBackground: '#0A2F40',
    heroAccent: '#0F4156',
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
