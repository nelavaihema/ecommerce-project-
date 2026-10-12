import "server-only"
import type { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { sdk } from "../sdk"

const REVALIDATE = 120

export const listCategories = cache(async () => {
  const { product_categories } =
    await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
      "/store/product-categories",
      {
        method: "GET",
        query: {
          fields: "id,name,handle,description,rank,metadata,parent_category_id,*category_children",
          include_descendants_tree: false,
          limit: 100,
        },
        next: { revalidate: REVALIDATE, tags: ["categories"] },
      }
    )
  return product_categories.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
})

export const getCategoryByHandle = cache(async (handle: string) => {
  const { product_categories } =
    await sdk.client.fetch<HttpTypes.StoreProductCategoryListResponse>(
      "/store/product-categories",
      {
        method: "GET",
        query: {
          handle,
          fields: "id,name,handle,description,metadata,parent_category_id,*parent_category,*category_children",
        },
        next: { revalidate: REVALIDATE, tags: ["categories"] },
      }
    )
  return product_categories[0] ?? null
})

export const listCollections = cache(async () => {
  const { collections } = await sdk.client.fetch<HttpTypes.StoreCollectionListResponse>(
    "/store/collections",
    {
      method: "GET",
      query: { limit: 50, fields: "id,title,handle,metadata" },
      next: { revalidate: REVALIDATE, tags: ["collections"] },
    }
  )
  return collections
})

export const getCollectionByHandle = cache(async (handle: string) => {
  const { collections } = await sdk.client.fetch<HttpTypes.StoreCollectionListResponse>(
    "/store/collections",
    {
      method: "GET",
      query: { handle, fields: "id,title,handle,metadata" },
      next: { revalidate: REVALIDATE, tags: ["collections"] },
    }
  )
  return collections[0] ?? null
})
