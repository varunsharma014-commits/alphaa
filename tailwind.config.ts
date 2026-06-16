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
        // Brand
        brand: {
          orange: "#FF6B1A",
          "orange-light": "#FF8845",
          "orange-glow": "rgba(255, 107, 26, 0.4)",
        },
        // Backgrounds (theme-aware via CSS vars; rgb-triple so /opacity works)
        bg: {
          primary: "rgb(var(--bg-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--bg-secondary-rgb) / <alpha-value>)",
          tertiary: "rgb(var(--bg-tertiary-rgb) / <alpha-value>)",
        },
        // Surfaces
        cream: "#F5EDE0",
        // Theme-aware foreground / border / muted.
        // Opacity modifiers work: text-fg/40, border-line/[0.08], text-muted.
        fg: "rgb(var(--fg-rgb) / <alpha-value>)",
        line: "rgb(var(--line-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "hero-mobile": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["40px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "section-mobile": ["28px", { lineHeight: "1.2" }],
      },
      borderRadius: {
        card: "24px",
        DEFAULT: "12px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 107, 26, 0.4)",
        "glow-sm": "0 0 20px rgba(255, 107, 26, 0.3)",
        card: "0 1px 0 rgba(255,255,255,0.06) inset",
      },
      backgroundImage: {
        "radial-warm":
          "radial-gradient(ellipse 80% 60% at 50% 100%, #1F1812 0%, #0A0806 70%)",
        "radial-hero":
          "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,107,26,0.12) 0%, transparent 70%)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,107,26,0.3)" },
          "50%": { boxShadow: "0 0 50px rgba(255,107,26,0.6)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
