import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductListing } from "@/components/shop/product-listing"
import { getCategoryByHandle, listCategories } from "@/lib/data/catalog"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const category = await getCategoryByHandle(handle).catch(() => null)
  if (!category) return { title: "Category not found" }
  return {
    title: category.name,
    description: category.description || `Shop ${category.name} at DS Wardrobe.`,
    alternates: { canonical: `/categories/${handle}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ handle }, sp] = await Promise.all([params, searchParams])
  const [category, all] = await Promise.all([getCategoryByHandle(handle), listCategories()])
  if (!category) notFound()

  // A parent category page shows products from all of its sub-categories.
  const descendants = (id: string): string[] =>
    all.filter((c) => c.parent_category_id === id).flatMap((c) => [c.handle, ...descendants(c.id)])
  const scope = [category.handle, ...descendants(category.id)]

  const parent = category.parent_category_id
    ? all.find((c) => c.id === category.parent_category_id)
    : undefined

  return (
    <ProductListing
      searchParams={sp}
      scope={{ categories: scope }}
      eyebrow={parent?.name ?? "Shop"}
      title={category.name}
      description={category.description}
      breadcrumbs={[
        ...(parent ? [{ label: parent.name, href: `/categories/${parent.handle}` }] : []),
        { label: category.name, href: `/categories/${category.handle}` },
      ]}
    />
  )
}
