import type { MetadataRoute } from "next"
import { config } from "@/lib/config"
import { listCategories, listCollections } from "@/lib/data/catalog"
import { listProducts } from "@/lib/data/products"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.baseUrl
  const staticRoutes = ["", "/shop", "/track", "/help/shipping", "/help/returns", "/help/size-guide", "/help/contact"].map(
    (path) => ({ url: `${base}${path}`, changeFrequency: "daily" as const, priority: path === "" ? 1 : 0.6 })
  )
  try {
    const [categories, collections, { products }] = await Promise.all([
      listCategories(),
      listCollections(),
      listProducts({ limit: 500 }),
    ])
    return [
      ...staticRoutes,
      ...categories.map((c) => ({ url: `${base}/categories/${c.handle}`, priority: 0.8 })),
      ...collections.map((c) => ({ url: `${base}/collections/${c.handle}`, priority: 0.7 })),
      ...products.map((p) => ({
        url: `${base}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
        priority: 0.9,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
