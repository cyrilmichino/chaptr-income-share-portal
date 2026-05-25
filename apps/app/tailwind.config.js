/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chaptr: {
          primary: "#3366CC",
          dark: "#011638",
          hover: "#FCA311",
          orange: "#FF6B35",
          purple: "#6644bb",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
