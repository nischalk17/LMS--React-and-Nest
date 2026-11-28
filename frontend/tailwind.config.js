import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: { DEFAULT: 'rgb(var(--card) / <alpha-value>)', foreground: 'rgb(var(--foreground) / <alpha-value>)' },
        muted: { DEFAULT: 'rgb(var(--muted) / <alpha-value>)', foreground: 'rgb(var(--muted-foreground) / <alpha-value>)' },
        brand: { DEFAULT: 'rgb(var(--brand) / <alpha-value>)', foreground: 'rgb(var(--brand-foreground) / <alpha-value>)' },
        primary: { DEFAULT: 'rgb(var(--primary) / <alpha-value>)', foreground: 'rgb(var(--primary-foreground) / <alpha-value>)' },
        secondary: { DEFAULT: 'rgb(var(--secondary) / <alpha-value>)', foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)' },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        destructive: { DEFAULT: 'rgb(var(--destructive) / <alpha-value>)', foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)' },
        nav: { DEFAULT: 'rgb(var(--nav) / <alpha-value>)', foreground: 'rgb(var(--nav-foreground) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"Figtree Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        heading: ['"Bricolage Grotesque Variable"', '"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
};

