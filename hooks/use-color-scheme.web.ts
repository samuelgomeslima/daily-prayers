import { useEffect, useState } from 'react';

import { useThemeSettings } from '@/contexts/theme-context';

export function useColorScheme() {
  const { colorScheme } = useThemeSettings();
  const [resolvedScheme, setResolvedScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setResolvedScheme(colorScheme);
  }, [colorScheme]);

  return resolvedScheme;
}
