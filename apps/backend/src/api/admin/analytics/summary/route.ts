import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type OrderRow = {
  id: string
  created_at: string | Date
  total: number
  currency_code: string
  status: string
  items?: { product_id?: string | null; title?: string; quantity?: number; total?: number }[]
}

/**
 * GET /admin/analytics/summary?days=30
 * Lightweight sales overview for the admin dashboard widget: revenue, order
 * count, average order value, daily revenue series and top products.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "total",
      "currency_code",
      "status",
      "items.product_id",
      "items.title",
      "items.quantity",
      "items.total",
    ],
    filters: { created_at: { $gte: since } },
    pagination: { take: 5000, order: { created_at: "ASC" } },
  })
  const orders = (data as unknown as OrderRow[]).filter((o) => o.status !== "canceled")

  const revenue = orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
  const byDay = new Map<string, number>()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    byDay.set(d.toISOString().slice(0, 10), 0)
  }
  const products = new Map<string, { title: string; quantity: number; revenue: number }>()

  for (const order of orders) {
    const day = new Date(order.created_at).toISOString().slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + Number(order.total ?? 0))
    for (const item of order.items ?? []) {
      const key = item.product_id ?? item.title ?? "unknown"
      const entry = products.get(key) ?? { title: item.title ?? "Unknown", quantity: 0, revenue: 0 }
      entry.quantity += Number(item.quantity ?? 0)
      entry.revenue += Number(item.total ?? 0)
      products.set(key, entry)
    }
  }

  res.json({
    days,
    currency_code: orders[0]?.currency_code ?? "inr",
    orders: orders.length,
    revenue,
    average_order_value: orders.length ? revenue / orders.length : 0,
    series: Array.from(byDay, ([date, value]) => ({ date, revenue: value })),
    top_products: Array.from(products.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  })
}
