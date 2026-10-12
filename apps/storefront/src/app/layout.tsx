import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Cormorant_Garamond, Inter } from "next/font/google"
import { CartUIProvider } from "@/components/cart/cart-context"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { brand, config } from "@/lib/config"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas", display: "swap" })
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(config.baseUrl),
  title: { default: `${brand.name} | ${brand.tagline}`, template: `%s | ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    siteName: brand.name,
    locale: "en_IN",
    title: brand.name,
    description: brand.description,
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
}

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${inter.variable} ${bebas.variable} ${cormorant.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
        >
          Skip to content
        </a>
        <CartUIProvider>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </CartUIProvider>
      </body>
    </html>
  )
}
