import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        heebo: ["Heebo", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
