import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAFAF8",
        surface: "#FFFFFF",
        "text-primary": "#1C1C1E",
        "text-secondary": "#6B6B6B",
        "accent-rose": "#C9A0A0",
        "accent-sage": "#8FAF9A",
        "accent-lavender": "#A09AC9",
        border: "rgba(0,0,0,0.07)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
