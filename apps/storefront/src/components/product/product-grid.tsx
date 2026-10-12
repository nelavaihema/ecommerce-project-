import Link from "next/link"
import type { ProductHit } from "@/lib/data/search"
import { cn } from "@/lib/util/cn"
import { ProductCard, ProductCardSkeleton } from "./product-card"

export function ProductGrid({
  products,
  className,
  priorityCount = 4,
}: {
  products: ProductHit[]
  className?: string
  priorityCount?: number
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Horizontal, swipeable rail on mobile; 4-up grid on desktop. */
export function ProductRail({ products, viewAllHref }: { products: ProductHit[]; viewAllHref?: string }) {
  return (
    <div className="-mx-4 sm:mx-0">
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id} className="w-[62%] shrink-0 snap-start sm:w-auto">
            <ProductCard product={p} />
          </li>
        ))}
        {viewAllHref ? (
          <li className="w-[40%] shrink-0 snap-start sm:hidden">
            <Link
              href={viewAllHref}
              className="grid aspect-[3/4] place-items-center border border-ink text-center text-xs font-semibold uppercase tracking-[0.16em]"
            >
              View all
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  )
}
