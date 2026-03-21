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
        // Verde floresta — cor primária da marca
        brand: {
          50:  "#edf7f3",
          100: "#d4ede4",
          200: "#a8dbc9",
          300: "#72c3a9",
          400: "#45a085",
          500: "#2d7f68",
          600: "#1f5c4d",
          700: "#1b4437", // cor primária principal
          800: "#143229",
          900: "#0e211c",
          950: "#071210",
        },
        // Amarelo — accent / nav / destaques
        accent: {
          50:  "#fefef0",
          100: "#fdfad1",
          200: "#fbf4a3", // estado ativo (próximo de #fbeda3)
          300: "#f5e769",
          400: "#e0d44e", // fundo do nav no Figma
          500: "#c9bc2c",
          600: "#a79720",
          700: "#826f18",
          800: "#5c4d11",
          900: "#3a2f0a",
        },
        // Vermelho escuro — despesas / perigo
        danger: {
          50:  "#fdf1f1",
          100: "#f9d5d5",
          200: "#f2aaaa",
          300: "#e87070",
          400: "#d84040",
          500: "#b82525",
          600: "#8f1c1c",
          700: "#441b1b", // cor de despesa do Figma
          800: "#321212",
          900: "#200b0b",
        },
        // Fundo creme quente
        surface: "#fefcf1",
      },
      borderRadius: {
        card:  "10px",
        panel: "20px",
        pill:  "40px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(27, 68, 55, 0.08), 0 1px 2px rgba(27, 68, 55, 0.05)",
        panel: "0 4px 16px rgba(27, 68, 55, 0.10), 0 1px 4px rgba(27, 68, 55, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
