import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../modules/wishlist"
import type WishlistModuleService from "../../modules/wishlist/service"

export type AddToWishlistInput = {
  customer_id: string
  product_id: string
  variant_id?: string | null
}

const addToWishlistStep = createStep(
  "add-to-wishlist",
  async (input: AddToWishlistInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { id: input.product_id },
    })
    if (!products.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
    }

    const wishlist: WishlistModuleService = container.resolve(WISHLIST_MODULE)
    const [existing] = await wishlist.listWishlistItems(
      { customer_id: input.customer_id, product_id: input.product_id },
      { take: 1 }
    )
    if (existing) {
      // Idempotent: adding twice is not an error, and nothing to compensate.
      return new StepResponse(existing, null)
    }
    const item = await wishlist.createWishlistItems({
      customer_id: input.customer_id,
      product_id: input.product_id,
      variant_id: input.variant_id ?? null,
    })
    return new StepResponse(item, item.id)
  },
  async (createdId, { container }) => {
    if (!createdId) {
      return
    }
    const wishlist: WishlistModuleService = container.resolve(WISHLIST_MODULE)
    await wishlist.deleteWishlistItems(createdId)
  }
)

export const addToWishlistWorkflow = createWorkflow(
  "add-to-wishlist",
  (input: AddToWishlistInput) => {
    return new WorkflowResponse(addToWishlistStep(input))
  }
)
