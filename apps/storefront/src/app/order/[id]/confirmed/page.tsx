import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ButtonLink } from "@/components/ui/button"
import { getCustomer, getOrder } from "@/lib/data/customer"
import { formatMoney } from "@/lib/util/money"

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } }

type Props = { params: Promise<{ id: string }> }

export default async function OrderConfirmedPage({ params }: Props) {
  const { id } = await params
  const [order, customer] = await Promise.all([getOrder(id), getCustomer()])
  if (!order) notFound()

  const a = order.shipping_address
  const cod = order.payment_collections?.some((pc) =>
    (pc.payments ?? []).some((p) => p.provider_id === "pp_system_default")
  )

  return (
    <div className="container-ds max-w-3xl pb-20 pt-10 sm:pt-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-success" strokeWidth={1.5} />
        <p className="eyebrow mt-6">Order #{order.display_id}</p>
        <h1 className="heading-display mt-2 text-5xl sm:text-7xl">Thank you!</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] text-ash">
          Your order is confirmed. We&apos;ve sent the details to <strong className="text-ink">{order.email}</strong>.
          {cod ? " Please keep the amount ready for Cash on Delivery." : ""}
        </p>
      </div>

      <div className="mt-12 bg-white p-6 sm:p-8">
        <ul className="divide-y divide-line">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative h-24 w-18 shrink-0 overflow-hidden bg-stone">
                {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="72px" className="object-cover" /> : null}
              </div>
              <div className="flex-1 text-[14px]">
                <p className="font-semibold">{item.product_title ?? item.title}</p>
                <p className="text-ash">{item.variant_title} &middot; Qty {item.quantity}</p>
              </div>
              <p className="text-[14px] font-semibold">{formatMoney(item.original_total ?? item.total, order.currency_code)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[14px]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{formatMoney(order.original_item_total ?? order.item_total, order.currency_code)}</dd></div>
          {order.discount_total ? (
            <div className="flex justify-between"><dt className="text-ink-soft">Discount</dt><dd className="text-success">- {formatMoney(order.discount_total, order.currency_code)}</dd></div>
          ) : null}
          <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shipping_total ? formatMoney(order.shipping_total, order.currency_code) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatMoney(order.total, order.currency_code)}</dd></div>
        </dl>
        {a ? (
          <div className="mt-6 grid gap-6 border-t border-line pt-6 text-[14px] sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]">Delivering to</p>
              <p className="text-ink-soft">
                {a.first_name} {a.last_name}<br />
                {a.address_1}{a.address_2 ? `, ${a.address_2}` : ""}<br />
                {a.city}, {a.province} {a.postal_code}<br />
                {a.phone}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em]">Delivery & payment</p>
              <p className="text-ink-soft">
                {order.shipping_methods?.[0]?.name}<br />
                {cod ? "Cash on Delivery" : "Paid online"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href={customer ? `/account/orders/${order.id}` : `/track?order=${order.display_id}`} variant="secondary" size="lg">
          Track order
        </ButtonLink>
        <ButtonLink href="/shop" size="lg">
          Continue shopping
        </ButtonLink>
      </div>
    </div>
  )
}
