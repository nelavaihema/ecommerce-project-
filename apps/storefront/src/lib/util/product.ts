import type { HttpTypes } from "@medusajs/types"

export type VariantPrice = {
  calculated: number
  original: number
  currency: string
  onSale: boolean
}

export function variantPrice(variant?: HttpTypes.StoreProductVariant | null): VariantPrice | null {
  const cp = variant?.calculated_price
  if (!cp || typeof cp.calculated_amount !== "number") return null
  const original =
    typeof cp.original_amount === "number" ? cp.original_amount : cp.calculated_amount
  return {
    calculated: cp.calculated_amount,
    original,
    currency: cp.currency_code ?? "inr",
    onSale: original > cp.calculated_amount,
  }
}

/** Cheapest variant price, used for "from" pricing. */
export function cheapestPrice(product: HttpTypes.StoreProduct): VariantPrice | null {
  const prices = (product.variants ?? [])
    .map(variantPrice)
    .filter((p): p is VariantPrice => Boolean(p))
  if (!prices.length) return null
  return prices.reduce((min, p) => (p.calculated < min.calculated ? p : min))
}

export function isVariantInStock(variant?: HttpTypes.StoreProductVariant | null): boolean {
  if (!variant) return false
  if (!variant.manage_inventory || variant.allow_backorder) return true
  return (variant.inventory_quantity ?? 0) > 0
}

export type StockLevel = "in_stock" | "low" | "out_of_stock" | "unknown"

export function variantStockLevel(variant?: HttpTypes.StoreProductVariant | null): StockLevel {
  if (!variant) return "unknown"
  if (!variant.manage_inventory || variant.allow_backorder) return "in_stock"
  const qty = variant.inventory_quantity ?? 0
  if (qty <= 0) return "out_of_stock"
  if (qty <= 3) return "low"
  return "in_stock"
}

/** Option title -> value map for a variant, e.g. { Size: "M", Color: "Black" }. */
export function variantOptionMap(variant: HttpTypes.StoreProductVariant): Record<string, string> {
  const map: Record<string, string> = {}
  for (const ov of variant.options ?? []) {
    const title = ov.option?.title ?? ""
    if (title) map[title] = ov.value
  }
  return map
}

export function findVariant(
  product: HttpTypes.StoreProduct,
  selected: Record<string, string>
): HttpTypes.StoreProductVariant | undefined {
  const optionTitles = (product.options ?? []).map((o) => o.title)
  if (optionTitles.some((t) => !selected[t])) return undefined
  return (product.variants ?? []).find((v) => {
    const map = variantOptionMap(v)
    return optionTitles.every((t) => map[t] === selected[t])
  })
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL"]

export function sortOptionValues(title: string, values: string[]) {
  if (/size/i.test(title)) {
    return [...values].sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a)
      const ib = SIZE_ORDER.indexOf(b)
      if (ia >= 0 && ib >= 0) return ia - ib
      return a.localeCompare(b, undefined, { numeric: true })
    })
  }
  if (/waist|volume/i.test(title)) {
    return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }
  return values
}

/** Swatch colours for common colour names (falls back to a neutral). */
export const COLOR_SWATCHES: Record<string, string> = {
  black: "#111111",
  white: "#f7f7f5",
  "off-white": "#efe9dd",
  ivory: "#f3ecdc",
  grey: "#9a9a9a",
  gray: "#9a9a9a",
  navy: "#1f2a44",
  blue: "#2f5aa8",
  olive: "#5b6236",
  green: "#2f6b45",
  red: "#b3261e",
  maroon: "#6b1f2a",
  pink: "#e7a3b5",
  purple: "#6a3d8f",
  yellow: "#e6c34a",
  beige: "#d8c6a5",
  brown: "#7a5236",
}

export function swatchFor(color: string) {
  return COLOR_SWATCHES[color.trim().toLowerCase()] ?? "#c9c3b8"
}

/**
 * Images for the current selection: variant images first (or colour images stored
 * in variant metadata by the seed / admin), then the rest of the gallery.
 */
export function imagesForVariant(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant | null
): string[] {
  const gallery = (product.images ?? []).map((i) => i.url).filter(Boolean) as string[]
  // Medusa falls back to all product images when a variant has none of its own,
  // so variant.images only counts as variant-specific when it is a real subset.
  const rawVariantImages =
    (variant as { images?: { url: string }[] } | undefined)?.images?.map((i) => i.url) ?? []
  const variantImages = rawVariantImages.length < gallery.length ? rawVariantImages : []
  const metadataImages = String(
    (variant?.metadata as Record<string, unknown> | undefined)?.images ?? ""
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const ordered = Array.from(new Set([...metadataImages, ...variantImages, ...gallery]))
  if (!ordered.length && product.thumbnail) ordered.push(product.thumbnail)
  return ordered
}

/** Display specs from product fields + metadata (excluding internal keys). */
export function productSpecs(product: HttpTypes.StoreProduct): [string, string][] {
  const hidden = new Set(["size_guide", "images", "cart_id"])
  const specs: [string, string][] = []
  if (product.material) specs.push(["Material", product.material])
  for (const [k, v] of Object.entries(product.metadata ?? {})) {
    if (hidden.has(k) || v === null || v === undefined || typeof v === "object") continue
    const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    specs.push([label, String(v)])
  }
  if (product.origin_country) {
    specs.push([
      "Made in",
      product.origin_country.toUpperCase() === "IN" ? "India" : product.origin_country,
    ])
  }
  return specs
}
