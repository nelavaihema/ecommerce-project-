"use client"

import Image from "next/image"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { Alert } from "@/components/ui/misc"
import { trackOrder, type TrackState } from "@/lib/data/account-actions"
import { formatMoney } from "@/lib/util/money"
import { OrderTimeline, orderStatusLabel } from "./order-status"

export function TrackOrderForm({ defaultOrder }: { defaultOrder?: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, null)
  const order = state?.order

  return (
    <div className="space-y-8">
      <form action={action} className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end" noValidate>
        <Input label="Order number" name="order" inputMode="numeric" placeholder="e.g. 1024" defaultValue={defaultOrder} required error={state?.fieldErrors?.order} />
        <Input label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
        <Button type="submit" size="lg" loading={pending} className="h-12">
          Track
        </Button>
      </form>

      {state?.error ? <Alert>{state.error}</Alert> : null}

      {order ? (
        <div className="space-y-6 border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">Order #{order.display_id}</p>
              <p className="text-[13px] text-ash">
                Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.14em]">{orderStatusLabel(order)}</span>
          </div>
          <OrderTimeline order={order} />
          <ul className="divide-y divide-line border-t border-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <div className="relative h-20 w-15 shrink-0 overflow-hidden bg-stone">
                  {i.thumbnail ? <Image src={i.thumbnail} alt="" fill sizes="60px" className="object-cover" /> : null}
                </div>
                <div className="flex-1 text-[14px]">
                  <p className="font-semibold">{i.title}</p>
                  <p className="text-ash">{i.variant_title} &middot; Qty {i.quantity}</p>
                </div>
                <p className="text-[14px] font-semibold">{formatMoney(i.original_total ?? i.total, order.currency_code)}</p>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line pt-4 font-semibold">
            <span>Total</span>
            <span>{formatMoney(order.total, order.currency_code)}</span>
          </div>
          {order.shipping_address ? (
            <p className="text-[14px] text-ink-soft">
              Delivering to {order.shipping_address.first_name} {order.shipping_address.last_name}, {order.shipping_address.city}{" "}
              {order.shipping_address.postal_code}
              {order.shipping_methods?.[0] ? ` via ${order.shipping_methods[0].name}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
