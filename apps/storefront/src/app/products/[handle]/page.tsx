import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ProductRail } from "@/components/product/product-grid"
import { ProductView } from "@/components/product/product-view"
import { Reviews } from "@/components/product/reviews"
import { SizeGuideTable } from "@/components/product/size-guide"
import { SectionHeading } from "@/components/ui/misc"
import { config } from "@/lib/config"
import { getCustomer, getWishlistProductIds } from "@/lib/data/customer"
import { getProductByHandle } from "@/lib/data/products"
import { listReviews } from "@/lib/data/reviews"
import { searchProducts } from "@/lib/data/search"
import { cheapestPrice, isVariantInStock, productSpecs } from "@/lib/util/product"
import type { SizeGuideKey } from "@/lib/util/size-guides"

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle).catch(() => null)
  if (!product) return { title: "Product not found" }
  const price = cheapestPrice(product)
  return {
    title: product.title,
    description: product.description?.slice(0, 160) ?? undefined,
    alternates: { canonical: `/products/${handle}` },
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.thumbnail ? [{ url: product.thumbnail }] : undefined,
    },
    other: price ? { "product:price:amount": String(price.calculated), "product:price:currency": "INR" } : undefined,
  }
}

function Details({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex h-16 cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.14em]">
        {title}
        <span className="text-xl leading-none transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </details>
  )
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const product = await getProductByHandle(handle)
  if (!product) notFound()

  const categoryHandles = (product.categories ?? []).map((c) => c.handle)
  const [customer, wishlist, reviewData, related] = await Promise.all([
    getCustomer(),
    getWishlistProductIds(),
    listReviews(product.id),
    searchProducts({ categories: categoryHandles, pageSize: 9, inStock: true }).catch(() => null),
  ])

  const specs = productSpecs(product)
  const sizeGuide = product.metadata?.size_guide as SizeGuideKey | "none" | undefined
  const relatedHits = (related?.hits ?? []).filter((h) => h.id !== product.id).slice(0, 8)
  const category = product.categories?.[0]
  const price = cheapestPrice(product)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: (product.images ?? []).map((i) => i.url),
    sku: product.variants?.[0]?.sku ?? undefined,
    brand: { "@type": "Brand", name: "DS Wardrobe" },
    ...(reviewData?.stats.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviewData.stats.average, reviewCount: reviewData.stats.count } }
      : {}),
    offers: price
      ? {
          "@type": "Offer",
          url: `${config.baseUrl}/products/${product.handle}`,
          priceCurrency: "INR",
          price: price.calculated,
          availability: (product.variants ?? []).some(isVariantInStock)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        }
      : undefined,
  }

  return (
    <div className="container-ds pb-28 pt-4 sm:pt-8 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-ash">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          {category ? (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              <Link href={`/categories/${category.handle}`} className="hover:text-ink">{category.name}</Link>
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            <span className="text-ink" aria-current="page">{product.title}</span>
          </li>
        </ol>
      </nav>

      <ProductView
        product={product}
        saved={wishlist.includes(product.id)}
        rating={reviewData ? { average: reviewData.stats.average, count: reviewData.stats.count } : null}
      />

      <section className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12" aria-label="Product information">
        <div className="lg:col-span-7">
          <Details title="Description" open>
            <p>{product.description}</p>
          </Details>
          {specs.length ? (
            <Details title="Specifications">
              <dl className="grid grid-cols-[minmax(120px,auto)_1fr] gap-x-6 gap-y-3 text-sm">
                {specs.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-semibold text-ink">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Details>
          ) : null}
          {sizeGuide && sizeGuide !== "none" ? (
            <Details title="Size & Fit">
              <SizeGuideTable guide={sizeGuide} />
            </Details>
          ) : null}
          <Details title="Shipping & Returns">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Free standard shipping on orders above Rs 1,499; Rs 99 below that.</li>
              <li>Standard delivery in 4-7 business days, Express in 1-3 business days.</li>
              <li>Cash on Delivery available across India.</li>
              <li>Size exchange within 7 days of delivery for unworn items with tags.</li>
            </ul>
          </Details>
        </div>
      </section>

      <Reviews
        productId={product.id}
        reviews={reviewData?.reviews ?? []}
        stats={reviewData?.stats ?? null}
        loggedIn={Boolean(customer)}
        productPath={`/products/${product.handle}`}
      />

      {relatedHits.length ? (
        <section className="border-t border-line pt-14 sm:pt-20">
          <SectionHeading eyebrow="Complete the look" title="You may also like" />
          <ProductRail products={relatedHits} viewAllHref={category ? `/categories/${category.handle}` : "/shop"} />
        </section>
      ) : null}
    </div>
  )
}
