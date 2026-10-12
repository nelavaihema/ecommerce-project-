import { Lock, ShoppingBag } from "lucide-react"
import type { Metadata } from "next"
import { FreeShippingMeter } from "@/components/cart/free-shipping-meter"
import { LineItem } from "@/components/cart/line-item"
import { OrderSummary } from "@/components/cart/order-summary"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"
import { getCart } from "@/lib/data/cart"

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } }

export default async function CartPage() {
  const cart = await getCart()
  const items = cart?.items ?? []

  if (!cart || !items.length) {
    return (
      <div className="container-ds">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          description="Looks like you haven't added anything yet. New drops are waiting."
          action={<ButtonLink href="/shop" size="lg">Shop Now</ButtonLink>}
        />
      </div>
    )
  }

  const count = items.reduce((n, i) => n + i.quantity, 0)
  const hasStockIssue = items.some(
    (i) =>
      i.variant?.manage_inventory &&
      !i.variant.allow_backorder &&
      typeof i.variant.inventory_quantity === "number" &&
      i.variant.inventory_quantity < i.quantity
  )

  return (
    <div className="container-ds pb-20 pt-8 sm:pt-12">
      <h1 className="heading-display text-5xl sm:text-7xl">Your Bag</h1>
      <p className="mt-2 text-[15px] text-ash">{count} item{count === 1 ? "" : "s"}</p>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="border-y border-line py-4">
            <FreeShippingMeter itemTotal={cart.item_total ?? 0} currency={cart.currency_code} />
          </div>
          <ul className="divide-y divide-line border-b border-line">
            {[...items]
              .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))
              .map((item) => (
                <LineItem key={item.id} item={item} currency={cart.currency_code} />
              ))}
          </ul>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-white p-6 lg:sticky lg:top-28">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em]">Order summary</h2>
            <OrderSummary cart={cart} />
            {hasStockIssue ? (
              <p className="mt-4 text-[13px] text-ember">Some items exceed available stock. Please update quantities.</p>
            ) : null}
            <ButtonLink
              href="/checkout"
              size="lg"
              fullWidth
              className={hasStockIssue ? "pointer-events-none mt-6 opacity-50" : "mt-6"}
              aria-disabled={hasStockIssue}
            >
              <Lock className="size-4" /> Checkout
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-ash">Cash on Delivery and secure online payments</p>
            <ButtonLink href="/shop" variant="link" fullWidth className="mt-4">
              Continue shopping
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  )
}
