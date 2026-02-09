/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#A8B5A2", // Sage Green
        secondary: "#A7C7E7", // Soft Blue
        background: "#F2ECE4", // Cream
        dark: "#2C3E50", // Dark Grey/Blue for text
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
