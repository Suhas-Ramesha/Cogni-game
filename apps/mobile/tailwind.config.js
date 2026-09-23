/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: '#0F3D2E',
        canopy: '#1F6F4A',
        turmeric: '#E0A100',
        cream: '#F6EFE4',
        ink: '#14110F',
        alert: '#9B1D20',
      },
    },
  },
  plugins: [],
};
