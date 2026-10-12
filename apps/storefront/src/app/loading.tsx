import { ProductGridSkeleton } from "@/components/product/product-grid"
import { Skeleton } from "@/components/ui/misc"

export default function Loading() {
  return (
    <div className="container-ds py-10" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-10 h-12 w-64" />
      <ProductGridSkeleton count={8} />
    </div>
  )
}
