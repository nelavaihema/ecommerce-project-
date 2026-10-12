import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import type ProductReviewModuleService from "../../modules/product-review/service"

export type UpdateReviewStatusInput = {
  id: string
  status: "pending" | "approved" | "rejected"
}

const updateReviewStatusStep = createStep(
  "update-review-status",
  async (input: UpdateReviewStatusInput, { container }) => {
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    const previous = await reviewService.retrieveReview(input.id)
    const updated = await reviewService.updateReviews({ id: input.id, status: input.status })
    return new StepResponse(updated, { id: previous.id, status: previous.status })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.updateReviews(previous)
  }
)

export const updateReviewStatusWorkflow = createWorkflow(
  "update-product-review-status",
  (input: UpdateReviewStatusInput) => {
    const review = updateReviewStatusStep(input)
    return new WorkflowResponse(review)
  }
)
