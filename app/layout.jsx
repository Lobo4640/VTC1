import "./globals.css";

// ── METADATOS SEO GLOBALES ────────────────────────────────────────
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://vtc-madrid.vercel.app"
  ),

  title: {
    default:  "VTC Madrid 2026 | Tu Conductor Privado en Madrid",
    template: "%s | VTC Madrid 2026",
  },
  description:
    "Reserva tu vehículo con conductor en Madrid al instante. Precio cerrado garantizado, totalmente legal y con registro automático en el Ministerio de Transportes.",

  keywords: [
    "VTC Madrid", "vehículo con conductor Madrid", "conductor privado Madrid",
    "reservar VTC", "precio cerrado VTC", "transfer aeropuerto Madrid",
    "VTC normativa 2026", "alquiler vehículo con conductor",
  ],

  authors:  [{ name: "VTC Madrid 2026" }],
  creator:  "VTC Madrid 2026",
  publisher:"VTC Madrid 2026",

  // Open Graph
  openGraph: {
    type:        "website",
    locale:      "es_ES",
    url:         process.env.NEXT_PUBLIC_APP_URL || "https://vtc-madrid.vercel.app",
    siteName:    "VTC Madrid 2026",
    title:       "VTC Madrid 2026 | Tu Conductor Privado en Madrid",
    description: "Reserva tu VTC en Madrid. Precio cerrado garantizado. 100% legal.",
    images: [
      {
        url:    "/og-image.jpg",
        width:  1200,
        height: 630,
        alt:    "VTC Madrid 2026",
      },
    ],
  },

  // Twitter / X
  twitter: {
    card:        "summary_large_image",
    title:       "VTC Madrid 2026 | Conductor Privado",
    description: "Reserva tu VTC en Madrid al instante. Precio cerrado garantizado.",
    images:      ["/og-image.jpg"],
  },

  // Robots
  robots: {
    index:               true,
    follow:              true,
    googleBot: {
      index:             true,
      follow:            true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":     -1,
    },
  },

  // Verificación Google Search Console (sustituir por tu código real)
  verification: {
    google: "RELLENAR_TU_CODIGO_GOOGLE_SEARCH_CONSOLE",
  },

  // Canonical
  alternates: {
    canonical: "/",
    languages: { "es-ES": "/" },
  },
};

// ── VIEWPORT ──────────────────────────────────────────────────────
export const viewport = {
  themeColor:    "#071528",
  colorScheme:   "dark",
  width:         "device-width",
  initialScale:  1,
  maximumScale:  1,
};

// ── LAYOUT RAÍZ ───────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        {/* Fuente Montserrat desde Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap"
          rel="stylesheet"
        />
        {/* Favicon */}
        <link rel="icon"             href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest"         href="/site.webmanifest" />

        {/* Schema.org JSON-LD — Local Business */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context":       "https://schema.org",
              "@type":          "LocalBusiness",
              name:             "VTC Madrid 2026",
              description:      "Servicio de arrendamiento de vehículo con conductor en Madrid",
              url:              process.env.NEXT_PUBLIC_APP_URL,
              telephone:        "+34600000000",
              address: {
                "@type":           "PostalAddress",
                addressLocality:   "Madrid",
                addressCountry:    "ES",
              },
              geo: {
                "@type":     "GeoCoordinates",
                latitude:    40.4168,
                longitude:  -3.7038,
              },
              openingHours: "Mo-Su 00:00-24:00",
              priceRange:   "€€",
            }),
          }}
        />
      </head>

      <body className="font-montserrat antialiased bg-brand-dark text-white min-h-screen">
        {/* Fondo base con gradiente de marca */}
        <div className="fixed inset-0 bg-gradient-brand -z-10" aria-hidden="true" />

        {/* Contenido principal */}
        <main>{children}</main>
      </body>
    </html>
  );
}
