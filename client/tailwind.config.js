/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Primary colors - calming blues
        primary: {
          50: '#e6f6ff',
          100: '#ccecff',
          200: '#99d9ff',
          300: '#66c6ff',
          400: '#33b3ff',
          500: '#00a0ff', // Main primary color
          600: '#0080cc',
          700: '#006099',
          800: '#004066',
          900: '#002033',
        },
        // Accent color (teal)
        accent: {
          50: '#e6fff9',
          100: '#ccfff4',
          200: '#99ffe8',
          300: '#66ffdd',
          400: '#33ffd1',
          500: '#00ffc6', // Main accent color
          600: '#00cc9e',
          700: '#009977',
          800: '#00664f',
          900: '#003328',
        },
        // Neutral colors for text and backgrounds
        neutral: {
          50: '#f7f9fa',
          100: '#eef1f3',
          200: '#dce2e7',
          300: '#cbd4db',
          400: '#b9c5cf',
          500: '#a8b7c3', // Main neutral color
          600: '#86929c',
          700: '#656e75',
          800: '#43494e',
          900: '#222527',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [],
}