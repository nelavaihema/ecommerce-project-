"use client"

import type { HttpTypes } from "@medusajs/types"
import { AlertCircle, ArrowLeft, Minus, Plus, RotateCcw, Truck, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { useCartUI } from "@/components/cart/cart-context"
import { Button } from "@/components/ui/button"
import { Badge, Price, Stars } from "@/components/ui/misc"
import { addToCart } from "@/lib/data/cart"
import { cn } from "@/lib/util/cn"
import {
  cheapestPrice,
  findVariant,
  imagesForVariant,
  isVariantInStock,
  sortOptionValues,
  swatchFor,
  variantOptionMap,
  variantPrice,
  variantStockLevel,
} from "@/lib/util/product"
import type { SizeGuideKey } from "@/lib/util/size-guides"
import { ProductGallery } from "./product-gallery"
import { SizeGuideButton } from "./size-guide"
import { WishlistButton } from "./wishlist-button"

type Props = {
  product: HttpTypes.StoreProduct
  saved: boolean
  rating?: { average: number; count: number } | null
}

export function ProductView({ product, saved, rating }: Props) {
  const router = useRouter()
  const { openWithNotice } = useCartUI()
  const options = useMemo(
    () =>
      (product.options ?? []).map((o) => ({
        title: o.title,
        values: sortOptionValues(o.title, Array.from(new Set((o.values ?? []).map((v) => v.value)))),
      })),
    [product.options]
  )
  const variants = product.variants ?? []

  // Preselect single-value options and the first in-stock colour.
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const o of options) {
      if (o.values.length === 1) initial[o.title] = o.values[0]
    }
    const colour = options.find((o) => /colou?r/i.test(o.title))
    if (colour && !initial[colour.title]) {
      const firstInStock = variants.find(isVariantInStock)
      initial[colour.title] = (firstInStock && variantOptionMap(firstInStock)[colour.title]) || colour.values[0]
    }
    return initial
  })
  const [qty, setQty] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [buyNow, setBuyNow] = useState(false)

  const variant = findVariant(product, selected)
  const price = variantPrice(variant) ?? cheapestPrice(product)
  const stock = variantStockLevel(variant)
  const allSoldOut = variants.length > 0 && !variants.some(isVariantInStock)
  const maxQty =
    variant?.manage_inventory && !variant.allow_backorder
      ? Math.max(1, Math.min(10, variant.inventory_quantity ?? 1))
      : 10

  // Images follow the selected colour when a colour is chosen.
  const colourOption = options.find((o) => /colou?r/i.test(o.title))
  const imageVariant =
    variant ??
    (colourOption && selected[colourOption.title]
      ? variants.find((v) => variantOptionMap(v)[colourOption.title] === selected[colourOption.title])
      : undefined)
  const images = imagesForVariant(product, imageVariant)

  /** Is there any in-stock variant with this value, given the other selections? */
  const valueAvailable = (title: string, value: string) =>
    variants.some((v) => {
      const map = variantOptionMap(v)
      if (map[title] !== value) return false
      return (
        isVariantInStock(v) &&
        Object.entries(selected).every(([t, val]) => t === title || !val || map[t] === val || /size|waist|volume/i.test(t))
      )
    })

  const choose = (title: string, value: string) => {
    setError(null)
    setQty(1)
    setSelected((s) => ({ ...s, [title]: value }))
  }

  const missing = options.find((o) => !selected[o.title])

  const submit = (goToCheckout: boolean) => {
    if (missing) {
      setError(`Please select a ${missing.title.toLowerCase()}`)
      // On mobile the sticky bar can be far from the options - bring them into view.
      document
        .getElementById(`option-${missing.title.toLowerCase()}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    if (!variant || !isVariantInStock(variant)) {
      setError("This option is sold out")
      return
    }
    setError(null)
    setBuyNow(goToCheckout)
    start(async () => {
      const res = await addToCart({ variantId: variant.id, quantity: qty })
      if (!res.ok) {
        setError(res.error)
        return
      }
      if (goToCheckout) router.push("/checkout")
      else openWithNotice(`Added to bag: ${product.title}${variant.title ? ` (${variant.title})` : ""}`)
    })
  }

  const sizeGuide = (product.metadata?.size_guide as SizeGuideKey | "none" | undefined) ?? "none"
  const ctaDisabled = pending || allSoldOut || (variant ? !isVariantInStock(variant) : false)

  return (
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        title="Go back"
        className="mb-6 inline-flex h-10 items-center gap-2 rounded-xs border border-line px-4 text-sm font-semibold text-ink transition-colors hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span>Back</span>
      </button>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <ProductGallery images={images} title={product.title} soldOut={allSoldOut} />
      </div>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <div className="flex items-start justify-between gap-4">
            <div>
              {product.collection ? <p className="eyebrow mb-2">{product.collection.title}</p> : null}
              <h1 className="heading-display text-4xl sm:text-5xl">{product.title}</h1>
              {product.subtitle ? <p className="mt-1 text-[15px] text-ash">{product.subtitle}</p> : null}
            </div>
            <WishlistButton productId={product.id} initialSaved={saved} className="border border-line" />
          </div>

          {rating && rating.count > 0 ? (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13px] text-ink-soft hover:underline">
              <Stars rating={rating.average} /> {rating.average.toFixed(1)} ({rating.count} review{rating.count === 1 ? "" : "s"})
            </a>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            {price ? (
              <Price amount={price.calculated} original={price.onSale ? price.original : null} currency={price.currency} size="lg" />
            ) : (
              <span className="text-ash">Price unavailable</span>
            )}
            {allSoldOut ? <Badge tone="muted">Sold out</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-ash">Inclusive of all taxes</p>

          {/* Options */}
          <div className="mt-8 space-y-6">
            {options.map((option) => {
              const isColour = /colou?r/i.test(option.title)
              const isSizeLike = /size|waist|volume/i.test(option.title)
              return (
                <fieldset key={option.title} id={`option-${option.title.toLowerCase()}`} className="scroll-mt-28">
                  <div className="mb-3 flex items-center justify-between">
                    <legend className="text-xs font-semibold uppercase tracking-[0.16em]">
                      {option.title}
                      {selected[option.title] ? <span className="ml-2 font-normal normal-case tracking-normal text-ash">{selected[option.title]}</span> : null}
                    </legend>
                    {isSizeLike && sizeGuide !== "none" ? <SizeGuideButton guide={sizeGuide} /> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const active = selected[option.title] === value
                      const available = valueAvailable(option.title, value)
                      if (isColour) {
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => choose(option.title, value)}
                            aria-pressed={active}
                            aria-label={`${value}${available ? "" : " (sold out)"}`}
                            title={value}
                            className={cn(
                              "relative grid size-11 place-items-center rounded-full border-2 transition",
                              active ? "border-ink" : "border-transparent hover:border-line"
                            )}
                          >
                            <span className="size-8 rounded-full border border-ink/15" style={{ backgroundColor: swatchFor(value) }} />
                            {!available ? <span className="absolute h-0.5 w-9 rotate-45 bg-ash" aria-hidden="true" /> : null}
                          </button>
                        )
                      }
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => available && choose(option.title, value)}
                          disabled={!available}
                          aria-pressed={active}
                          aria-label={`${option.title} ${value}${available ? "" : ", sold out"}`}
                          className={cn(
                            "relative h-12 min-w-14 border px-4 text-sm font-semibold transition-colors",
                            active && "border-ink bg-ink text-ivory",
                            !active && available && "border-line bg-white hover:border-ink",
                            !available && "cursor-not-allowed border-line bg-stone/40 text-ash line-through decoration-1"
                          )}
                        >
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )
            })}
          </div>

          {/* Stock status */}
          <div className="mt-5 min-h-6 text-[13px]" aria-live="polite">
            {variant ? (
              stock === "out_of_stock" ? (
                <span className="font-semibold text-ember">Sold out in this option</span>
              ) : stock === "low" ? (
                <span className="font-semibold text-warn">Hurry, only {variant.inventory_quantity} left</span>
              ) : (
                <span className="font-semibold text-success">In stock, ready to ship</span>
              )
            ) : allSoldOut ? (
              <span className="font-semibold text-ember">This product is currently sold out</span>
            ) : null}
          </div>

          {/* Quantity + CTAs */}
          <div className="mt-4 flex gap-3">
            <div className="flex h-14 items-center border border-line bg-white" aria-label="Quantity">
              <button type="button" className="grid h-full w-11 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
              <button type="button" className="grid h-full w-11 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">
                <Plus className="size-4" />
              </button>
            </div>
            <Button size="lg" className="flex-1" onClick={() => submit(false)} loading={pending && !buyNow} disabled={ctaDisabled}>
              {allSoldOut ? "Sold Out" : "Add to Bag"}
            </Button>
          </div>
          <Button size="lg" variant="secondary" fullWidth className="mt-3" onClick={() => submit(true)} loading={pending && buyNow} disabled={ctaDisabled}>
            Buy Now
          </Button>

          {error ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-ember" role="alert">
              <AlertCircle className="size-4" /> {error}
            </p>
          ) : null}

          <ul className="mt-8 grid gap-3 border-t border-line pt-6 text-[13px]">
            <li className="flex items-center gap-3"><Truck className="size-4" strokeWidth={1.5} /> Free shipping above Rs 1,499 - delivered in 4-7 days</li>
            <li className="flex items-center gap-3"><Wallet className="size-4" strokeWidth={1.5} /> Cash on Delivery available</li>
            <li className="flex items-center gap-3"><RotateCcw className="size-4" strokeWidth={1.5} /> Easy 7-day size exchange</li>
          </ul>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{product.title}</p>
            {price ? <Price amount={price.calculated} original={price.onSale ? price.original : null} size="sm" showDiscount={false} /> : null}
          </div>
          <Button onClick={() => submit(false)} loading={pending && !buyNow} disabled={ctaDisabled} className="shrink-0">
            {allSoldOut ? "Sold Out" : missing ? `Select ${missing.title}` : "Add to Bag"}
          </Button>
        </div>
      </div>
    </div>
    </div>
  )
}
