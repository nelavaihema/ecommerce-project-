import { Skeleton } from "@/components/ui/misc"

export default function CheckoutLoading() {
  return (
    <div className="container-ds pb-20 pt-6 sm:pt-10" aria-busy="true" aria-label="Loading checkout">
      <Skeleton className="mb-8 h-14 w-56" />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3 border-b border-line pb-6">
              <Skeleton className="h-6 w-48" />
              {i === 0 ? <Skeleton className="h-64 w-full" /> : null}
            </div>
          ))}
        </div>
        <Skeleton className="h-96 lg:col-span-5" />
      </div>
    </div>
  )
}
