"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@/lib/util/cn"

const SORTS = [
  { value: "", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
]

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()

  return (
    <label className="relative inline-flex items-center gap-2 text-[13px]">
      <span className="hidden text-ash sm:inline">Sort</span>
      <select
        value={params.get("sort") ?? ""}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString())
          if (e.target.value) next.set("sort", e.target.value)
          else next.delete("sort")
          next.delete("page")
          start(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }))
        }}
        className="h-10 appearance-none border border-line bg-white pl-3 pr-9 text-[13px] font-medium focus:border-ink focus:outline-none"
        aria-label="Sort products"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-3 size-3.5 rotate-90" />
    </label>
  )
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname()
  const params = useSearchParams()
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const next = new URLSearchParams(params.toString())
    if (p <= 1) next.delete("page")
    else next.set("page", String(p))
    const qs = next.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  )

  const cell = "grid h-10 min-w-10 place-items-center border px-3 text-sm font-medium"
  return (
    <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(cell, "border-line hover:border-ink")} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 ? <span className="text-ash">...</span> : null}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(cell, p === page ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(cell, "border-line hover:border-ink")} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  )
}
