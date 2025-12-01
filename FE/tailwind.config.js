/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d32f2f',
          dark: '#b71c1c',
          light: '#ef5350',
        },
        secondary: {
          DEFAULT: '#f5f5f5',
          dark: '#e0e0e0',
        },
        text: {
          DEFAULT: '#212121',
          light: '#757575',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'button': '10px',
      },
    },
  },
  plugins: [],
}