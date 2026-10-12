import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import type ProductReviewModuleService from "../../../../../modules/product-review/service"
import { createReviewWorkflow } from "../../../../../workflows/reviews/create-review"
import type { StoreCreateReviewType, StoreListReviewsType } from "../../../../validators"

const PUBLIC_FIELDS = [
  "id",
  "author_name",
  "rating",
  "title",
  "content",
  "verified_purchase",
  "created_at",
] as const

/** GET /store/products/:id/reviews - approved reviews with rating summary. */
export const GET = async (
  req: MedusaRequest<unknown, StoreListReviewsType>,
  res: MedusaResponse
) => {
  const productId = req.params.id
  const { limit, offset } = req.validatedQuery as unknown as StoreListReviewsType
  const reviewService: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)

  const [[reviews, count], stats] = await Promise.all([
    reviewService.listAndCountReviews(
      { product_id: productId, status: "approved" },
      { select: [...PUBLIC_FIELDS], order: { created_at: "DESC" }, skip: offset, take: limit }
    ),
    reviewService.getProductStats(productId),
  ])

  res.json({ reviews, count, limit, offset, stats })
}

/** POST /store/products/:id/reviews - logged-in customers submit a review (moderated). */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateReviewType>,
  res: MedusaResponse
) => {
  const customerId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name"],
    filters: { id: customerId },
  })

  const fallbackName = [customer?.first_name, customer?.last_name?.charAt(0)]
    .filter(Boolean)
    .join(" ")
    .trim()

  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      customer_id: customerId,
      author_name: req.validatedBody.author_name || fallbackName || "DS Customer",
      rating: req.validatedBody.rating,
      title: req.validatedBody.title ?? null,
      content: req.validatedBody.content,
      status: "pending",
    },
  })

  res.status(201).json({
    review: { id: result.id, status: result.status },
    message: "Thanks! Your review will appear once it has been approved.",
  })
}
