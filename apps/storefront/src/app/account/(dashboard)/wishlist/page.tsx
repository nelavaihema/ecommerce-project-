import { Heart } from "lucide-react"
import { ProductCard } from "@/components/product/product-card"
import { WishlistButton } from "@/components/product/wishlist-button"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"
import { getWishlistProductIds } from "@/lib/data/customer"
import { searchProducts } from "@/lib/data/search"

export default async function WishlistPage() {
  const ids = await getWishlistProductIds()
  // Hydrate saved products through the search index (same card data as listings).
  const result = ids.length
    ? await searchProducts({ ids, pageSize: 100 }).catch(() => null)
    : null
  const byId = new Map((result?.hits ?? []).map((h) => [h.id, h]))
  const products = ids.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <section>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.16em]">Wishlist ({products.length})</h2>
      {products.length ? (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="relative">
              <ProductCard product={p} />
              <div className="absolute right-2 top-2">
                <WishlistButton productId={p.id} initialSaved />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="border border-dashed border-line"
          icon={<Heart />}
          title="Nothing saved yet"
          description="Tap the heart on any product to save it here."
          action={<ButtonLink href="/shop">Discover styles</ButtonLink>}
        />
      )}
    </section>
  )
}
