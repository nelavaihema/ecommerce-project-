"use client"

import type { HttpTypes } from "@medusajs/types"
import { Tag, X } from "lucide-react"
import Image from "next/image"
import { useState, useTransition, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { applyPromoCode, removePromoCode } from "@/lib/data/cart"
import { formatMoney } from "@/lib/util/money"

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className={strong ? "flex justify-between pt-1 text-base font-semibold" : "flex justify-between text-[14px]"}>
      <dt className={strong ? "" : "text-ink-soft"}>{label}</dt>
      <dd className={accent ? "font-medium text-success" : ""}>{value}</dd>
    </div>
  )
}

export function PromoCodeForm({ cart }: { cart: HttpTypes.StoreCart }) {
  const [pending, start] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const promotions = (cart.promotions ?? []).filter((p) => p.code)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const code = String(new FormData(form).get("code") ?? "")
    if (!code.trim()) return
    start(async () => {
      const res = await applyPromoCode(code)
      setMessage(res.ok ? { ok: true, text: res.message ?? "Applied" } : { ok: false, text: res.error })
      if (res.ok) form.reset()
    })
  }

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="promo" className="sr-only">Coupon code</label>
        <input
          id="promo"
          name="code"
          placeholder="Coupon code"
          autoComplete="off"
          maxLength={40}
          className="h-11 min-w-0 flex-1 border border-line bg-white px-3 text-sm uppercase placeholder:normal-case focus:border-ink focus:outline-none"
        />
        <Button type="submit" variant="secondary" loading={pending} className="h-11">
          Apply
        </Button>
      </form>
      {message ? (
        <p className={message.ok ? "mt-2 text-[13px] text-success" : "mt-2 text-[13px] text-ember"} role="status">
          {message.text}
        </p>
      ) : null}
      {promotions.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {promotions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => void (await removePromoCode(p.code!)))}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success-soft px-3 text-[13px] font-medium text-success"
                aria-label={`Remove coupon ${p.code}`}
              >
                <Tag className="size-3.5" /> {p.code} <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function OrderSummary({
  cart,
  showItems = false,
  showPromo = true,
}: {
  cart: HttpTypes.StoreCart
  showItems?: boolean
  showPromo?: boolean
}) {
  const currency = cart.currency_code
  const shippingSelected = (cart.shipping_methods ?? []).length > 0
  const discount = cart.discount_total ?? 0

  return (
    <div className="space-y-5">
      {showItems ? (
        <ul className="space-y-4">
          {(cart.items ?? []).map((item) => (
            <li key={item.id} className="flex gap-3">
              <div className="relative h-20 w-15 shrink-0 overflow-hidden bg-stone">
                {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="60px" className="object-cover" /> : null}
                <span className="absolute -right-0 -top-0 grid size-5 place-items-center bg-ink text-[10px] font-bold text-ivory">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1 text-[13px]">
                <p className="line-clamp-2 font-semibold">{item.product_title ?? item.title}</p>
                <p className="text-ash">{item.variant_title}</p>
              </div>
              <p className="text-[13px] font-semibold">{formatMoney(item.original_total ?? item.total, currency)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {showPromo ? <PromoCodeForm cart={cart} /> : null}

      <dl className="space-y-2.5 border-t border-line pt-5">
        <Row label="Subtotal" value={formatMoney(cart.original_item_total ?? cart.item_total, currency)} />
        {discount > 0 ? <Row label="Discount" value={`- ${formatMoney(discount, currency)}`} accent /> : null}
        <Row
          label="Shipping"
          value={
            shippingSelected
              ? cart.shipping_total
                ? formatMoney(cart.shipping_total, currency)
                : "Free"
              : "Calculated at next step"
          }
        />
        <div className="border-t border-line pt-3">
          <Row label="Total" value={formatMoney(cart.total, currency)} strong />
          <p className="mt-1 text-xs text-ash">Includes {formatMoney(cart.tax_total, currency)} GST</p>
        </div>
      </dl>
    </div>
  )
}
