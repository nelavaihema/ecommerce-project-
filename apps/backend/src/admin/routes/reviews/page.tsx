import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star } from "@medusajs/icons"
import { Badge, Button, Container, Heading, StatusBadge, Table, Tabs, Text, toast, Toaster } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type ReviewStatus = "pending" | "approved" | "rejected"

type AdminReview = {
  id: string
  product_id: string
  author_name: string
  rating: number
  title: string | null
  content: string
  status: ReviewStatus
  verified_purchase: boolean
  created_at: string
  product: { id: string; title: string; handle: string; thumbnail: string | null } | null
}

const PAGE_SIZE = 20

const statusColor: Record<ReviewStatus, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
}

const ReviewsPage = () => {
  const [status, setStatus] = useState<ReviewStatus | "all">("pending")
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reviews", status, page],
    queryFn: () =>
      sdk.client.fetch<{ reviews: AdminReview[]; count: number }>("/admin/reviews", {
        query: {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          ...(status === "all" ? {} : { status }),
        },
      }),
  })

  const update = useMutation({
    mutationFn: ({ id, next }: { id: string; next: ReviewStatus }) =>
      sdk.client.fetch(`/admin/reviews/${id}`, { method: "POST", body: { status: next } }),
    onSuccess: (_, { next }) => {
      toast.success(next === "approved" ? "Review approved - now visible on the store" : `Review ${next}`)
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Review deleted")
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const reviews = data?.reviews ?? []
  const count = data?.count ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <Container className="divide-y p-0">
      <Toaster />
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Product reviews</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Approve reviews to publish them on the storefront. Only approved reviews count towards ratings.
          </Text>
        </div>
      </div>

      <div className="px-6 py-3">
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as ReviewStatus | "all")
            setPage(0)
          }}
        >
          <Tabs.List>
            <Tabs.Trigger value="pending">Pending</Tabs.Trigger>
            <Tabs.Trigger value="approved">Approved</Tabs.Trigger>
            <Tabs.Trigger value="rejected">Rejected</Tabs.Trigger>
            <Tabs.Trigger value="all">All</Tabs.Trigger>
          </Tabs.List>
        </Tabs>
      </div>

      {isError ? (
        <Text className="px-6 py-8 text-ui-fg-error">Couldn&apos;t load reviews.</Text>
      ) : isLoading ? (
        <Text className="px-6 py-8 text-ui-fg-subtle">Loading...</Text>
      ) : !reviews.length ? (
        <Text className="px-6 py-8 text-ui-fg-subtle">No {status === "all" ? "" : status} reviews.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Product</Table.HeaderCell>
              <Table.HeaderCell>Rating</Table.HeaderCell>
              <Table.HeaderCell>Review</Table.HeaderCell>
              <Table.HeaderCell>Author</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reviews.map((r) => (
              <Table.Row key={r.id} className="align-top">
                <Table.Cell>
                  {r.product ? (
                    <Link to={`/products/${r.product.id}`} className="text-ui-fg-interactive hover:underline">
                      {r.product.title}
                    </Link>
                  ) : (
                    <Text size="small">Deleted product</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <span className="txt-compact-small-plus">{"★".repeat(r.rating)}</span>
                  <span className="text-ui-fg-muted">{"★".repeat(5 - r.rating)}</span>
                </Table.Cell>
                <Table.Cell className="max-w-md whitespace-normal py-3">
                  {r.title ? <Text size="small" weight="plus">{r.title}</Text> : null}
                  <Text size="small" className="text-ui-fg-subtle">{r.content}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{r.author_name}</Text>
                  {r.verified_purchase ? <Badge size="2xsmall" color="green">Verified buyer</Badge> : null}
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <StatusBadge color={statusColor[r.status]}>{r.status}</StatusBadge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex justify-end gap-2">
                    {r.status !== "approved" ? (
                      <Button size="small" onClick={() => update.mutate({ id: r.id, next: "approved" })} isLoading={update.isPending}>
                        Approve
                      </Button>
                    ) : null}
                    {r.status !== "rejected" ? (
                      <Button size="small" variant="secondary" onClick={() => update.mutate({ id: r.id, next: "rejected" })}>
                        Reject
                      </Button>
                    ) : null}
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Delete this review permanently?")) remove.mutate(r.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            Page {page + 1} of {pageCount} ({count} reviews)
          </Text>
          <div className="flex gap-2">
            <Button size="small" variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="small" variant="secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reviews",
  icon: Star,
  rank: 10,
})

export default ReviewsPage
