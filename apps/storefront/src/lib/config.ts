/**
 * Central place for runtime configuration. Only NEXT_PUBLIC_* values may be
 * read in client components; everything else must stay server-side.
 */
export const config = {
  backendUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000",
  defaultCountry: (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "in").toLowerCase(),
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  instagramUrl:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/ds__wardrobe__/",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
  /** Orders at or above this subtotal ship free (display only; the rule lives in the backend shipping options). */
  freeShippingThreshold: 1499,
  /** Currencies the backend search index stores prices in (keep in sync with apps/backend/src/search/helpers/pricing.ts). */
  searchCurrency: "inr",
  pageSize: 12,
} as const

export const brand = {
  name: "DS Wardrobe",
  tagline: "Your style is your personal brand",
  description:
    "DS Wardrobe — menswear, women's wear and gifts. Fashion that meets purpose. Shipping across India.",
}
