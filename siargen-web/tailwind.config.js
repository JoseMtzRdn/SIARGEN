/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8a2036', // Guinda ISEM
        secondary: '#efe1ca', // Beige ISEM
        tertiary: '#BC955B', // Oro/Bronce
        auxiliary: '#7C1D31',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
