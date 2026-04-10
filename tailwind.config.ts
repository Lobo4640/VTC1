import type { Config } from "tailwindcss";

const config: Config = {
  // CORRECCIÓN: Eliminamos "/src" de las rutas porque tus carpetas están en la raíz
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    // Si decides crear una carpeta components en el futuro, ya estará incluida:
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        oled: "#000000",
        card: "#111827",
        surface: "#1F2937",
        border: "#374151",

        accent: {
          DEFAULT: "#00B5FF",
          dim: "#0090CC",
          glow: "rgba(0,181,255,0.20)",
        },

        "text-main": "#FFFFFF",
        "text-dim": "#9CA3AF",
        "text-muted": "#4B5563",

        success: {
          DEFAULT: "#10B981",
          dim: "#059669",
          glow: "rgba(16,185,129,0.20)",
        },
        danger: {
          DEFAULT: "#EF4444",
          dim: "#DC2626",
          glow: "rgba(239,68,68,0.20)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dim: "#D97706",
        },
        gold: {
          DEFAULT: "#C8972E",
          light: "#E8B84B",
          dark: "#A67C20",
        },
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },

      borderRadius: {
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
        "4xl": "2rem",
      },

      boxShadow: {
        accent: "0 0 20px rgba(0,181,255,0.35), 0 0 60px rgba(0,181,255,0.15)",
        gold: "0 0 20px rgba(200,151,46,0.40)",
        card: "0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      },

      keyframes: {
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
      },

      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #00B5FF 0%, #0077CC 100%)",
        "gradient-gold": "linear-gradient(135deg, #E8B84B 0%, #A67C20 100%)",
        "gradient-card": "linear-gradient(145deg, #1F2937 0%, #111827 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
