/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0F3D2E',
        canopy: '#1F6F4A',
        turmeric: '#E0A100',
        cream: '#F6EFE4',
        ink: '#14110F',
        bark: '#4A3728',
        mist: '#E7F0EA',
        alert: '#9B1D20',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Figtree"', 'system-ui', 'sans-serif'],
      },
      minHeight: { tap: '64px' },
      minWidth: { tap: '64px' },
    },
  },
  plugins: [],
};
