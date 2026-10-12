"use client"

import type { HttpTypes } from "@medusajs/types"
import { CheckCircle2, ShoppingBag } from "lucide-react"
import { ButtonLink } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { formatMoney } from "@/lib/util/money"
import { useCartUI } from "./cart-context"
import { FreeShippingMeter } from "./free-shipping-meter"
import { LineItem } from "./line-item"

export function CartDrawer({ cart }: { cart: HttpTypes.StoreCart | null }) {
  const { isOpen, close, notice } = useCartUI()
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  )
  const currency = cart?.currency_code ?? "inr"
  const count = items.reduce((n, i) => n + i.quantity, 0)
  const itemTotal = cart?.item_total ?? 0

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title={`Your Bag${count ? ` (${count})` : ""}`}
      footer={
        items.length ? (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold uppercase tracking-[0.14em]">Subtotal</span>
              <span className="text-lg font-semibold">{formatMoney(cart?.original_item_total ?? itemTotal, currency)}</span>
            </div>
            <p className="text-xs text-ash">Inclusive of GST. Shipping and coupons calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href="/cart" variant="secondary" onClick={close}>
                View Bag
              </ButtonLink>
              <ButtonLink href="/checkout" onClick={close}>
                Checkout
              </ButtonLink>
            </div>
          </div>
        ) : null
      }
    >
      {notice ? (
        <div className="flex items-center gap-2 border-b border-line bg-success-soft px-5 py-3 text-sm font-medium text-success" role="status">
          <CheckCircle2 className="size-4" /> {notice}
        </div>
      ) : null}

      {items.length ? (
        <div className="px-5">
          <div className="border-b border-line py-4">
            <FreeShippingMeter itemTotal={itemTotal} currency={currency} />
          </div>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <LineItem key={item.id} item={item} currency={currency} compact onNavigate={close} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-8 py-20 text-center">
          <ShoppingBag className="size-10 text-ash" />
          <p className="heading-display mt-5 text-3xl">Your bag is empty</p>
          <p className="mt-2 text-sm text-ash">Fresh drops are waiting. Let&apos;s fix that.</p>
          <ButtonLink href="/shop" className="mt-8" onClick={close}>
            Shop Now
          </ButtonLink>
        </div>
      )}
    </Drawer>
  )
}
