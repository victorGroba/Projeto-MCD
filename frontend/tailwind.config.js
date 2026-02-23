/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vision: {
          dark: "#0F1535",
          card: "#1F2749",
          primary: "#0075FF",
          secondary: "#A0AEC0",
          success: "#01B574",
          warning: "#FFB547",
          danger: "#E31A1A",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}