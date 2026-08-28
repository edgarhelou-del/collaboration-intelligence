import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Dark navy + antique gold, derived from the Cápsulas Kolab
        // reference card: near-black navy ground, warm paper-white
        // headlines, muted gold accent, terracotta-rose for alerts.
        night: "#0A0E1B",
        panel: "#121729",
        paper: "#F4EFE3",
        gold: {
          DEFAULT: "#C6A144",
          soft: "#241F10",
        },
        rose: {
          DEFAULT: "#DD8B6B",
          light: "#2A1B15",
        },
        line: "#242B42",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
