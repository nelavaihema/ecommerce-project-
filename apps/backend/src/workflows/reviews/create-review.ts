import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import type ProductReviewModuleService from "../../modules/product-review/service"

export type CreateReviewInput = {
  product_id: string
  customer_id?: string | null
  author_name: string
  rating: number
  title?: string | null
  content: string
  status?: "pending" | "approved" | "rejected"
}

const validateReviewStep = createStep(
  "validate-review",
  async (input: CreateReviewInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
    })
    if (!products.length || products[0].status !== "published") {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
    }

    let verified = false
    if (input.customer_id) {
      const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
      const [existing] = await reviewService.listReviews(
        { product_id: input.product_id, customer_id: input.customer_id },
        { take: 1 }
      )
      if (existing) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          "You have already reviewed this product"
        )
      }
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "items.product_id"],
        filters: { customer_id: input.customer_id },
      })
      verified = orders.some((order: any) =>
        (order.items ?? []).some((item: any) => item?.product_id === input.product_id)
      )
    }
    return new StepResponse({ verified_purchase: verified })
  }
)

const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewInput & { verified_purchase: boolean }, { container }) => {
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    const review = await reviewService.createReviews({
      product_id: input.product_id,
      customer_id: input.customer_id ?? null,
      author_name: input.author_name,
      rating: input.rating,
      title: input.title ?? null,
      content: input.content,
      status: input.status ?? "pending",
      verified_purchase: input.verified_purchase,
    })
    return new StepResponse(review, review.id)
  },
  async (reviewId, { container }) => {
    if (!reviewId) {
      return
    }
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.deleteReviews(reviewId)
  }
)

export const createReviewWorkflow = createWorkflow(
  "create-product-review",
  (input: CreateReviewInput) => {
    const validation = validateReviewStep(input)
    const data = transform({ input, validation }, ({ input, validation }) => ({
      ...input,
      verified_purchase: validation.verified_purchase,
    }))
    const review = createReviewStep(data)
    return new WorkflowResponse(review)
  }
)
