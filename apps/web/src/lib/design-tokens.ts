/**
 * ALVO DIÁRIO Design Tokens
 * Official brand colors and visual identity system
 */

export const designTokens = {
  // Brand Colors - Official Palette
  colors: {
    // Primary Blues
    primary: {
      1: '#1675F2', // RGB: 22, 117, 242 - Main brand blue
      2: '#3084F2', // RGB: 48, 132, 242 - Secondary blue
    },

    // Secondary Colors
    secondary: {
      gray: '#566873', // RGB: 86, 104, 115 - Professional gray
      neutral: '#F1F2F0', // RGB: 241, 242, 240 - Light gray neutral
      yellow: '#F2E96D', // RGB: 242, 233, 109 - Accent yellow
    },

    // Semantic Colors (mapped to design system)
    semantic: {
      primary: '#1675F2',
      success: '#1675F2', // Use primary for positive actions
      warning: '#F2E96D', // Use yellow for warnings
      error: '#EF4444', // Standard error color
      info: '#3084F2', // Secondary blue for info
    },
  },

  // Typography
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
    },
  },

  // Spacing Scale
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: 'calc(0.75rem - 4px)',
    md: 'calc(0.75rem - 2px)',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modal: '1040',
    popover: '1050',
    tooltip: '1060',
  },
} as const;

/**
 * Color Palette Usage Guide
 *
 * Primary (#1675F2):
 * - Main brand color
 * - Primary actions (buttons, links)
 * - Active navigation states
 * - Focus states
 *
 * Secondary Blue (#3084F2):
 * - Information states
 * - Charts and data visualization
 * - Supporting UI elements
 *
 * Gray (#566873):
 * - Text on light backgrounds
 * - Borders and dividers
 * - Disabled states
 *
 * Yellow (#F2E96D):
 * - Accent highlights
 * - Warning states
 * - Calls to attention
 * - Progress indicators
 *
 * Neutral Light (#F1F2F0):
 * - Backgrounds
 * - Card backgrounds
 * - Sidebar backgrounds
 */
