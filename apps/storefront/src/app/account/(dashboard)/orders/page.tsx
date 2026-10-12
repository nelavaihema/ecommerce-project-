import { Package } from "lucide-react"
import { OrderCard } from "@/components/account/order-card"
import { ButtonLink } from "@/components/ui/button"
import { Alert, EmptyState } from "@/components/ui/misc"
import { listOrders } from "@/lib/data/customer"

export default async function OrdersPage() {
  const result = await listOrders(50).catch(() => null)
  if (!result) return <Alert>We couldn&apos;t load your orders right now. Please refresh in a moment.</Alert>
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em]">Your orders</h2>
      {result.orders.length ? (
        <div className="space-y-4">
          {result.orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="border border-dashed border-line"
          icon={<Package />}
          title="No orders yet"
          description="Your orders and their delivery status will appear here."
          action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
        />
      )}
    </section>
  )
}
