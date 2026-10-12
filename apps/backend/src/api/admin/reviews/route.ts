import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../../modules/product-review"
import type ProductReviewModuleService from "../../../modules/product-review/service"
import type { AdminListReviewsType } from "../../validators"

/** GET /admin/reviews - moderation queue, with product titles attached. */
export const GET = async (
  req: MedusaRequest<unknown, AdminListReviewsType>,
  res: MedusaResponse
) => {
  const { limit, offset, status, product_id } =
    req.validatedQuery as unknown as AdminListReviewsType
  const reviewService: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const [reviews, count] = await reviewService.listAndCountReviews(
    { ...(status ? { status } : {}), ...(product_id ? { product_id } : {}) },
    { order: { created_at: "DESC" }, skip: offset, take: limit }
  )

  const productIds = Array.from(new Set(reviews.map((r) => r.product_id)))
  const { data: products } = productIds.length
    ? await query.graph({
        entity: "product",
        fields: ["id", "title", "handle", "thumbnail"],
        filters: { id: productIds },
      })
    : { data: [] as any[] }
  const byId = new Map<string, unknown>(products.map((p: any) => [p.id, p] as const))

  res.json({
    reviews: reviews.map((r) => ({ ...r, product: byId.get(r.product_id) ?? null })),
    count,
    limit,
    offset,
  })
}
