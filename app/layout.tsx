import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TaxMad — Plataforma VTC Madrid",
    template: "%s | TaxMad",
  },
  description: "Plataforma profesional de gestión VTC para Madrid. Precio cerrado, reserva inmediata.",
  applicationName: "TaxMad VTC",
  authors: [{ name: "TaxMad" }],
  keywords: ["VTC", "taxi", "Madrid", "reserva", "transporte", "conductor"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaxMad",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
