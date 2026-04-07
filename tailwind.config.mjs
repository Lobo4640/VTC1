/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx}",
    "./content/**/*.{md,mdx}",
  ],

  theme: {
    extend: {
      // ── PALETA DE MARCA ───────────────────────────────────────
      colors: {
        brand: {
          dark:    "#071528",   // fondo oscuro principal
          darker:  "#050e1a",   // fondo más oscuro (cards, headers)
          navy:    "#112F5C",   // azul marino secundario
          blue:    "#00B5FF",   // acento azul neón
          violet:  "#7A5FFF",   // violeta vibrante
          green:   "#22c78b",   // confirmación / éxito
          orange:  "#FF8C42",   // advertencias / aeropuerto
          red:     "#ff4d4d",   // error / peligro
          muted:   "#8898aa",   // texto secundario
          border:  "#1a2f4a",   // bordes en fondo oscuro
          surface: "#0d1f36",   // superficie de tarjetas
        },
      },

      // ── FUENTES ───────────────────────────────────────────────
      fontFamily: {
        sans:       ["Montserrat", "system-ui", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        mono:       ["JetBrains Mono", "Fira Code", "monospace"],
      },

      // ── SOMBRAS NEÓN ─────────────────────────────────────────
      boxShadow: {
        "neon-blue":   "0 0 20px rgba(0,181,255,0.35), 0 0 40px rgba(0,181,255,0.15)",
        "neon-violet": "0 0 20px rgba(122,95,255,0.35), 0 0 40px rgba(122,95,255,0.15)",
        "neon-green":  "0 0 20px rgba(34,199,139,0.35), 0 0 40px rgba(34,199,139,0.15)",
        "card":        "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
        "card-hover":  "0 8px 40px rgba(0,181,255,0.2), 0 2px 8px rgba(0,0,0,0.3)",
      },

      // ── ANIMACIONES ───────────────────────────────────────────
      animation: {
        "neon-pulse":  "neonPulse 2s ease-in-out infinite",
        "slide-up":    "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        "fade-in":     "fadeIn 0.3s ease-out",
        "pop":         "pop 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        "spin-slow":   "spin 3s linear infinite",
        "gradient":    "gradientShift 6s ease infinite",
        "shimmer":     "shimmer 2s linear infinite",
      },
      keyframes: {
        neonPulse: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0.7" },
        },
        slideUp: {
          from: { transform: "translateY(30px)", opacity: "0" },
          to:   { transform: "none",             opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        pop: {
          from: { transform: "scale(0.8)", opacity: "0" },
          to:   { transform: "scale(1)",   opacity: "1" },
        },
        gradientShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to:   { backgroundPosition: "200% 0" },
        },
      },

      // ── TIPOGRAFÍA ────────────────────────────────────────────
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      // ── BACKGROUNDS ───────────────────────────────────────────
      backgroundImage: {
        "gradient-brand":   "linear-gradient(160deg, #071528 0%, #0f2a55 60%, #071528 100%)",
        "gradient-card":    "linear-gradient(135deg, #0d1f36, #112F5C)",
        "gradient-neon":    "linear-gradient(135deg, #00B5FF, #7A5FFF)",
        "gradient-shimmer": "linear-gradient(90deg, transparent, rgba(0,181,255,0.15), transparent)",
      },

      // ── BORDES ────────────────────────────────────────────────
      borderRadius: {
        "2xl":  "1rem",
        "3xl":  "1.5rem",
        "4xl":  "2rem",
      },
    },
  },

  plugins: [],
};
