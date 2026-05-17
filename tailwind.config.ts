import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Virgil command-room palette. Cold, quiet, deliberate.
        ink: {
          950: "#07090c",
          900: "#0b0f14",
          800: "#11161d",
          700: "#1a212b",
          600: "#252e3b",
          500: "#3a4658",
        },
        bone: {
          50: "#f4f3ee",
          100: "#e7e5dc",
          200: "#cfcdc1",
          300: "#a8a698",
          400: "#7d7b6f",
        },
        signal: {
          green: "#7fb78a",
          amber: "#d6a453",
          red: "#c05a4a",
          steel: "#6f8aa6",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
