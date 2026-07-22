import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Preset C: Brutalist Signal
        paper: "#E8E4DD",
        signal: "#E63B2E",
        offwhite: "#F5F3EE",
        black: "#111111",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        drama: ["var(--font-dm-serif)", "Georgia", "serif"],
        data: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        '2xl': '2rem',
        '3xl': '3rem',
        '4xl': '4rem',
      },
    },
  },
  plugins: [],
};

export default config;
