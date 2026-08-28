import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F5F0",
        ink: "#17171F",
        indigo: {
          DEFAULT: "#5B5BD6",
          light: "#EDEDFB",
        },
        coral: {
          DEFAULT: "#FF6B57",
          light: "#FFE9E5",
        },
        line: "#E6E3DA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
