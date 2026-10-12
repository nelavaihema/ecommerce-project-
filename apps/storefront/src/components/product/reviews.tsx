import { BadgeCheck } from "lucide-react"
import Link from "next/link"
import { Stars } from "@/components/ui/misc"
import type { Review, ReviewStats } from "@/lib/data/reviews"
import { ReviewForm } from "./review-form"

export function Reviews({
  productId,
  reviews,
  stats,
  loggedIn,
  productPath,
}: {
  productId: string
  reviews: Review[]
  stats: ReviewStats | null
  loggedIn: boolean
  productPath: string
}) {
  const count = stats?.count ?? 0
  return (
    <section id="reviews" className="scroll-mt-28 border-t border-line py-14 sm:py-20" aria-labelledby="reviews-title">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="reviews-title" className="heading-display text-4xl sm:text-5xl">Reviews</h2>
          {count ? (
            <div className="mt-5">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-semibold leading-none">{stats!.average.toFixed(1)}</span>
                <div>
                  <Stars rating={stats!.average} size={18} />
                  <p className="mt-1 text-[13px] text-ash">Based on {count} review{count === 1 ? "" : "s"}</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const c = stats!.distribution[String(n) as "1"] ?? 0
                  const pct = count ? Math.round((c / count) * 100) : 0
                  return (
                    <li key={n} className="flex items-center gap-3 text-[13px]">
                      <span className="w-3">{n}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone">
                        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-ash">{c}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-[15px] text-ash">No reviews yet. Be the first to share how it fits.</p>
          )}

          <div className="mt-8">
            {loggedIn ? (
              <ReviewForm productId={productId} />
            ) : (
              <p className="text-sm">
                <Link href={`/account/login?redirect=${encodeURIComponent(productPath + "#reviews")}`} className="link-underline font-semibold">
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8">
          {reviews.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {reviews.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars rating={r.rating} />
                    {r.title ? <p className="font-semibold">{r.title}</p> : null}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{r.content}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ash">
                    <span className="font-medium text-ink">{r.author_name}</span>
                    {r.verified_purchase ? (
                      <span className="inline-flex items-center gap-1 text-success">
                        <BadgeCheck className="size-4" /> Verified buyer
                      </span>
                    ) : null}
                    <time dateTime={r.created_at}>
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </time>
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
