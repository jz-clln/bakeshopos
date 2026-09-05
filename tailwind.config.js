/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter carries UI text and body copy — quiet and legible.
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        // Plus Jakarta Sans carries headlines — a warmer, rounder sans
        // than Inter, so headings feel a step more confident without
        // tipping into a "fancy" display face. Requires the Google
        // Fonts <link> in index.html (see PR notes).
        display: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
      colors: {
        // Semantic tokens over the requested palette. Each color has one
        // job so the UI doesn't read as "everything is blue":
        //   accent-dark (Dusk Blue)  -> primary actions, headline accents
        //   accent      (Steel Blue) -> links, focus rings, progress fill
        //   accent-light (Icy Blue)  -> one soft highlight, not decoration
        //   platinum                 -> neutral backgrounds & borders
        //   olive                    -> muted text & icons
        platinum: '#E7ECEF',
        olive: '#8B8C89',
        accent: {
          DEFAULT: '#6096BA',
          dark: '#274C77',
          light: '#A3CEF1',
        },
      },
      borderRadius: {
        // Two radii, used consistently everywhere instead of mixing
        // rounded-2xl/3xl/[32px] ad hoc.
        control: '14px', // inputs, buttons, chips
        surface: '28px', // sheets, cards, panels
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
        // Used via the motion-safe: variant everywhere, so these never
        // run for people with prefers-reduced-motion set.
        fadeInUp: 'fadeInUp 0.5s ease-out',
        slideInRight: 'slideInRight 0.35s ease-out',
      },
      boxShadow: {
        // A tinted shadow (Dusk Blue at low opacity) instead of the
        // generic flat-black card shadow — ties elevation to the brand
        // color instead of looking like every other SaaS card.
        card: '0 20px 40px -12px rgba(39,76,119,0.16)',
        control: '0 10px 20px -8px rgba(39,76,119,0.28)',
      },
    },
  },
  plugins: [],
};