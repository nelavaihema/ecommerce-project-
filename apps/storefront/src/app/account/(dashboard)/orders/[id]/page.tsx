import { ChevronLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { OrderCancelButton } from "@/components/account/order-cancel-button"
import { OrderTimeline, orderStatusLabel } from "@/components/account/order-status"
import { Badge } from "@/components/ui/misc"
import { getCustomer, getOrder } from "@/lib/data/customer"
import { formatMoney } from "@/lib/util/money"

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const [order, customer] = await Promise.all([getOrder(id), getCustomer()])
  // Only the owner may view an order here.
  if (!order || !customer || (order.customer_id && order.customer_id !== customer.id)) notFound()

  const a = order.shipping_address
  const label = orderStatusLabel(order)
  const canCancel =
    order.status !== "completed" &&
    order.status !== "canceled" &&
    !(order.fulfillments ?? []).some((fulfillment) => !fulfillment.canceled_at)

  return (
    <div className="space-y-8">
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-ash hover:text-ink">
        <ChevronLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="heading-display text-4xl">Order #{order.display_id}</h2>
          <p className="text-[13px] text-ash">
            Placed on {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Badge tone={label === "Cancelled" ? "ember" : label === "Delivered" ? "success" : "ink"}>{label}</Badge>
      </div>

      <div className="border border-line bg-white p-5 sm:p-6">
        <OrderTimeline order={order} />
      </div>

      {canCancel ? <OrderCancelButton orderId={order.id} /> : null}

      <div className="border border-line bg-white p-5 sm:p-6">
        <ul className="divide-y divide-line">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex gap-4 py-4 first:pt-0">
              <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-stone">
                {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="72px" className="object-cover" /> : null}
              </div>
              <div className="flex-1 text-[14px]">
                {item.product_handle ? (
                  <Link href={`/products/${item.product_handle}`} className="font-semibold hover:underline">{item.product_title ?? item.title}</Link>
                ) : (
                  <p className="font-semibold">{item.product_title ?? item.title}</p>
                )}
                <p className="text-ash">{item.variant_title} &middot; Qty {item.quantity}</p>
              </div>
              <p className="text-[14px] font-semibold">{formatMoney(item.original_total ?? item.total, order.currency_code)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[14px]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.original_item_total ?? order.item_total, order.currency_code)}</dd></div>
          {order.discount_total ? <div className="flex justify-between"><dt className="text-ink-soft">Discount</dt><dd className="text-success">- {formatMoney(order.discount_total, order.currency_code)}</dd></div> : null}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shipping_total ? formatMoney(order.shipping_total, order.currency_code) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency_code)}</dd></div>
        </dl>
      </div>

      {a ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-line bg-white p-5 text-[14px]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]">Shipping address</p>
            <p className="text-ink-soft">
              {a.first_name} {a.last_name}<br />
              {a.address_1}{a.address_2 ? `, ${a.address_2}` : ""}<br />
              {a.city}, {a.province} {a.postal_code}<br />
              {a.phone}
            </p>
          </div>
          <div className="border border-line bg-white p-5 text-[14px]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em]">Delivery</p>
            <p className="text-ink-soft">{order.shipping_methods?.map((m) => m.name).join(", ")}</p>
            <p className="mt-3 text-ash">Need help? Message us on Instagram with your order number.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
