import path from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"

const configDir = path.dirname(fileURLToPath(import.meta.url))
const backendUrl = new URL(
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Netlify's Next.js adapter manages server output; Docker needs a self-contained bundle.
  ...(process.env.NETLIFY ? {} : { output: "standalone" as const }),
  // The storefront is an independent package; don't let Next infer the repo root
  // (which has its own lockfile) as the workspace root.
  outputFileTracingRoot: configDir,
  turbopack: { root: configDir },
  images: {
    formats: ["image/avif", "image/webp"],
    // Next 16 blocks optimizing images from local IPs. In development, admin
    // uploads are served by the backend on localhost, so allow it there only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      // Demo catalogue imagery (Unsplash licence) — remove once real shoots are uploaded
      { protocol: "https", hostname: "images.unsplash.com" },
      // Files uploaded through the Medusa admin (local file provider in development)
      {
        protocol: backendUrl.protocol.replace(":", "") as "http" | "https",
        hostname: backendUrl.hostname,
        port: backendUrl.port,
      },
      // Object storage / CDN for production uploads (configure S3_FILE_URL host here)
      ...(process.env.NEXT_PUBLIC_MEDIA_HOST
        ? [{ protocol: "https" as const, hostname: process.env.NEXT_PUBLIC_MEDIA_HOST }]
        : []),
    ],
  },
}

export default nextConfig
