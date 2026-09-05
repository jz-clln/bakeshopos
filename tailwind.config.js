// File: app/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // System font stack — matches iOS's SF Pro without bundling a font.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // A warm, bakery-appropriate accent, used sparingly — most of the
        // UI stays neutral gray/white per the Apple-style design approach.
        accent: {
          DEFAULT: '#E8814A',
          dark: '#C96A38',
        },
      },
    },
  },
  plugins: [],
};