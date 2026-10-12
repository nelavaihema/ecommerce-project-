import { getCart } from "@/lib/data/cart"
import { listCategories } from "@/lib/data/catalog"
import { listBanners } from "@/lib/data/content"
import { getCustomer } from "@/lib/data/customer"
import { CartDrawer } from "../cart/cart-drawer"
import { AnnouncementBar } from "./announcement-bar"
import { HeaderClient, type NavItem } from "./header-client"

/** Server component: loads navigation, cart and session, then renders the interactive header. */
export async function Header() {
  const [categories, cart, customer, announcements] = await Promise.all([
    listCategories().catch(() => []),
    getCart(),
    getCustomer(),
    listBanners("announcement"),
  ])

  const nav: NavItem[] = categories
    .filter((c) => !c.parent_category_id)
    .map((c) => ({
      label: c.name,
      href: `/categories/${c.handle}`,
      image: (c.metadata as Record<string, string> | null)?.image,
      children: categories
        .filter((child) => child.parent_category_id === c.id)
        .map((child) => ({ label: child.name, href: `/categories/${child.handle}` })),
    }))

  const count = (cart?.items ?? []).reduce((n, i) => n + i.quantity, 0)

  return (
    <>
      <AnnouncementBar
        messages={
          announcements.length
            ? announcements.map((a) => ({ text: a.title, href: a.cta_url ?? undefined }))
            : [{ text: "Shipping across India - Cash on Delivery available" }]
        }
      />
      <HeaderClient nav={nav} cartCount={count} customerName={customer?.first_name ?? null} />
      <CartDrawer cart={cart} />
    </>
  )
}
