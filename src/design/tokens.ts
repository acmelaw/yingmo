/**
 * Design Tokens for Neo-Brutalism Design System
 * Single source of truth for all design decisions
 */

export const colors = {
  // Base colors
  black: '#000000',
  white: '#FFFFFF',
  
  // Background colors
  bg: {
    light: '#FDFCFA',
    dark: '#1A1A1A',
  },
  
  // Surface colors (for cards, inputs, etc.)
  surface: {
    light: '#FFFFFF',
    dark: '#2A2A2A',
  },
  
  // Primary palette
  primary: {
    DEFAULT: '#FF6B6B',
    light: '#FF8787',
    dark: '#E85555',
  },
  
  // Secondary palette
  secondary: {
    DEFAULT: '#4ECDC4',
    light: '#6EEBE1',
    dark: '#3AB8AF',
  },
  
  // Accent palette
  accent: {
    DEFAULT: '#FFE66D',
    light: '#FFE97D',
    dark: '#F5D94A',
  },
  
  // Semantic colors
  success: '#95E1D3',
  warning: '#F38181',
  error: '#FF6B6B',
  info: '#4ECDC4',
  
  // Text colors
  text: {
    light: {
      primary: '#101112',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    dark: {
      primary: '#E5E5E5',
      secondary: '#9CA3AF',
      tertiary: '#6B7280',
    },
  },
  
  // Border colors
  border: {
    light: '#000000',
    dark: '#404040',
  },
  
  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 1)',
    dark: 'rgba(64, 64, 64, 1)',
  },
} as const;

export const spacing = {
  '0': '0',
  '1': '0.25rem',  // 4px
  '2': '0.5rem',   // 8px
  '3': '0.75rem',  // 12px
  '4': '1rem',     // 16px
  '5': '1.25rem',  // 20px
  '6': '1.5rem',   // 24px
  '8': '2rem',     // 32px
  '10': '2.5rem',  // 40px
  '12': '3rem',    // 48px
  '16': '4rem',    // 64px
  '20': '5rem',    // 80px
  '24': '6rem',    // 96px
} as const;

export const typography = {
  fontFamily: {
    sans: "'Space Grotesk', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

export const borderWidth = {
  '0': '0',
  '2': '2px',
  '3': '3px',
  '4': '4px',
  '6': '6px',
  '8': '8px',
} as const;

export const shadows = {
  brutal: {
    sm: '2px 2px 0 0',
    DEFAULT: '4px 4px 0 0',
    md: '6px 6px 0 0',
    lg: '8px 8px 0 0',
    xl: '12px 12px 0 0',
  },
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    DEFAULT: '250ms',
    slow: '350ms',
  },
  
  easing: {
    ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const;
