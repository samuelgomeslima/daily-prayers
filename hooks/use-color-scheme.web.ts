import { useThemeSettings } from '@/contexts/theme-context';

export function useColorScheme() {
  const { colorScheme } = useThemeSettings();
  return colorScheme;
}
