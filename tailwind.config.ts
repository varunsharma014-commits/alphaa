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
        // Brand — RGB-triple CSS vars so it's dark-orange by default (app/dashboard)
        // and can be scoped to Apple blue via [data-brand="blue"] (public site).
        brand: {
          orange: "rgb(var(--orange-rgb) / <alpha-value>)",
          "orange-light": "rgb(var(--orange-light-rgb) / <alpha-value>)",
          "orange-glow": "rgb(var(--orange-rgb) / 0.4)",
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
        // Captions/legal only — apple.com uses this sparingly, never for body copy
        "muted-soft": "rgb(var(--muted-soft-rgb, var(--muted-rgb)) / <alpha-value>)",
      },
      fontFamily: {
        // Apple's stack everywhere (SF Pro on Apple devices). "serif" maps to
        // the same face on purpose: apple.com never mixes in a serif.
        sans: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Text"', '"SF Pro Display"', '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        serif: ["-apple-system", "BlinkMacSystemFont", '"SF Pro Display"', '"Helvetica Neue"', "Helvetica", "Arial", "sans-serif"],
        mono: ['"SF Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        "hero-mobile": ["36px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["40px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "section-mobile": ["28px", { lineHeight: "1.2" }],
      },
      // Apple headlines are semibold, never heavy: "bold" renders at 600.
      fontWeight: {
        bold: "600",
        extrabold: "600",
        black: "700",
      },
      borderRadius: {
        card: "18px",
        DEFAULT: "12px",
      },
      boxShadow: {
        // Glows retired — apple.com uses soft, neutral depth only.
        glow: "0 4px 24px rgba(0,0,0,0.06)",
        "glow-sm": "0 2px 12px rgba(0,0,0,0.05)",
        card: "0 4px 24px rgba(0,0,0,0.04)",
      },
      backgroundImage: {
        "radial-warm": "none",
        "radial-hero": "none",
      },
      animation: {
        "pulse-glow": "none",
        "fade-up": "fadeUp 0.9s cubic-bezier(0.28, 0.11, 0.32, 1) forwards",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgb(var(--orange-rgb) / 0.3)" },
          "50%": { boxShadow: "0 0 50px rgb(var(--orange-rgb) / 0.6)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionDuration: {
        DEFAULT: "240ms",
      },
    },
  },
  plugins: [],
};

export default config;
