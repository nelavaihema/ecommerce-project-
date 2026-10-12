import type { Metadata } from "next"
import Link from "next/link"
import { Hero, type HeroSlide } from "@/components/home/hero"
import {
  BrandStatement,
  CategoryChips,
  CollectionTiles,
  DepartmentTiles,
  InstagramSection,
  PromoBanner,
} from "@/components/home/sections"
import { UspStrip } from "@/components/layout/footer"
import { ProductRail } from "@/components/product/product-grid"
import { ButtonLink } from "@/components/ui/button"
import { EmptyState, SectionHeading } from "@/components/ui/misc"
import { brand } from "@/lib/config"
import { listCategories, listCollections } from "@/lib/data/catalog"
import { listBanners } from "@/lib/data/content"
import { searchProducts, type SearchResponse } from "@/lib/data/search"

export const metadata: Metadata = {
  title: { absolute: `${brand.name} | Menswear, Women's Wear & Gifts` },
}

const empty: SearchResponse = {
  hits: [],
  count: 0,
  facets: { categories: [], sizes: [], colors: [], inStock: 0, onSale: 0, price: null },
}

export default async function HomePage() {
  const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback)

  const [heroBanners, promoBanners, categories, collections, newArrivals, bestSellers, onSale] =
    await Promise.all([
      listBanners("hero"),
      listBanners("promo"),
      safe(listCategories(), []),
      safe(listCollections(), []),
      safe(searchProducts({ sort: "newest", pageSize: 8, inStock: true }), empty),
      safe(searchProducts({ label: "bestseller", pageSize: 8 }), empty),
      safe(searchProducts({ onSale: true, pageSize: 4, inStock: true }), empty),
    ])

  const backendDown = !categories.length && !newArrivals.hits.length

  const slides: HeroSlide[] = heroBanners
    .filter((b) => b.image_url)
    .map((b) => ({
      id: b.id,
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image_url!,
      mobileImage: b.mobile_image_url,
      ctaLabel: b.cta_label,
      ctaUrl: b.cta_url,
    }))

  const departments = categories
    .filter((c) => !c.parent_category_id)
    .map((c) => ({
      title: c.name.replace(" & Gifts", ""),
      href: `/categories/${c.handle}`,
      image: (c.metadata as Record<string, string> | null)?.image,
      subtitle: c.description,
    }))

  const chips = categories
    .filter((c) => c.parent_category_id)
    .map((c) => ({ label: c.name, href: `/categories/${c.handle}` }))

  const collectionTiles = collections.map((c) => {
    const meta = (c.metadata ?? {}) as Record<string, string>
    return { title: c.title, href: `/collections/${c.handle}`, image: meta.image, subtitle: meta.subtitle }
  })

  const instagramImages = [
    ...newArrivals.hits.map((h) => h.thumbnail),
    ...bestSellers.hits.map((h) => h.hover_image ?? h.thumbnail),
  ].filter((s): s is string => Boolean(s))

  return (
    <>
      {slides.length ? (
        <Hero slides={slides} />
      ) : (
        <section className="bg-ink py-28 text-center text-ivory">
          <h1 className="heading-display text-6xl sm:text-8xl">Your style. Your statement.</h1>
          <ButtonLink href="/shop" className="mt-8" variant="inverse" size="lg">
            Shop Now
          </ButtonLink>
        </section>
      )}

      {backendDown ? (
        <div className="container-ds">
          <EmptyState
            title="We'll be right back"
            description="Our catalogue is taking a short break. Please refresh in a minute."
          />
        </div>
      ) : null}

      {chips.length ? (
        <section className="container-ds pt-8 sm:pt-10" aria-label="Categories">
          <CategoryChips items={chips} />
        </section>
      ) : null}

      {newArrivals.hits.length ? (
        <section className="container-ds py-14 sm:py-20">
          <SectionHeading
            eyebrow="Just landed"
            title="New Arrivals"
            action={<Link href="/shop?sort=newest" className="link-underline hidden text-sm font-semibold sm:inline">View all</Link>}
          />
          <ProductRail products={newArrivals.hits} viewAllHref="/shop?sort=newest" />
        </section>
      ) : null}

      {departments.length ? (
        <section className="container-ds pb-14 sm:pb-20" aria-label="Shop by department">
          <DepartmentTiles tiles={departments} />
        </section>
      ) : null}

      {bestSellers.hits.length ? (
        <section className="container-ds pb-14 sm:pb-20">
          <SectionHeading
            eyebrow="Customer favourites"
            title="Best Sellers"
            action={<Link href="/shop?label=bestseller" className="link-underline hidden text-sm font-semibold sm:inline">View all</Link>}
          />
          <ProductRail products={bestSellers.hits} viewAllHref="/shop" />
        </section>
      ) : null}

      {promoBanners[0] ? <PromoBanner banner={promoBanners[0]} /> : null}

      {onSale.hits.length ? (
        <section className="container-ds py-14 sm:py-20">
          <SectionHeading
            eyebrow="Deals"
            title="On Sale Now"
            action={<Link href="/shop?sale=1" className="link-underline hidden text-sm font-semibold sm:inline">View all</Link>}
          />
          <ProductRail products={onSale.hits} viewAllHref="/shop?sale=1" />
        </section>
      ) : null}

      {collectionTiles.length ? (
        <section className="container-ds pb-6">
          <SectionHeading eyebrow="Curated" title="Collections" />
          <CollectionTiles tiles={collectionTiles} />
        </section>
      ) : null}

      <BrandStatement />
      <UspStrip />
      {instagramImages.length >= 3 ? <InstagramSection images={instagramImages} /> : null}
    </>
  )
}
