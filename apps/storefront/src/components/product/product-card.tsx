import Image from "next/image"
import Link from "next/link"
import type { ProductHit } from "@/lib/data/search"
import { cn } from "@/lib/util/cn"
import { discountPercent } from "@/lib/util/money"
import { swatchFor } from "@/lib/util/product"
import { Badge, Price } from "../ui/misc"

export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductHit
  priority?: boolean
  className?: string
}) {
  const price = product.min_price_inr
  const original = product.original_price_inr
  const onSale = Boolean(product.on_sale_inr && original && price && original > price)
  const soldOut = product.in_stock === false
  const isNew = product.labels?.includes("new-arrival")
  const colors = (product.option_values ?? [])
    .filter((v) => v.startsWith("Color:"))
    .map((v) => v.slice("Color:".length))

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/products/${product.handle}`} className="block" aria-label={product.title}>
        <div className="relative aspect-[3/4] overflow-hidden bg-stone">
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
              className={cn(
                "object-cover transition duration-700 ease-out",
                product.hover_image ? "group-hover:opacity-0" : "group-hover:scale-[1.04]",
                soldOut && "grayscale-[40%]"
              )}
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-3xl text-ash">DS</div>
          )}
          {product.hover_image ? (
            <Image
              src={product.hover_image}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
              className="hidden object-cover opacity-0 transition duration-700 ease-out group-hover:scale-[1.02] group-hover:opacity-100 md:block"
            />
          ) : null}

          <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 sm:left-3 sm:top-3">
            {soldOut ? (
              <Badge tone="muted">Sold out</Badge>
            ) : onSale ? (
              <Badge tone="ember">-{discountPercent(original, price)}%</Badge>
            ) : isNew ? (
              <Badge tone="ivory">New</Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-1 pt-3">
          <h3 className="line-clamp-1 text-[14px] font-medium sm:text-[15px]">{product.title}</h3>
          <Price amount={price} original={onSale ? original : null} size="sm" showDiscount={false} />
          {colors.length > 1 ? (
            <div className="flex items-center gap-1.5 pt-1" aria-label={`${colors.length} colours`}>
              {colors.slice(0, 5).map((c) => (
                <span
                  key={c}
                  title={c}
                  className="size-3 rounded-full border border-ink/15"
                  style={{ backgroundColor: swatchFor(c) }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-[3/4] animate-pulse bg-stone" />
      <div className="mt-3 h-4 w-3/4 animate-pulse bg-stone" />
      <div className="mt-2 h-4 w-1/3 animate-pulse bg-stone" />
    </div>
  )
}
