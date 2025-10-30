/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#058ED9';
const tintColorDark = '#4CB8F8';

export const Colors = {
  light: {
    text: '#043049',
    background: '#F1F8FF',
    tint: tintColorLight,
    icon: '#046FAF',
    tabIconDefault: '#88C6EC',
    tabIconSelected: tintColorLight,
    surface: '#ffffff',
    surfaceMuted: '#E3F1FC',
    border: '#B3DCF5',
    overlay: 'rgba(5, 142, 217, 0.12)',
    heroBackground: '#E1F1FF',
    heroAccent: '#C7E6FF',
  },
  dark: {
    text: '#F4FBFF',
    background: '#071C2A',
    tint: tintColorDark,
    icon: '#7ECFFE',
    tabIconDefault: '#274B62',
    tabIconSelected: tintColorDark,
    surface: '#0B273A',
    surfaceMuted: '#12364B',
    border: '#1D4A64',
    overlay: 'rgba(76, 184, 248, 0.16)',
    heroBackground: '#0A3046',
    heroAccent: '#0E4561',
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
