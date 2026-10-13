import { Check } from "lucide-react"
import { cn } from "@/lib/util/cn"

type Fulfillment = {
  created_at?: string | Date | null
  packed_at?: string | Date | null
  shipped_at?: string | Date | null
  delivered_at?: string | Date | null
  canceled_at?: string | Date | null
  labels?: { tracking_number?: string | null; tracking_url?: string | null }[] | null
}

type OrderLike = {
  status: string
  created_at: string | Date
  fulfillment_status?: string | null
  payment_status?: string | null
  fulfillments?: Fulfillment[] | null
}

const fmt = (d?: string | Date | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null

/** Human readable status label for badges and lists. */
export function orderStatusLabel(order: Pick<OrderLike, "status" | "fulfillment_status"> & { fulfillments?: Fulfillment[] | null }) {
  if (order.status === "canceled") return "Cancelled"
  // Prefer the fulfilment timestamps (always present) over the aggregated status field.
  const active = (order.fulfillments ?? []).filter((f) => !f.canceled_at)
  if (active.some((f) => f.delivered_at)) return "Delivered"
  if (active.some((f) => f.shipped_at)) return "Shipped"
  if (active.length) return "Packed"
  switch (order.fulfillment_status) {
    case "delivered":
      return "Delivered"
    case "shipped":
    case "partially_shipped":
      return "Shipped"
    case "fulfilled":
    case "partially_fulfilled":
      return "Packed"
    default:
      return order.status === "completed" ? "Completed" : "Confirmed"
  }
}

/** Status timeline: Placed -> Packed -> Shipped -> Delivered (from Medusa fulfillments). */
export function OrderTimeline({ order }: { order: OrderLike }) {
  const f = (order.fulfillments ?? []).find((x) => !x.canceled_at) ?? null
  const canceled = order.status === "canceled"
  const steps = [
    { label: "Order placed", date: fmt(order.created_at), done: true },
    { label: "Packed", date: fmt(f?.packed_at ?? f?.created_at), done: Boolean(f) },
    { label: "Shipped", date: fmt(f?.shipped_at), done: Boolean(f?.shipped_at) || ["shipped", "delivered"].includes(order.fulfillment_status ?? "") },
    { label: "Delivered", date: fmt(f?.delivered_at), done: Boolean(f?.delivered_at) || order.fulfillment_status === "delivered" },
  ]
  const tracking = f?.labels?.find((l) => l.tracking_number || l.tracking_url)

  if (canceled) {
    return <p className="rounded-xs bg-ember-soft px-4 py-3 text-sm font-medium text-ember">This order was cancelled.</p>
  }

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex flex-col items-center text-center">
            {i > 0 ? (
              <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full", s.done ? "bg-ink" : "bg-line")} aria-hidden="true" />
            ) : null}
            <span className={cn("relative z-10 grid size-7 place-items-center rounded-full border-2", s.done ? "border-ink bg-ink text-ivory" : "border-line bg-ivory")}>
              {s.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
            </span>
            <span className={cn("mt-2 text-[12px] font-semibold sm:text-[13px]", !s.done && "text-ash")}>{s.label}</span>
            {s.done && s.date ? <span className="text-[11px] text-ash">{s.date}</span> : null}
          </li>
        ))}
      </ol>
      {tracking ? (
        <p className="mt-5 text-sm">
          Tracking number: <strong>{tracking.tracking_number}</strong>
          {tracking.tracking_url ? (
            <>
              {" "}
              <a href={tracking.tracking_url} target="_blank" rel="noopener noreferrer" className="link-underline">
                Track shipment
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
