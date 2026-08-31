import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Editorial intelligence desk: warm paper ground, near-black ink,
        // a single restrained accent (deep signal-red) used sparingly for
        // scores and emphasis — never neon, never gradients.
        paper: "#F7F5EF",
        panel: "#FFFFFF",
        ink: "#1A1A16",
        muted: "#6B6858",
        line: "#DEDACB",
        accent: {
          DEFAULT: "#8A3324", // muted brick/signal red
          soft: "#F3E4DE",
        },
        signal: {
          exceptional: "#8A3324",
          strong: "#96712B",
          interesting: "#5B6B4E",
          archive: "#9C9887",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
        lg: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
