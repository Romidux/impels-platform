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
        brand: {
          50: "#f0f1ff",
          100: "#e4e6ff",
          200: "#ccd0ff",
          300: "#a5acff",
          400: "#7b84ff",
          500: "#5b6fff",
          600: "#4a5ff0",
          700: "#3a4ee0",
          800: "#2e3cb8",
          900: "#263090",
          950: "#161a55",
        },
        surface: {
          DEFAULT: "#0f0f0f",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        admin: {
          sidebar: "#0f172a",
          "sidebar-hover": "#1e293b",
          accent: "#6366f1",
          "accent-hover": "#4f46e5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.375rem",
        "3xl": "1.75rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(91, 111, 255, 0.3)",
        "glow-lg": "0 0 40px rgba(91, 111, 255, 0.4)",
        "brand-glow": "0 0 24px rgba(91, 111, 255, 0.25)",
        glass: "0 8px 32px rgba(80, 100, 200, 0.12)",
        "card-hover": "0 12px 40px rgba(80, 100, 200, 0.16)",
        "apple-sm": "0 2px 8px rgba(80,100,200,0.08), 0 6px 20px rgba(80,100,200,0.05)",
        "apple-md": "0 4px 16px rgba(80,100,200,0.10), 0 12px 32px rgba(80,100,200,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
