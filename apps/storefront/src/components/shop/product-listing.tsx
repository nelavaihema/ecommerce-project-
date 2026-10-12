import { SearchX } from "lucide-react"
import Link from "next/link"
import { ProductGrid } from "@/components/product/product-grid"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"
import { config } from "@/lib/config"
import { listCategories } from "@/lib/data/catalog"
import { parseShopParams, searchProducts, type ShopFilters } from "@/lib/data/search"
import { formatMoney } from "@/lib/util/money"
import { ActiveFilterChips, DesktopFilters, MobileFilters } from "./filters"
import { Pagination, SortSelect } from "./sort-and-pagination"

type Props = {
  title: string
  eyebrow?: string
  description?: string | null
  searchParams: Record<string, string | string[] | undefined>
  /** Fixed scope for the page (e.g. a category tree or a collection). */
  scope?: Pick<ShopFilters, "categories" | "collection">
  breadcrumbs?: { label: string; href: string }[]
}

/** Shared listing used by /shop, /categories/[handle] and /collections/[handle]. */
export async function ProductListing({ title, eyebrow, description, searchParams, scope, breadcrumbs }: Props) {
  const fromUrl = parseShopParams(searchParams)
  // URL category filter narrows within the page scope; it never widens it.
  const scopedCategories = scope?.categories?.length
    ? fromUrl.categories?.length
      ? fromUrl.categories.filter((c) => scope.categories!.includes(c))
      : scope.categories
    : fromUrl.categories
  const filters: ShopFilters = {
    ...fromUrl,
    categories: scopedCategories,
    collection: scope?.collection ?? fromUrl.collection,
  }

  const [result, categories] = await Promise.all([
    searchProducts(filters),
    listCategories().catch(() => []),
  ])

  const nameByHandle = new Map(categories.map((c) => [c.handle, c.name]))
  const facetCategories = result.facets.categories
    .filter((c) => nameByHandle.has(c.value))
    .filter((c) => !scope?.categories || scope.categories.includes(c.value))
    .map((c) => ({ handle: c.value, label: nameByHandle.get(c.value)!, count: c.count }))

  const pageSize = config.pageSize
  const page = filters.page ?? 1
  const totalPages = Math.max(1, Math.ceil(result.count / pageSize))

  const chips = [
    ...(fromUrl.categories ?? []).map((h) => ({ key: "category", value: h, label: nameByHandle.get(h) ?? h })),
    ...(fromUrl.sizes ?? []).map((s) => ({ key: "size", value: s, label: s.replace(":", " ") })),
    ...(fromUrl.colors ?? []).map((c) => ({ key: "color", value: c.replace("Color:", ""), label: c.replace("Color:", "") })),
    ...(fromUrl.minPrice !== undefined || fromUrl.maxPrice !== undefined
      ? [{
          key: "min",
          label:
            fromUrl.maxPrice === undefined
              ? `${formatMoney(fromUrl.minPrice)}+`
              : `${formatMoney(fromUrl.minPrice ?? 0)} - ${formatMoney(fromUrl.maxPrice)}`,
        }]
      : []),
    ...(fromUrl.inStock ? [{ key: "stock", label: "In stock" }] : []),
    ...(fromUrl.onSale ? [{ key: "sale", label: "On sale" }] : []),
    ...(fromUrl.label ? [{ key: "label", label: fromUrl.label.replace("-", " ") }] : []),
  ]

  const showCategories = facetCategories.length > 1

  return (
    <div className="container-ds pb-20 pt-6 sm:pt-10">
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ash">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            {breadcrumbs.map((b) => (
              <li key={b.href} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
                <Link href={b.href} className="hover:text-ink">{b.label}</Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <header className="mb-6 sm:mb-8">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="heading-display text-5xl sm:text-7xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[15px] text-ash">{description}</p> : null}
      </header>

      <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-y border-line bg-ivory/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:border-x-0 lg:bg-transparent">
        <div className="flex items-center gap-3">
          <MobileFilters facets={{ ...result.facets, categories: facetCategories }} showCategories={showCategories} activeCount={chips.length} total={result.count} />
          <p className="text-[13px] text-ash" aria-live="polite">
            {result.count} {result.count === 1 ? "item" : "items"}
            {fromUrl.q ? <> for &ldquo;<span className="text-ink">{fromUrl.q}</span>&rdquo;</> : null}
          </p>
        </div>
        <SortSelect />
      </div>

      <div className="flex gap-10">
        <DesktopFilters facets={{ ...result.facets, categories: facetCategories }} showCategories={showCategories} />
        <div className="min-w-0 flex-1">
          {chips.length ? (
            <div className="mb-6">
              <ActiveFilterChips chips={chips} />
            </div>
          ) : null}

          {result.hits.length ? (
            <>
              <ProductGrid products={result.hits} className="xl:grid-cols-3 2xl:grid-cols-4" />
              <Pagination page={page} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={<SearchX />}
              title={fromUrl.q ? "No matches" : "Nothing here yet"}
              description={
                fromUrl.q
                  ? `We couldn't find anything for "${fromUrl.q}". Try a different word or browse our categories.`
                  : chips.length
                    ? "No products match these filters. Try removing a few."
                    : "New stock is on the way. Check back soon."
              }
              action={<ButtonLink href="/shop" variant="secondary">View all products</ButtonLink>}
            />
          )}
        </div>
      </div>
    </div>
  )
}
