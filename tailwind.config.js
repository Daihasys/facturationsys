/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/ClickCounter.jsx",
  ],
  safelist: [
    'bg-gradient-to-br',
    'from-purple-600',
    'to-blue-500',
    'bg-white',
    'border-4',
    'border-yellow-400',
    'text-gray-800',
    'text-red-600',
    'bg-green-500',
    'hover:bg-green-700',
    'focus:ring-green-300',
    'animate-pulse',
  ],
  theme: {
    extend: {
      colors: {
        'havelock-blue': {
          '50': '#ecf1fb',
          '80': '#CBD9F1',
          '100': '#a0bcec',
          '200': '#5287c9',
          '300': '#3b6395',
          '400': '#1d3552',
          '500': '#07111f',
        },
      },
    },
  },
  plugins: [],
};