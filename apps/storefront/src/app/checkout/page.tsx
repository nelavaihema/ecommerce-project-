import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CheckoutClient } from "@/components/checkout/checkout-client"
import { OrderSummary } from "@/components/cart/order-summary"
import { config } from "@/lib/config"
import { getCart, listPaymentProviders, listShippingOptions } from "@/lib/data/cart"
import { getCustomer } from "@/lib/data/customer"

export const metadata: Metadata = { title: "Checkout", robots: { index: false } }

export default async function CheckoutPage() {
  const cart = await getCart()
  if (!cart || !cart.items?.length) redirect("/cart")

  const customer = await getCustomer()
  if (!customer) redirect("/account/login?redirect=%2Fcheckout&reason=checkout")

  const [shippingOptions, providers] = await Promise.all([
    cart.shipping_address?.address_1 ? listShippingOptions() : Promise.resolve([]),
    cart.region_id ? listPaymentProviders(cart.region_id) : Promise.resolve([]),
  ])

  return (
    <div className="container-ds pb-20 pt-6 sm:pt-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="heading-display text-5xl sm:text-6xl">Checkout</h1>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <CheckoutClient
            cart={cart}
            customer={customer}
            shippingOptions={shippingOptions}
            providers={providers.map((p) => p.id)}
            razorpayKeyId={config.razorpayKeyId}
          />
        </div>
        <aside className="lg:col-span-5">
          <div className="bg-white p-6 lg:sticky lg:top-28">
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em]">Order summary</h2>
            <OrderSummary cart={cart} showItems />
          </div>
        </aside>
      </div>
    </div>
  )
}
