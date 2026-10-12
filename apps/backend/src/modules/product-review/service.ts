import { MedusaService } from "@medusajs/framework/utils"
import Review from "./models/review"

export type ReviewStats = {
  product_id: string
  count: number
  average: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

class ProductReviewModuleService extends MedusaService({ Review }) {
  /** Aggregate rating stats for approved reviews of a product. */
  async getProductStats(productId: string): Promise<ReviewStats> {
    const reviews = await this.listReviews(
      { product_id: productId, status: "approved" },
      { select: ["rating"], take: null }
    )
    const distribution: ReviewStats["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    let total = 0
    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5
      distribution[rating] += 1
      total += review.rating
    }
    const count = reviews.length
    return {
      product_id: productId,
      count,
      average: count ? Math.round((total / count) * 10) / 10 : 0,
      distribution,
    }
  }
}

export default ProductReviewModuleService
