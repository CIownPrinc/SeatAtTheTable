/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(210, 100%, 56%)',
        secondary: 'hsl(340, 80%, 62%)',
        accent: 'hsl(45, 100%, 51%)'
      }
    }
  },
  plugins: []
};
