"use client"

import type { HttpTypes } from "@medusajs/types"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useTransition } from "react"
import { removeLineItem, updateLineItem } from "@/lib/data/cart"
import { cn } from "@/lib/util/cn"
import { formatMoney } from "@/lib/util/money"

type Props = {
  item: HttpTypes.StoreCartLineItem
  currency: string
  compact?: boolean
  onNavigate?: () => void
}

export function LineItem({ item, currency, compact, onNavigate }: Props) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const variant = item.variant
  // The cart API doesn't compute inventory_quantity; only trust it when present.
  // The backend rejects quantities above available stock either way.
  const knownStock =
    variant?.manage_inventory && !variant.allow_backorder && typeof variant.inventory_quantity === "number"
      ? variant.inventory_quantity
      : null
  const maxQty = knownStock === null ? 10 : Math.min(10, Math.max(item.quantity, knownStock))
  const href = item.product_handle ? `/products/${item.product_handle}` : "#"
  const compareAt = (item as { compare_at_unit_price?: number | null }).compare_at_unit_price
  const outOfStock = knownStock !== null && knownStock < item.quantity

  const change = (quantity: number) => {
    setError(null)
    start(async () => {
      const res =
        quantity === 0
          ? await removeLineItem(item.id)
          : await updateLineItem({ lineId: item.id, quantity })
      if (!res.ok) setError(res.error)
    })
  }

  return (
    <li className={cn("flex gap-4 py-5", pending && "opacity-60")}>
      <Link
        href={href}
        onClick={onNavigate}
        className={cn("relative shrink-0 overflow-hidden bg-stone", compact ? "h-28 w-21" : "h-36 w-27 sm:h-44 sm:w-33")}
      >
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.product_title ?? item.title} fill sizes="132px" className="object-cover" />
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href} onClick={onNavigate} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline">
              {item.product_title ?? item.title}
            </Link>
            {item.variant_title ? (
              <p className="mt-1 text-[13px] text-ash">{item.variant_title}</p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[15px] font-semibold">{formatMoney(item.original_total ?? item.total ?? item.unit_price * item.quantity, currency)}</p>
            {compareAt && compareAt > item.unit_price ? (
              <s className="text-xs text-ash">{formatMoney(compareAt * item.quantity, currency)}</s>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex h-9 items-center border border-line bg-white" aria-label="Quantity">
            <button
              type="button"
              className="grid size-9 place-items-center disabled:opacity-30"
              onClick={() => change(item.quantity - 1)}
              disabled={pending}
              aria-label="Decrease quantity"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="grid size-9 place-items-center disabled:opacity-30"
              onClick={() => change(item.quantity + 1)}
              disabled={pending || item.quantity >= maxQty}
              aria-label="Increase quantity"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => change(0)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 text-[13px] text-ash hover:text-ember"
          >
            <Trash2 className="size-4" />
            <span className={compact ? "sr-only" : ""}>Remove</span>
          </button>
        </div>
        {outOfStock ? (
          <p className="mt-2 text-[13px] text-ember">Only {Math.max(0, knownStock ?? 0)} left - please reduce the quantity.</p>
        ) : null}
        {error ? <p className="mt-2 text-[13px] text-ember">{error}</p> : null}
      </div>
    </li>
  )
}
