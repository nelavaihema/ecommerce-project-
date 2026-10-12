import { Skeleton } from "@/components/ui/misc"

export default function ProductLoading() {
  return (
    <div className="container-ds pb-16 pt-8" aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <Skeleton className="aspect-[3/4] lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <div className="flex gap-2 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-14" />
            ))}
          </div>
          <Skeleton className="mt-6 h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  )
}
