/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      animation: {
        'slide-in-from-bottom-4': 'slideInFromBottom 0.5s ease-out',
        'animate-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        slideInFromBottom: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      colors: {
        'risk-low': '#d4edda',
        'risk-medium': '#fff3cd',
        'risk-high': '#f8d7da',
      },
    },
  },
  plugins: [],
};
