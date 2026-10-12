import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

type CustomerOrderForCancellation = {
  id: string
  customer_id: string | null
  status: string
  fulfillments?: { id: string; canceled_at: string | null }[]
}

/** POST /store/customers/me/orders/:id/cancel */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.auth_context.actor_id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "status", "fulfillments.id", "fulfillments.canceled_at"],
    filters: { id: req.params.id },
  })
  const order = (data as unknown as CustomerOrderForCancellation[])[0]

  if (!order || order.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found.")
  }
  if (order.status === "canceled") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order has already been canceled.")
  }
  if (order.status === "completed") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This order can no longer be canceled. Please contact support for help."
    )
  }
  if (order.fulfillments?.some((fulfillment) => !fulfillment.canceled_at)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "This order can no longer be canceled because fulfillment has started."
    )
  }

  await cancelOrderWorkflow(req.scope).run({ input: { order_id: order.id } })

  res.status(200).json({ id: order.id, status: "canceled" })
}
