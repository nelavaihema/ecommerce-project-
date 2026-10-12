"use client"

import { Check, SlidersHorizontal, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import type { FacetValue } from "@/lib/data/search"
import { cn } from "@/lib/util/cn"
import { formatMoney } from "@/lib/util/money"
import { sortOptionValues, swatchFor } from "@/lib/util/product"

export type FilterFacets = {
  categories: { handle: string; label: string; count: number }[]
  sizes: FacetValue[]
  colors: FacetValue[]
  inStock: number
  onSale: number
  price: { min: number; max: number } | null
}

const PRICE_BUCKETS = [
  { label: "Under Rs 750", min: undefined, max: 749 },
  { label: "Rs 750 - 1,499", min: 750, max: 1499 },
  { label: "Rs 1,500 - 2,499", min: 1500, max: 2499 },
  { label: "Rs 2,500 & above", min: 2500, max: undefined },
]

/** URL-driven filters: every change is a navigation, so filtered views are shareable and back-button friendly. */
function useFilterParams() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean)

  const push = (next: URLSearchParams) => {
    next.delete("page")
    const qs = next.toString()
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    const current = list(key)
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    if (updated.length) next.set(key, updated.join(","))
    else next.delete(key)
    push(next)
  }

  const set = (entries: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(entries)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    push(next)
  }

  const clear = () => {
    const next = new URLSearchParams()
    const q = params.get("q")
    const sort = params.get("sort")
    if (q) next.set("q", q)
    if (sort) next.set("sort", sort)
    push(next)
  }

  return { params, list, toggle, set, clear, pending }
}

function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.16em]">
        {title}
        <span className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  )
}

function CheckRow({ checked, label, count, onClick }: { checked: boolean; label: ReactNode; count?: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-1.5 text-left text-[14px]" aria-pressed={checked}>
      <span className={cn("grid size-[18px] shrink-0 place-items-center border", checked ? "border-ink bg-ink text-ivory" : "border-line bg-white")}>
        {checked ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <span className="flex-1">{label}</span>
      {typeof count === "number" ? <span className="text-xs text-ash">{count}</span> : null}
    </button>
  )
}

function FilterBody({ facets, showCategories }: { facets: FilterFacets; showCategories: boolean }) {
  const { list, toggle, set, params } = useFilterParams()
  const sizes = list("size")
  const colors = list("color")
  const cats = list("category")
  const min = params.get("min") ?? undefined
  const max = params.get("max") ?? undefined

  // Group size-like options by their option title (Size / Waist / Volume)
  const sizeGroups = facets.sizes.reduce<Record<string, FacetValue[]>>((acc, v) => {
    const [title] = v.value.split(":")
    ;(acc[title] ??= []).push(v)
    return acc
  }, {})

  return (
    <div>
      {showCategories && facets.categories.length ? (
        <Group title="Category">
          {facets.categories.map((c) => (
            <CheckRow key={c.handle} checked={cats.includes(c.handle)} label={c.label} count={c.count} onClick={() => toggle("category", c.handle)} />
          ))}
        </Group>
      ) : null}

      {Object.entries(sizeGroups).map(([title, values]) => {
        const byValue = new Map(values.map((v) => [v.value.slice(title.length + 1), v]))
        const ordered = sortOptionValues(title, Array.from(byValue.keys()))
        return (
          <Group key={title} title={title}>
            <div className="flex flex-wrap gap-2">
              {ordered.map((label) => {
                const v = byValue.get(label)!
                const active = sizes.includes(v.value)
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => toggle("size", v.value)}
                    aria-pressed={active}
                    className={cn(
                      "h-10 min-w-12 border px-3 text-sm font-medium transition-colors",
                      active ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </Group>
        )
      })}

      {facets.colors.length ? (
        <Group title="Colour">
          <div className="grid grid-cols-2 gap-x-3">
            {facets.colors.map((c) => {
              const name = c.value.slice("Color:".length)
              return (
                <CheckRow
                  key={c.value}
                  checked={colors.includes(name)}
                  count={c.count}
                  onClick={() => toggle("color", name)}
                  label={
                    <span className="inline-flex items-center gap-2">
                      <span className="size-3.5 rounded-full border border-ink/15" style={{ backgroundColor: swatchFor(name) }} />
                      {name}
                    </span>
                  }
                />
              )
            })}
          </div>
        </Group>
      ) : null}

      <Group title="Price">
        {PRICE_BUCKETS.map((b) => {
          const active = (min ?? "") === (b.min?.toString() ?? "") && (max ?? "") === (b.max?.toString() ?? "")
          return (
            <CheckRow
              key={b.label}
              checked={active}
              label={b.label}
              onClick={() => set(active ? { min: undefined, max: undefined } : { min: b.min?.toString(), max: b.max?.toString() })}
            />
          )
        })}
        {facets.price ? (
          <p className="mt-2 text-xs text-ash">
            Range in this view: {formatMoney(facets.price.min)} - {formatMoney(facets.price.max)}
          </p>
        ) : null}
      </Group>

      <Group title="Availability">
        <CheckRow
          checked={params.get("stock") === "1"}
          label="In stock only"
          count={facets.inStock}
          onClick={() => set({ stock: params.get("stock") === "1" ? undefined : "1" })}
        />
        <CheckRow
          checked={params.get("sale") === "1"}
          label="On sale"
          count={facets.onSale}
          onClick={() => set({ sale: params.get("sale") === "1" ? undefined : "1" })}
        />
      </Group>
    </div>
  )
}

export function DesktopFilters({ facets, showCategories }: { facets: FilterFacets; showCategories: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Filters">
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        <FilterBody facets={facets} showCategories={showCategories} />
      </div>
    </aside>
  )
}

export function MobileFilters({ facets, showCategories, activeCount, total }: { facets: FilterFacets; showCategories: boolean; activeCount: number; total: number }) {
  const [open, setOpen] = useState(false)
  const { clear, pending } = useFilterParams()
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 border border-ink px-4 text-xs font-semibold uppercase tracking-[0.14em] lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filter{activeCount ? ` (${activeCount})` : ""}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filter"
        side="bottom"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={clear} disabled={!activeCount}>
              Clear all
            </Button>
            <Button onClick={() => setOpen(false)} loading={pending}>
              Show {total} items
            </Button>
          </div>
        }
      >
        <div className="px-5">
          <FilterBody facets={facets} showCategories={showCategories} />
        </div>
      </Drawer>
    </>
  )
}

export function ActiveFilterChips({ chips }: { chips: { key: string; value?: string; label: string }[] }) {
  const { toggle, set, clear } = useFilterParams()
  if (!chips.length) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}:${c.value ?? ""}`}
          type="button"
          onClick={() => (c.value ? toggle(c.key, c.value) : set({ [c.key]: undefined, ...(c.key === "min" ? { max: undefined } : {}) }))}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-stone px-3 text-[13px] hover:bg-line"
        >
          {c.label} <X className="size-3.5" />
        </button>
      ))}
      <button type="button" onClick={clear} className="ml-1 text-[13px] underline underline-offset-4">
        Clear all
      </button>
    </div>
  )
}
