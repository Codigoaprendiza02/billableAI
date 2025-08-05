/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
    "./extension-dist/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'billable': {
          'dark': '#000000',
          'primary': '#3432c7',
          'light': '#7b8cff',
        }
      },
      backgroundImage: {
        'gradient-billable': 'linear-gradient(135deg, #000000 0%, #3432c7 60%, #7b8cff 100%)',
      }
    },
  },
  plugins: [],
} 