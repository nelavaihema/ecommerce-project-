import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { StoreOrderLookupType } from "../../validators"

/**
 * POST /store/order-lookup
 * Lets a guest track an order with its order number + the email used at checkout.
 * Both must match; the response is limited to what an order-status page needs and
 * the same "not found" error is returned for any mismatch to avoid order enumeration.
 */
export const POST = async (req: MedusaRequest<StoreOrderLookupType>, res: MedusaResponse) => {
  const { display_id, email } = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "created_at",
      "currency_code",
      "total",
      "subtotal",
      "shipping_total",
      "discount_total",
      "tax_total",
      "payment_status",
      "fulfillment_status",
      "items.id",
      "items.title",
      "items.subtitle",
      "items.thumbnail",
      "items.quantity",
      "items.unit_price",
      "items.total",
      "items.original_total",
      "items.variant_title",
      "items.product_handle",
      "shipping_address.first_name",
      "shipping_address.last_name",
      "shipping_address.address_1",
      "shipping_address.address_2",
      "shipping_address.city",
      "shipping_address.province",
      "shipping_address.postal_code",
      "shipping_address.country_code",
      "shipping_methods.name",
      "fulfillments.id",
      "fulfillments.created_at",
      "fulfillments.packed_at",
      "fulfillments.shipped_at",
      "fulfillments.delivered_at",
      "fulfillments.canceled_at",
      "fulfillments.labels.tracking_number",
      "fulfillments.labels.tracking_url",
    ],
    // Generated graph types declare display_id filters as strings; Postgres casts it.
    filters: { display_id: String(display_id) },
  })

  const order = orders.find((o: any) => (o.email ?? "").toLowerCase() === email)
  if (!order) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "We couldn't find an order with that number and email."
    )
  }

  res.json({ order })
}
