/**
 * Typography tokens — DMSans / DMMono
 * Rule: never below 11pt
 */
export const Typography = {
  displayLg: {
    fontSize: 28,
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  headingLg: {
    fontSize: 24,
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  headingMd: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    fontWeight: '700' as const,
  },
  headingSm: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 17,
    fontFamily: 'DMSans_400Regular',
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  mono: {
    fontSize: 15,
    fontFamily: 'DMMono_400Regular',
    fontWeight: '400' as const,
  },
  monoSm: {
    fontSize: 13,
    fontFamily: 'DMMono_400Regular',
    fontWeight: '400' as const,
  },
} as const;
