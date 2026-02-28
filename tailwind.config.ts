import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        serif: ["var(--font-kaisei)", "serif"],
      },
      colors: {
        brand: {
          50:  "#f0faf7",
          100: "#d5f0e7",
          200: "#a8dece",
          300: "#6dc3ac",
          400: "#3da491",
          500: "#2a7c6a",
          600: "#1D2D28",
          700: "#152320",
          800: "#0e1917",
          900: "#07100e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
