/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic aliases (used across existing components) mapped to the
        // FretFlow Pro Material-3 palette.
        ink: {
          900: '#131313', // background
          800: '#1c1b1b', // surface-container-low
          700: '#201f1f', // surface-container
          600: '#2a2a2a', // surface-container-high
          500: '#353534', // surface-container-highest / borders
        },
        accent: {
          DEFAULT: '#00daf3', // primary-fixed-dim (bright cyan)
          soft: '#c3f5ff',    // primary (light cyan)
          deep: '#00626e',
        },
        good: '#4edea3', // secondary (mint)
        bad: '#ffb4ab',  // error

        // FretFlow design tokens (available by their real names too).
        background: '#131313',
        'on-background': '#e5e2e1',
        surface: '#131313',
        'on-surface': '#e5e2e1',
        'on-surface-variant': '#bac9cc',
        'surface-container-lowest': '#0e0e0e',
        'surface-container-low': '#1c1b1b',
        'surface-container': '#201f1f',
        'surface-container-high': '#2a2a2a',
        'surface-container-highest': '#353534',
        'surface-bright': '#393939',
        outline: '#849396',
        'outline-variant': '#3b494c',
        primary: '#c3f5ff',
        'primary-fixed-dim': '#00daf3',
        'primary-container': '#00e5ff',
        'on-primary': '#00363d',
        'on-primary-container': '#00626e',
        secondary: '#4edea3',
        'secondary-container': '#00a572',
        'on-secondary': '#003824',
        'on-secondary-container': '#00311f',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'on-error-container': '#ffdad6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(0, 218, 243, 0.4)',
        'glow-soft': '0 0 15px rgba(0, 218, 243, 0.2)',
      },
    },
  },
  plugins: [],
};
