/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary color scheme - Modern blues with deeper saturation
        primary: {
          50: '#eef8ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#90cdff',
          400: '#5db1ff',
          500: '#3993ff',  // Base primary color
          600: '#1d74f5',  // Slightly deeper for better contrast
          700: '#1a5ddb',
          800: '#1c4caf',
          900: '#1e408a',
          950: '#172854',
        },
        // Accent color scheme - Vibrant teals with a touch of green
        accent: {
          50: '#edfcf9',
          100: '#d4f7f1',
          200: '#aeefe4',
          300: '#79e2d3',
          400: '#43c9bc',
          500: '#20afa3',  // Base accent color
          600: '#188e87',  // Deeper for contrast
          700: '#17716e',
          800: '#175a5a',
          900: '#174b4b',
          950: '#07302f',
        },
        // Neutral color scheme - Clean grays with slight blue undertone
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'thin': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 10px 50px -12px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px 2px rgba(0, 160, 255, 0.15)',
        'glow-accent': '0 0 15px 2px rgba(43, 201, 173, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [],
}