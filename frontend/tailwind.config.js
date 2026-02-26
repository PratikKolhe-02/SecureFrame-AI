/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(220 20% 7%)",
        foreground: "hsl(210 20% 92%)",
        primary: "hsl(160 84% 39%)",
        border: "hsl(220 14% 18%)",
      },
    },
  },
  plugins: [],
}