import type { Metadata } from "next"
import { ProductListing } from "@/components/shop/product-listing"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q : undefined
  return {
    title: q ? `Search: ${q}` : sp.sale === "1" ? "Sale" : "Shop All",
    description: "Shop menswear, DS Women's Wear and gifts from DS Wardrobe. Free shipping above Rs 1,499.",
    robots: q ? { index: false } : undefined,
  }
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q : undefined
  const sale = sp.sale === "1"
  return (
    <ProductListing
      searchParams={sp}
      eyebrow={q ? "Search results" : "DS Wardrobe"}
      title={q ? `"${q}"` : sale ? "Sale" : "Shop All"}
      description={sale ? "Limited-time prices on selected styles. While stocks last." : undefined}
      breadcrumbs={[{ label: "Shop", href: "/shop" }]}
    />
  )
}
