/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        china: {
          red: '#b91c1c',      // Cinnabar
          gold: '#d97706',     // Amber/Gold
          paper: '#fdf5e6',    // Old Lace
          ink: '#111827',      // Charcoal/Ink
          wood: {
              light: '#d4a373',
              DEFAULT: '#8b4513',
              dark: '#3e2723'
          },
          sand: '#f5f5dc'      // Beige
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
      },
      backgroundImage: {
        'wood-pattern': "url('https://www.transparenttextures.com/patterns/wood-pattern.png')",
      }
    },
  },
  plugins: [],
}
