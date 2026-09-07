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
        platinum: '#E7ECEF',
        olive: '#8B8C89',
        accent: {
          DEFAULT: '#6096BA',
          dark: '#274C77',
          light: '#A3CEF1',
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
        card: '0 20px 40px -12px rgba(39,76,119,0.16)',
        control: '0 10px 20px -8px rgba(39,76,119,0.28)',
      },
    },
  },
  plugins: [],
};