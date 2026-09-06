export const colors = {
  light: {
    bg: {
      primary: '#fafafa',
      secondary: '#ffffff',
      tertiary: '#f5f5f5',
      elevated: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.5)',
    },
    text: {
      primary: '#171717',
      secondary: '#525252',
      tertiary: '#737373',
      muted: '#a3a3a3',
      inverse: '#ffffff',
      link: '#6366f1',
      linkHover: '#4f46e5',
    },
    border: {
      primary: '#e5e5e5',
      secondary: '#d4d4d4',
      focus: '#6366f1',
      error: '#dc2626',
      success: '#16a34a',
      warning: '#ca8a04',
    },
    accent: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      primaryLight: '#eef2ff',
      secondary: '#a855f7',
      secondaryHover: '#9333ea',
      secondaryLight: '#faf5ff',
      success: '#16a34a',
      successLight: '#f0fdf4',
      warning: '#ca8a04',
      warningLight: '#fefce8',
      error: '#dc2626',
      errorLight: '#fef2f2',
    },
    surface: {
      card: '#ffffff',
      cardHover: '#fafafa',
      input: '#ffffff',
      inputHover: '#fafafa',
      disabled: '#f5f5f5',
    },
    shadow: {
      sm: '0 1px 2px rgba(15, 23, 42, 0.05)',
      md: '0 4px 12px rgba(15, 23, 42, 0.08)',
      lg: '0 12px 24px rgba(15, 23, 42, 0.12)',
      xl: '0 20px 40px rgba(15, 23, 42, 0.15)',
      glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    },
  },
  dark: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a2e',
      elevated: '#181824',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#d4d4d8',
      tertiary: '#a1a1aa',
      muted: '#71717a',
      inverse: '#0a0a0f',
      link: '#818cf8',
      linkHover: '#a5b4fc',
    },
    border: {
      primary: 'rgba(255, 255, 255, 0.08)',
      secondary: 'rgba(255, 255, 255, 0.12)',
      focus: '#818cf8',
      error: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
    },
    accent: {
      primary: '#818cf8',
      primaryHover: '#a5b4fc',
      primaryLight: 'rgba(99, 102, 241, 0.15)',
      secondary: '#c084fc',
      secondaryHover: '#d8b4fe',
      secondaryLight: 'rgba(168, 85, 247, 0.15)',
      success: '#4ade80',
      successLight: 'rgba(22, 163, 74, 0.15)',
      warning: '#fbbf24',
      warningLight: 'rgba(202, 138, 4, 0.15)',
      error: '#f87171',
      errorLight: 'rgba(220, 38, 38, 0.15)',
    },
    surface: {
      card: '#12121a',
      cardHover: '#1a1a2e',
      input: '#1a1a2e',
      inputHover: '#222236',
      disabled: '#2a2a3e',
    },
    shadow: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 12px rgba(0, 0, 0, 0.4)',
      lg: '0 12px 24px rgba(0, 0, 0, 0.5)',
      xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
      glow: '0 0 20px rgba(129, 140, 248, 0.4)',
    },
  },
};

export const modeAccents = {
  academic: {
    light: { primary: '#a855f7', light: '#faf5ff', glow: 'rgba(168, 85, 247, 0.15)' },
    dark: { primary: '#c084fc', light: 'rgba(168, 85, 247, 0.15)', glow: 'rgba(192, 132, 252, 0.25)' },
    icon: '🎓',
    gradient: 'from-purple-600 to-indigo-600',
  },
  office: {
    light: { primary: '#3b82f6', light: '#eff6ff', glow: 'rgba(59, 130, 246, 0.15)' },
    dark: { primary: '#60a5fa', light: 'rgba(59, 130, 246, 0.15)', glow: 'rgba(96, 165, 250, 0.25)' },
    icon: '🏢',
    gradient: 'from-indigo-600 to-blue-600',
  },
  legal: {
    light: { primary: '#f43f5e', light: '#fff1f2', glow: 'rgba(244, 63, 94, 0.15)' },
    dark: { primary: '#fb7185', light: 'rgba(244, 63, 94, 0.15)', glow: 'rgba(251, 113, 133, 0.25)' },
    icon: '⚖️',
    gradient: 'from-rose-600 via-purple-600 to-indigo-600',
  },
  personal: {
    light: { primary: '#8b5cf6', light: '#f5f3ff', glow: 'rgba(139, 92, 246, 0.15)' },
    dark: { primary: '#a78bfa', light: 'rgba(139, 92, 246, 0.15)', glow: 'rgba(167, 139, 250, 0.25)' },
    icon: '💼',
    gradient: 'from-purple-600 to-indigo-600',
  },
} as const;

export type Mode = keyof typeof modeAccents;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

export const radius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
  mobile: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
};

export const typography = {
  fontFamily: {
    display: 'var(--font-display-primary), "Plus Jakarta Sans", sans-serif',
    body: 'var(--font-sans-primary), "Inter", sans-serif',
    mono: 'var(--font-mono-primary), "JetBrains Mono", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    tight: '1.1',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.022em',
    normal: '-0.011em',
    wide: '0.02em',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
  loader: 2000,
};

export const shadows = {
  card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.05)',
  cardHover: '0 4px 12px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.06)',
  elevated: '0 10px 25px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.08)',
  glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  glowMode: (color: string) => `0 0 20px ${color}`,
};

export const getModeColors = (mode: Mode, isDark: boolean) => {
  const modeConfig = modeAccents[mode];
  return isDark ? modeConfig.dark : modeConfig.light;
};

export const cssVars = {
  light: {
    '--color-bg-primary': colors.light.bg.primary,
    '--color-bg-secondary': colors.light.bg.secondary,
    '--color-bg-tertiary': colors.light.bg.tertiary,
    '--color-bg-elevated': colors.light.bg.elevated,
    '--color-text-primary': colors.light.text.primary,
    '--color-text-secondary': colors.light.text.secondary,
    '--color-text-tertiary': colors.light.text.tertiary,
    '--color-text-muted': colors.light.text.muted,
    '--color-text-inverse': colors.light.text.inverse,
    '--color-border-primary': colors.light.border.primary,
    '--color-border-secondary': colors.light.border.secondary,
    '--color-accent-primary': colors.light.accent.primary,
    '--color-accent-primary-hover': colors.light.accent.primaryHover,
    '--color-accent-secondary': colors.light.accent.secondary,
    '--color-accent-success': colors.light.accent.success,
    '--color-accent-warning': colors.light.accent.warning,
    '--color-accent-error': colors.light.accent.error,
    '--shadow-sm': colors.light.shadow.sm,
    '--shadow-md': colors.light.shadow.md,
    '--shadow-lg': colors.light.shadow.lg,
    '--shadow-glow': colors.light.shadow.glow,
  },
  dark: {
    '--color-bg-primary': colors.dark.bg.primary,
    '--color-bg-secondary': colors.dark.bg.secondary,
    '--color-bg-tertiary': colors.dark.bg.tertiary,
    '--color-bg-elevated': colors.dark.bg.elevated,
    '--color-text-primary': colors.dark.text.primary,
    '--color-text-secondary': colors.dark.text.secondary,
    '--color-text-tertiary': colors.dark.text.tertiary,
    '--color-text-muted': colors.dark.text.muted,
    '--color-text-inverse': colors.dark.text.inverse,
    '--color-border-primary': colors.dark.border.primary,
    '--color-border-secondary': colors.dark.border.secondary,
    '--color-accent-primary': colors.dark.accent.primary,
    '--color-accent-primary-hover': colors.dark.accent.primaryHover,
    '--color-accent-secondary': colors.dark.accent.secondary,
    '--color-accent-success': colors.dark.accent.success,
    '--color-accent-warning': colors.dark.accent.warning,
    '--color-accent-error': colors.dark.accent.error,
    '--shadow-sm': colors.dark.shadow.sm,
    '--shadow-md': colors.dark.shadow.md,
    '--shadow-lg': colors.dark.shadow.lg,
    '--shadow-glow': colors.dark.shadow.glow,
  },
};
