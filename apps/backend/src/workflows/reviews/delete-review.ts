import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import type ProductReviewModuleService from "../../modules/product-review/service"

const deleteReviewStep = createStep(
  "delete-review",
  async (id: string, { container }) => {
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.softDeleteReviews(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const reviewService: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.restoreReviews(id)
  }
)

export const deleteReviewWorkflow = createWorkflow("delete-product-review", (id: string) => {
  return new WorkflowResponse(deleteReviewStep(id))
})
