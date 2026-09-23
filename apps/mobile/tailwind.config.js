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
        cream: '#F4EDE1',
        paper: '#FFFBFA',
        ink: '#14110F',
        bark: '#5C4A3A',
        mist: '#E4EDE6',
        alert: '#9B1D20',
      },
    },
  },
  plugins: [],
};
