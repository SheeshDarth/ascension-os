import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        panel: "#111111",
        panel2: "#151515",
        line: "#27272A",
        text: "#F4F4F5",
        muted: "#A1A1AA",
        ghost: "#71717A",
        cyan: "#A5F3FC",
        violet: "#C4B5FD",
        emerald: "#6EE7B7",
        amber: "#FCD34D",
        danger: "#991B1B"
      },
      boxShadow: {
        signal: "0 0 30px rgba(165, 243, 252, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
