import "server-only"
import { sdk } from "../sdk"
import { config } from "../config"

/** A product document as stored in the backend search index (apps/backend/src/search/product.ts). */
export type ProductHit = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  hover_image?: string | null
  created_at?: string
  category?: string[]
  category_handles?: string[]
  collection_handle?: string | null
  labels?: string[]
  option_values?: string[]
  min_price_inr?: number | null
  max_price_inr?: number | null
  original_price_inr?: number | null
  on_sale_inr?: boolean | null
  in_stock?: boolean | null
}

export type FacetValue = { value: string; count: number }

export type SearchResponse = {
  hits: ProductHit[]
  count: number
  facets: {
    categories: FacetValue[]
    sizes: FacetValue[]
    colors: FacetValue[]
    inStock: number
    onSale: number
    price: { min: number; max: number } | null
  }
}

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "name"

export type ShopFilters = {
  q?: string
  /** Restrict to these product ids (e.g. wishlist). */
  ids?: string[]
  /** Category handles; a product matches when it is in any of them. */
  categories?: string[]
  collection?: string
  sizes?: string[] // "Size:M", "Waist:32"
  colors?: string[] // "Color:Black"
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
  label?: string
  sort?: SortKey
  page?: number
  pageSize?: number
}

const PRICE = `min_price_${config.searchCurrency}`
const SALE = `on_sale_${config.searchCurrency}`
const SIZE_PREFIXES = ["Size:", "Waist:", "Volume:"]

const ORDER: Record<SortKey, Record<string, "ASC" | "DESC"> | undefined> = {
  featured: undefined, // relevance when searching, index order otherwise
  newest: { created_at: "DESC" },
  price_asc: { [PRICE]: "ASC" },
  price_desc: { [PRICE]: "DESC" },
  name: { title: "ASC" },
}

function buildFilters(f: ShopFilters) {
  const and: Record<string, unknown>[] = []
  if (f.ids?.length) and.push({ id: { $in: f.ids } })
  if (f.categories?.length) and.push({ category_handles: { $overlaps: f.categories } })
  if (f.collection) and.push({ collection_handle: f.collection })
  if (f.sizes?.length) and.push({ option_values: { $overlaps: f.sizes } })
  if (f.colors?.length) and.push({ option_values: { $overlaps: f.colors } })
  if (f.label) and.push({ labels: { $contains: f.label } })
  if (f.inStock) and.push({ in_stock: true })
  if (f.onSale) and.push({ [SALE]: true })
  if (typeof f.minPrice === "number" || typeof f.maxPrice === "number") {
    const range: Record<string, number> = {}
    if (typeof f.minPrice === "number") range.$gte = f.minPrice
    if (typeof f.maxPrice === "number") range.$lte = f.maxPrice
    and.push({ [PRICE]: range })
  }
  const filters: Record<string, unknown> = {}
  if (f.q?.trim()) filters.q = f.q.trim().slice(0, 100)
  if (and.length) filters.$and = and
  return filters
}

/** Faceted product search via the backend `/store/search` endpoint. */
export async function searchProducts(f: ShopFilters = {}): Promise<SearchResponse> {
  const pageSize = f.pageSize ?? config.pageSize
  const page = Math.max(1, f.page ?? 1)
  const order = ORDER[f.sort ?? (f.q ? "featured" : "newest")]

  const body = {
    entity: "product",
    filters: buildFilters(f),
    pagination: { skip: (page - 1) * pageSize, take: pageSize, ...(order ? { order } : {}) },
    search_options: {
      typo_tolerance: true,
      disjunctive_facets: true,
      count: "exact",
      facets: [
        { field: "category_handles", limit: 50 },
        { field: "option_values", limit: 100 },
        "in_stock",
        SALE,
        { field: PRICE, type: "stats" },
      ],
    },
  }

  const res = await sdk.client.fetch<{ results: any[] }>("/store/search", {
    method: "POST",
    body,
    next: { revalidate: 30, tags: ["products", "search"] },
  })
  const result = res.results?.[0] ?? { hits: [], metadata: { count: 0 }, facets: {} }
  const facets = result.facets ?? {}
  const optionValues: FacetValue[] = facets.option_values?.values ?? []
  const boolCount = (facet: any) =>
    facet?.values?.find((v: FacetValue) => String(v.value) === "true")?.count ?? 0
  const stats = facets[PRICE]

  return {
    hits: (result.hits ?? []).map((h: any) => ({ id: h.id, ...h.document })),
    count: result.metadata?.count ?? result.hits?.length ?? 0,
    facets: {
      categories: facets.category_handles?.values ?? [],
      sizes: optionValues.filter((v) => SIZE_PREFIXES.some((p) => v.value.startsWith(p))),
      colors: optionValues.filter((v) => v.value.startsWith("Color:")),
      inStock: boolCount(facets.in_stock),
      onSale: boolCount(facets[SALE]),
      price:
        stats && stats.type === "stats" && stats.count > 0
          ? { min: Math.floor(stats.min), max: Math.ceil(stats.max) }
          : null,
    },
  }
}

/** Parse shop URL search params into filters (shared by shop, category, collection pages). */
export function parseShopParams(
  params: Record<string, string | string[] | undefined>
): ShopFilters {
  const one = (k: string) => {
    const v = params[k]
    return Array.isArray(v) ? v[0] : v
  }
  const list = (k: string) =>
    (one(k) ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 20)
  const num = (k: string) => {
    const n = Number(one(k))
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }
  const sort = one("sort") as SortKey | undefined
  return {
    q: one("q")?.slice(0, 100),
    categories: list("category"),
    collection: one("collection"),
    sizes: list("size"),
    colors: list("color").map((c) => (c.startsWith("Color:") ? c : `Color:${c}`)),
    minPrice: num("min"),
    maxPrice: num("max"),
    inStock: one("stock") === "1",
    onSale: one("sale") === "1",
    label: one("label")?.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || undefined,
    sort: sort && sort in ORDER ? sort : undefined,
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  }
}
