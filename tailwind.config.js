/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: { 50: "#FBF8F1", 100: "#F5F0E4", 200: "#EDE5D2", 300: "#E0D4B8" },
        sage: { 50: "#F2F4EF", 100: "#E4E9DD", 200: "#CBD5C0", 300: "#A9B89A", 400: "#87997A", 500: "#6B7F5E", 600: "#54654A", 700: "#43523B", 800: "#37422F", 900: "#2F3B2C" },
        gold: { 400: "#D3B25E", 500: "#C9A24B", 600: "#A98736" },
        ink: "#26301F",
      },
      fontFamily: {
        sans: ["'Segoe UI'", "system-ui", "-apple-system", "Arial", "sans-serif"],
        display: ["Georgia", "'Times New Roman'", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(47, 59, 44, 0.10)",
        card: "0 4px 16px rgba(47, 59, 44, 0.08)",
      },
    },
  },
  plugins: [],
};
