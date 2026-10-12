import "server-only"
import type { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { sdk } from "../sdk"
import { getRegion } from "./regions"

const PRODUCT_FIELDS = [
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "+variants.manage_inventory",
  "+variants.allow_backorder",
  "+variants.metadata",
  "*variants.options",
  "*variants.images",
  "*options",
  "*options.values",
  "*images",
  "*categories",
  "*collection",
  "*tags",
  "+metadata",
  "+material",
  "+weight",
  "+origin_country",
].join(",")

type ListParams = {
  limit?: number
  offset?: number
  order?: string
  id?: string[]
  category_id?: string[]
  collection_id?: string[]
  tag_id?: string[]
  q?: string
}

/** Product list with region-aware prices (Store API). */
export async function listProducts(params: ListParams = {}) {
  const region = await getRegion()
  const { limit = 12, offset = 0, ...rest } = params
  return sdk.client.fetch<HttpTypes.StoreProductListResponse>("/store/products", {
    method: "GET",
    query: {
      limit,
      offset,
      region_id: region?.id,
      fields: PRODUCT_FIELDS,
      ...rest,
    },
    next: { revalidate: 60, tags: ["products"] },
  })
}

export const getProductByHandle = cache(async (handle: string) => {
  const region = await getRegion()
  const { products } = await sdk.client.fetch<HttpTypes.StoreProductListResponse>(
    "/store/products",
    {
      method: "GET",
      query: { handle, region_id: region?.id, fields: PRODUCT_FIELDS, limit: 1 },
      next: { revalidate: 30, tags: ["products", `product-${handle}`] },
    }
  )
  return products[0] ?? null
})

/** Products from the same category (or collection), excluding the current one. */
export async function listRelatedProducts(product: HttpTypes.StoreProduct, limit = 8) {
  const categoryIds = product.categories?.map((c) => c.id) ?? []
  const query: ListParams = { limit: limit + 1 }
  if (categoryIds.length) query.category_id = categoryIds
  else if (product.collection_id) query.collection_id = [product.collection_id]
  const { products } = await listProducts(query)
  return products.filter((p) => p.id !== product.id).slice(0, limit)
}

export async function listProductsByTag(tagValue: string, limit = 8) {
  const { product_tags } = await sdk.client.fetch<{ product_tags: { id: string; value: string }[] }>(
    "/store/product-tags",
    { method: "GET", query: { value: tagValue, limit: 1 }, next: { revalidate: 300, tags: ["tags"] } }
  ).catch(() => ({ product_tags: [] as { id: string; value: string }[] }))
  const tag = product_tags[0]
  if (!tag) return []
  const { products } = await listProducts({ tag_id: [tag.id], limit })
  return products
}
