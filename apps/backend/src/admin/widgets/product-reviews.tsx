import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { sdk } from "../lib/sdk"

type Review = {
  id: string
  author_name: string
  rating: number
  title: string | null
  content: string
  status: "pending" | "approved" | "rejected"
}

/** Rating summary and latest reviews on the product details page. */
const ProductReviewsWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", product.id],
    queryFn: () =>
      sdk.client.fetch<{ reviews: Review[]; count: number }>("/admin/reviews", {
        query: { product_id: product.id, limit: 100 },
      }),
  })

  const reviews = data?.reviews ?? []
  const approved = reviews.filter((r) => r.status === "approved")
  const pending = reviews.filter((r) => r.status === "pending").length
  const average = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Reviews</Heading>
        <Link to="/reviews" className="txt-compact-small text-ui-fg-interactive hover:underline">
          Moderate reviews
        </Link>
      </div>
      {isLoading ? (
        <Text size="small" className="px-6 py-4 text-ui-fg-subtle">Loading...</Text>
      ) : !reviews.length ? (
        <Text size="small" className="px-6 py-4 text-ui-fg-muted">No reviews yet.</Text>
      ) : (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          <Text size="small">
            <span className="txt-compact-medium-plus">{average.toFixed(1)}</span> / 5 from {approved.length} approved review
            {approved.length === 1 ? "" : "s"}
            {pending ? ` - ${pending} awaiting moderation` : ""}
          </Text>
          {reviews.slice(0, 3).map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Text size="small" weight="plus">
                  {"★".repeat(r.rating)} {r.title ?? ""}
                </Text>
                <Text size="small" className="line-clamp-2 text-ui-fg-subtle">{r.content}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">{r.author_name}</Text>
              </div>
              <StatusBadge color={r.status === "approved" ? "green" : r.status === "pending" ? "orange" : "red"}>
                {r.status}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductReviewsWidget
