/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#7D70F2';
const tintColorDark = '#A5B4FF';

export const Colors = {
  light: {
    text: '#1F1A44',
    background: '#F3F5FF',
    tint: tintColorLight,
    icon: '#5C64A4',
    tabIconDefault: '#9FA6D9',
    tabIconSelected: tintColorLight,
    surface: '#FFFFFF',
    surfaceMuted: '#E6EBFF',
    border: '#C6D0FF',
    overlay: 'rgba(125, 112, 242, 0.14)',
    heroBackground: '#E6E9FF',
    heroAccent: '#D1E5FF',
  },
  dark: {
    text: '#E6E9FF',
    background: '#0B1230',
    tint: tintColorDark,
    icon: '#7984C7',
    tabIconDefault: '#546098',
    tabIconSelected: tintColorDark,
    surface: '#141C3F',
    surfaceMuted: '#1E2754',
    border: '#273163',
    overlay: 'rgba(165, 180, 255, 0.16)',
    heroBackground: '#171F48',
    heroAccent: '#1B2C55',
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
