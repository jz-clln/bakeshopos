/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Open Sans — body copy, UI text, labels, inputs.
        sans: [
          '"Open Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        // Urbanist — headlines, large numbers, brand moments.
        display: [
          'Urbanist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        // Palette sourced from the bear icon: ink from the nose/eyes,
        // rose from the blush cheeks, olive(taupe) from the ear
        // interiors, platinum(sand) from the fur shading. Same token
        // names as before — every screen that already uses
        // bg-platinum, text-olive, text-accent-dark, etc. picks this
        // up automatically, no component changes needed.
        platinum: '#ECE1D3',
        olive: '#8A7566',
        accent: {
          DEFAULT: '#9A3F54', // deepened for AA text contrast on light backgrounds (5.9:1)
          dark: '#2A2320',
          light: '#F6D3D2',
        },
      },
      borderRadius: {
        control: '14px',
        surface: '28px',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out',
        slideInRight: 'slideInRight 0.35s ease-out',
      },
      boxShadow: {
        // rgba values updated to match the new accent-dark (#2A2320 →
        // rgb(42,35,32)) — these were hand-typed from the old navy
        // accent-dark hex, so they'd have kept casting a blue tint
        // under the new warm palette if left alone.
        card: '0 20px 40px -12px rgba(42,35,32,0.16)',
        control: '0 10px 20px -8px rgba(42,35,32,0.28)',
      },
    },
  },
  plugins: [],
};