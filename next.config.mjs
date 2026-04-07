/** @type {import('next').NextConfig} */
const nextConfig = {
  // Soporte para archivos .mdx (Blog de noticias)
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],

  // Variables de entorno
  env: {
    NEXT_PUBLIC_GMAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mwjewdguvvmgzajfbjev.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // Cabeceras de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Micrófono permitido (Voice Input)
            value: "camera=(), microphone=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
