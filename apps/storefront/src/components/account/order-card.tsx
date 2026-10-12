import type { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/misc"
import { formatMoney } from "@/lib/util/money"
import { orderStatusLabel } from "./order-status"

export function OrderCard({ order }: { order: HttpTypes.StoreOrder }) {
  const label = orderStatusLabel(order)
  const items = order.items ?? []
  return (
    <Link href={`/account/orders/${order.id}`} className="block border border-line bg-white p-5 transition-colors hover:border-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Order #{order.display_id}</p>
          <p className="text-[13px] text-ash">
            {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge tone={label === "Cancelled" ? "ember" : label === "Delivered" ? "success" : "ink"}>{label}</Badge>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex -space-x-3">
          {items.slice(0, 4).map((i) => (
            <div key={i.id} className="relative h-16 w-12 overflow-hidden border-2 border-white bg-stone">
              {i.thumbnail ? <Image src={i.thumbnail} alt="" fill sizes="48px" className="object-cover" /> : null}
            </div>
          ))}
          {items.length > 4 ? (
            <div className="grid h-16 w-12 place-items-center border-2 border-white bg-stone text-xs font-semibold">+{items.length - 4}</div>
          ) : null}
        </div>
        <p className="font-semibold">{formatMoney(order.total, order.currency_code)}</p>
      </div>
    </Link>
  )
}
