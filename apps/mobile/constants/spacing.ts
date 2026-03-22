/**
 * Spacing tokens — 4px grid system
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
} as const;

export type SpacingKey = keyof typeof Spacing;
