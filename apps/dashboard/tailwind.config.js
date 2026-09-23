/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0F3D2E',
        canopy: '#1F6F4A',
        turmeric: '#E0A100',
        cream: '#F4EDE1',
        paper: '#FFFBFA',
        ink: '#14110F',
        bark: '#5C4A3A',
        mist: '#E4EDE6',
        alert: '#9B1D20',
        warn: '#B45309',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-ui)', 'system-ui', 'sans-serif'],
      },
      minHeight: { tap: '48px', 'tap-lg': '64px' },
      minWidth: { tap: '48px' },
      boxShadow: {
        card: '0 1px 0 rgba(15,61,46,0.05), 0 22px 44px -28px rgba(15,61,46,0.4)',
        lift: '0 1px 0 rgba(15,61,46,0.06), 0 28px 56px -24px rgba(15,61,46,0.45)',
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        rise: 'rise 0.45s ease-out both',
        pulseDot: 'pulseDot 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
