"use client"

import { Heart } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toggleWishlist } from "@/lib/data/account-actions"
import { cn } from "@/lib/util/cn"

export function WishlistButton({
  productId,
  initialSaved,
  className,
  withLabel = false,
}: {
  productId: string
  initialSaved: boolean
  className?: string
  withLabel?: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const onClick = () => {
    setError(null)
    const previous = saved
    setSaved(!previous) // optimistic
    start(async () => {
      const res = await toggleWishlist(productId, previous)
      if (!res.ok) {
        setSaved(previous)
        if (res.error === "login_required") {
          router.push(`/account/login?redirect=${encodeURIComponent(pathname)}&reason=wishlist`)
        } else {
          setError("Couldn't update your wishlist")
        }
      }
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-colors",
          withLabel
            ? "h-14 border border-ink px-5 text-xs font-semibold uppercase tracking-[0.14em] hover:bg-stone"
            : "size-11 rounded-full bg-ivory/90 hover:bg-ivory",
          className
        )}
      >
        <Heart className={cn("size-5", saved && "fill-ember text-ember")} />
        {withLabel ? <span className="sr-only sm:not-sr-only">{saved ? "Saved" : "Wishlist"}</span> : null}
      </button>
      {error ? <p className="absolute right-0 top-full mt-1 whitespace-nowrap text-xs text-ember">{error}</p> : null}
    </div>
  )
}
