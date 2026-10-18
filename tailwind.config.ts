import type { Config } from "tailwindcss";

// Semantic colors driven by CSS variables (globals.css), so the green hero card can flip them.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        heebo: ["Heebo", "sans-serif"],
      },
      colors: {
        page: token("page"),
        surface: token("surface"),
        subtle: token("subtle"),
        line: token("line"),
        ink: token("ink"),
        muted: token("muted"),
        faint: token("faint"),
        brand: token("brand"),
        onbrand: token("onbrand"),
        chip: token("chip"),
        danger: token("danger"),
      },
    },
  },
  plugins: [],
} satisfies Config;
