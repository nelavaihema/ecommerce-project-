import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WISHLIST_MODULE } from "../../../../../modules/wishlist"
import type WishlistModuleService from "../../../../../modules/wishlist/service"
import { addToWishlistWorkflow } from "../../../../../workflows/wishlist/add-to-wishlist"
import type { StoreAddWishlistItemType } from "../../../../validators"

/**
 * GET /store/customers/me/wishlist - the customer's saved products (ids).
 * The storefront hydrates products through the regular Store product API so
 * prices are region-aware.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const wishlist: WishlistModuleService = req.scope.resolve(WISHLIST_MODULE)
  const items = await wishlist.listWishlistItems(
    { customer_id: req.auth_context.actor_id },
    { select: ["id", "product_id", "variant_id", "created_at"], order: { created_at: "DESC" }, take: 200 }
  )
  res.json({ items, count: items.length })
}

/** POST /store/customers/me/wishlist - save a product (idempotent). */
export const POST = async (
  req: AuthenticatedMedusaRequest<StoreAddWishlistItemType>,
  res: MedusaResponse
) => {
  const { result } = await addToWishlistWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      product_id: req.validatedBody.product_id,
      variant_id: req.validatedBody.variant_id ?? null,
    },
  })
  res.status(201).json({ item: result })
}
