import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductListing } from "@/components/shop/product-listing"
import { getCollectionByHandle } from "@/lib/data/catalog"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollectionByHandle(handle).catch(() => null)
  if (!collection) return { title: "Collection not found" }
  const subtitle = (collection.metadata as Record<string, string> | null)?.subtitle
  return { title: collection.title, description: subtitle || `Shop the ${collection.title} collection.` }
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ handle }, sp] = await Promise.all([params, searchParams])
  const collection = await getCollectionByHandle(handle)
  if (!collection) notFound()
  const subtitle = (collection.metadata as Record<string, string> | null)?.subtitle

  return (
    <ProductListing
      searchParams={sp}
      scope={{ collection: collection.handle }}
      eyebrow="Collection"
      title={collection.title}
      description={subtitle}
      breadcrumbs={[{ label: collection.title, href: `/collections/${collection.handle}` }]}
    />
  )
}
