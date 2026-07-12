import { useThemeContext } from '../contexts/ThemeContext';
import { Colors as StaticColors } from '../constants/theme';

export function useTheme() {
  const { themeMode, primaryColor, fontFamily, uiScale, activeColorScheme } = useThemeContext();

  const baseColors = StaticColors[activeColorScheme === 'dark' ? 'dark' : 'light'];
  
  const colors = {
    ...baseColors,
    tint: primaryColor,
    accent: primaryColor,
    tabIconSelected: primaryColor,
    border: baseColors.separator,
  };

  const scaleFont = (size: number) => size * uiScale;

  return {
    colors,
    fontFamily,
    uiScale,
    scaleFont,
    activeColorScheme,
  };
}
