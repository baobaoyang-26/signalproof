import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101316",
        paper: "#f7f3ec",
        muted: "#656b73",
        line: "#ded7cc",
        rust: "#aa4b2f",
      },
    },
  },
  plugins: [],
};

export default config;
