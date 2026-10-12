import "server-only"
import { sdk } from "../sdk"

export type Review = {
  id: string
  author_name: string
  rating: number
  title?: string | null
  content: string
  verified_purchase: boolean
  created_at: string
}

export type ReviewStats = {
  count: number
  average: number
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>
}

export async function listReviews(productId: string, limit = 10, offset = 0) {
  try {
    return await sdk.client.fetch<{ reviews: Review[]; count: number; stats: ReviewStats }>(
      `/store/products/${productId}/reviews`,
      {
        method: "GET",
        query: { limit, offset },
        next: { revalidate: 60, tags: [`reviews-${productId}`] },
      }
    )
  } catch {
    return null
  }
}
