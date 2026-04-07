import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ─────────────────────────────────────────────
      // PALETA OLED PREMIUM — TaxMad VTC
      // ─────────────────────────────────────────────
      colors: {
        // Fondos
        oled:    "#000000", // Fondo absoluto OLED
        card:    "#111827", // Tarjetas / superficies elevadas
        surface: "#1F2937", // Superficies secundarias (inputs, sub-cards)
        border:  "#374151", // Bordes sutiles

        // Acento principal
        accent: {
          DEFAULT: "#00B5FF", // Azul eléctrico — botones, iconos, enlaces
          dim:     "#0090CC", // Hover / pressed state
          glow:    "rgba(0,181,255,0.20)", // Sombra / glow suave
        },

        // Tipografía
        "text-main": "#FFFFFF",      // Texto principal
        "text-dim":  "#9CA3AF",      // Etiquetas, placeholders, secundario
        "text-muted":"#4B5563",      // Texto muy atenuado

        // Semánticos
        success: {
          DEFAULT: "#10B981", // Verde — Iniciar servicio / confirmado
          dim:     "#059669",
          glow:    "rgba(16,185,129,0.20)",
        },
        danger: {
          DEFAULT: "#EF4444", // Rojo — Anular / error
          dim:     "#DC2626",
          glow:    "rgba(239,68,68,0.20)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          dim:     "#D97706",
        },

        // Gold (para el botón de Login, tal y como aparece en la captura)
        gold: {
          DEFAULT: "#C8972E",
          light:   "#E8B84B",
          dark:    "#A67C20",
        },
      },

      // ─────────────────────────────────────────────
      // TIPOGRAFÍA
      // ─────────────────────────────────────────────
      fontFamily: {
        sans:    ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        xs:    ["0.75rem", { lineHeight: "1.125rem" }],
        sm:    ["0.875rem",{ lineHeight: "1.25rem" }],
        base:  ["1rem",    { lineHeight: "1.5rem" }],
        lg:    ["1.125rem",{ lineHeight: "1.75rem" }],
        xl:    ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",  { lineHeight: "2rem" }],
        "3xl": ["1.875rem",{ lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem",    { lineHeight: "1" }],
        price: ["2.75rem", { lineHeight: "1", fontWeight: "900" }],
      },

      // ─────────────────────────────────────────────
      // BORDER RADIUS — estilo muy redondeado
      // ─────────────────────────────────────────────
      borderRadius: {
        none:  "0",
        sm:    "0.375rem",
        DEFAULT:"0.5rem",
        md:    "0.75rem",
        lg:    "1rem",
        xl:    "1.25rem",
        "2xl": "1.5rem",   // Tarjetas principales
        "3xl": "1.75rem",  // Tarjetas grandes
        "4xl": "2rem",     // Bottom sheet / modales
        full:  "9999px",   // Pills y botones de estado
      },

      // ─────────────────────────────────────────────
      // SOMBRAS — elevación sutil OLED
      // ─────────────────────────────────────────────
      boxShadow: {
        none:    "none",
        sm:      "0 1px 3px rgba(0,0,0,0.5)",
        DEFAULT: "0 4px 16px rgba(0,0,0,0.6)",
        md:      "0 8px 24px rgba(0,0,0,0.7)",
        lg:      "0 16px 40px rgba(0,0,0,0.8)",
        xl:      "0 24px 64px rgba(0,0,0,0.9)",
        // Glows de acento
        "accent":  "0 0 20px rgba(0,181,255,0.35), 0 0 60px rgba(0,181,255,0.15)",
        "success": "0 0 20px rgba(16,185,129,0.35)",
        "danger":  "0 0 20px rgba(239,68,68,0.35)",
        "gold":    "0 0 20px rgba(200,151,46,0.40)",
        // Tarjetas elevadas
        "card":    "0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover": "0 8px 24px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,181,255,0.3)",
      },

      // ─────────────────────────────────────────────
      // TRANSICIONES / ANIMACIONES
      // ─────────────────────────────────────────────
      transitionTimingFunction: {
        spring:  "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        smooth:  "cubic-bezier(0.4, 0, 0.2, 1)",
        snap:    "cubic-bezier(0.86, 0, 0.07, 1)",
      },
      transitionDuration: {
        "0":   "0ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
        "700": "700ms",
      },
      keyframes: {
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%":   { opacity: "0", transform: "translateY(-16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(0,181,255,0.3)" },
          "50%":       { boxShadow: "0 0 28px rgba(0,181,255,0.7)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        successBounce: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)",   opacity: "1" },
        },
      },
      animation: {
        "slide-up":      "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-down":    "slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "fade-in":       "fadeIn 0.3s ease forwards",
        "pulse-glow":    "pulseGlow 2s ease-in-out infinite",
        "shimmer":       "shimmer 2s linear infinite",
        "success-bounce":"successBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
      },

      // ─────────────────────────────────────────────
      // ESPACIADO — bottom nav safe area
      // ─────────────────────────────────────────────
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "nav-height":  "64px",    // Altura de la Bottom Navigation Bar
        "header-h":    "60px",
      },

      // ─────────────────────────────────────────────
      // BACKDROP
      // ─────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },

      // ─────────────────────────────────────────────
      // GRADIENTES personalizados como background
      // ─────────────────────────────────────────────
      backgroundImage: {
        "gradient-accent":  "linear-gradient(135deg, #00B5FF 0%, #0077CC 100%)",
        "gradient-gold":    "linear-gradient(135deg, #E8B84B 0%, #A67C20 100%)",
        "gradient-success": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "gradient-danger":  "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
        "gradient-card":    "linear-gradient(145deg, #1F2937 0%, #111827 100%)",
        "shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
