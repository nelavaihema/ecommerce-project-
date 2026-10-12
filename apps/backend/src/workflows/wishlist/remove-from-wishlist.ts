import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import type WishlistModuleService from "../../modules/wishlist/service"

export type RemoveFromWishlistInput = {
  customer_id: string
  product_id: string
}

const removeFromWishlistStep = createStep(
  "remove-from-wishlist",
  async (input: RemoveFromWishlistInput, { container }) => {
    const wishlist: WishlistModuleService = container.resolve(WISHLIST_MODULE)
    const items = await wishlist.listWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
    })
    const ids = items.map((item) => item.id)
    if (ids.length) {
      await wishlist.softDeleteWishlistItems(ids)
    }
    return new StepResponse({ removed: ids.length }, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) {
      return
    }
    const wishlist: WishlistModuleService = container.resolve(WISHLIST_MODULE)
    await wishlist.restoreWishlistItems(ids)
  }
)

export const removeFromWishlistWorkflow = createWorkflow(
  "remove-from-wishlist",
  (input: RemoveFromWishlistInput) => {
    return new WorkflowResponse(removeFromWishlistStep(input))
  }
)
