import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { removeFromWishlistWorkflow } from "../../../../../../workflows/wishlist/remove-from-wishlist"

/** DELETE /store/customers/me/wishlist/:product_id */
export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { result } = await removeFromWishlistWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      product_id: req.params.product_id,
    },
  })
  res.json({ product_id: req.params.product_id, deleted: result.removed > 0 })
}
