import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Real Skrewww brand tokens, not generic Tailwind defaults
        brand: {
          50: "#F2EFFE",
          100: "#E4DEFD",
          200: "#C9BDFB",
          300: "#AE9CF8",
          400: "#8E71F5",
          500: "#6C4CF2", // color/brand/500 — the actual confirmed brand color
          600: "#5638D6",
          700: "#4229AD",
          800: "#2C1B68",
          900: "#170E36",
        },
        ink: {
          0: "#FFFFFF",
          50: "#F7F7F8",
          100: "#EDEDF0",
          200: "#DFE0E4",
          300: "#C5C6CC",
          400: "#A0A2AC",
          500: "#71737C",
          600: "#52545C",
          700: "#3A3B42",
          800: "#242429",
          900: "#131316",
        },
        success: "#1A8B4C",
        warning: "#B36A00",
        danger: "#E5484D",
        info: "#2563C7",
      },
      fontFamily: {
        // next/font/google exposes the self-hosted family via this CSS
        // variable (set on <html> in app/layout.tsx) — same Inter/JetBrains
        // Mono families as before, just no longer loaded via an external
        // render-blocking @import.
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
