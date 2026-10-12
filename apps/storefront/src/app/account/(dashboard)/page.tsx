import { Package } from "lucide-react"
import Link from "next/link"
import { OrderCard } from "@/components/account/order-card"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"
import { getCustomer, getWishlistProductIds, listOrders } from "@/lib/data/customer"

export default async function AccountOverviewPage() {
  const [customer, orders, wishlist] = await Promise.all([
    getCustomer(),
    listOrders(3).catch(() => ({ orders: [], count: 0 })),
    getWishlistProductIds(),
  ])
  const defaultAddress = customer?.addresses?.find((a) => a.is_default_shipping) ?? customer?.addresses?.[0]

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Orders", value: orders.count ?? orders.orders.length, href: "/account/orders" },
          { label: "Wishlist", value: wishlist.length, href: "/account/wishlist" },
          { label: "Addresses", value: customer?.addresses?.length ?? 0, href: "/account/addresses" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="border border-line bg-white p-5 hover:border-ink">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ash">{s.label}</p>
            <p className="mt-2 font-display text-5xl">{s.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Recent orders</h2>
          {orders.orders.length ? <Link href="/account/orders" className="link-underline text-sm">View all</Link> : null}
        </div>
        {orders.orders.length ? (
          <div className="space-y-4">
            {orders.orders.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="border border-dashed border-line py-12 sm:py-12"
            icon={<Package />}
            title="No orders yet"
            description="When you place an order it will show up here."
            action={<ButtonLink href="/shop">Shop Now</ButtonLink>}
          />
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Profile</h2>
          <p className="mt-3 text-[14px]">{customer?.first_name} {customer?.last_name}</p>
          <p className="text-[14px] text-ash">{customer?.email}</p>
          {customer?.phone ? <p className="text-[14px] text-ash">{customer.phone}</p> : null}
          <Link href="/account/profile" className="link-underline mt-3 inline-block text-sm">Edit</Link>
        </div>
        <div className="border border-line bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Default address</h2>
          {defaultAddress ? (
            <p className="mt-3 text-[14px] text-ink-soft">
              {defaultAddress.first_name} {defaultAddress.last_name}<br />
              {defaultAddress.address_1}, {defaultAddress.city} {defaultAddress.postal_code}
            </p>
          ) : (
            <p className="mt-3 text-[14px] text-ash">No saved address yet.</p>
          )}
          <Link href="/account/addresses" className="link-underline mt-3 inline-block text-sm">Manage</Link>
        </div>
      </section>
    </div>
  )
}
