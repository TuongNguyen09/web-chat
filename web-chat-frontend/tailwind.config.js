/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          teal: '#128C7E',
          dark: '#0B141A',
          surface: '#F0F2F5'
        }
      },
      backgroundColor: {
        base: 'rgb(255, 255, 255)',
        'base-dark': 'rgb(20, 20, 20)',
        surface: 'rgb(243, 244, 246)',
        'surface-dark': 'rgb(30, 30, 30)',
      },
      textColor: {
        base: 'rgb(0, 0, 0)',
        'base-dark': 'rgb(255, 255, 255)',
      },
    }
  },
  plugins: [],
}
