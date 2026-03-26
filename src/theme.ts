export const colors = {
  brandRed: '#a70707',
  brandBlack: '#161a1d',
  brandPlatinum: '#e0e3e8',

  // Tier colors
  tierE: { bg: '#ecfeff', bar: '#06b6d4', text: '#0e7490' },   // cyan
  tierD: { bg: '#fefce8', bar: '#eab308', text: '#854d0e' },   // yellow
  tierC: { bg: '#f9fafb', bar: '#6b7280', text: '#374151' },   // gray
  tierB: { bg: '#fff7ed', bar: '#f97316', text: '#9a3412' },   // orange
  tierA: { bg: '#fef2f2', bar: '#ef4444', text: '#991b1b' },   // red

  white: '#ffffff',
  black: '#000000',
  errorBg: '#fee2e2',
  errorBorder: '#f87171',
  errorText: '#b91c1c',
  successText: '#16a34a',
};

export const fonts = {
  display: 'BlackOpsOne_400Regular',
  sansLight: 'Lato_300Light',
  sans: 'Lato_400Regular',
  sansBold: 'Lato_700Bold',
  sansBlack: 'Lato_900Black',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const fontSize = {
  '2xs': 10,
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export function getTierConfig(tier: string) {
  switch (tier.toUpperCase()) {
    case 'E': return colors.tierE;
    case 'D': return colors.tierD;
    case 'C': return colors.tierC;
    case 'B': return colors.tierB;
    case 'A': return colors.tierA;
    default:  return { bg: colors.white, bar: colors.brandBlack, text: colors.brandBlack };
  }
}
