/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#1d63ed',
          600: '#144ecc',
          700: '#103ea8',
          900: '#0c276b',
        },
        slate: {
          850: '#151d2e',
          950: '#070b14',
        }
      }
    },
  },
  plugins: [],
}
