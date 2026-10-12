"use client"

import { Star } from "lucide-react"
import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/field"
import { Alert } from "@/components/ui/misc"
import { submitReview, type FormState } from "@/lib/data/account-actions"
import { cn } from "@/lib/util/cn"

export function ReviewForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [open, setOpen] = useState(false)

  if (state?.success) {
    return <Alert tone="success">{state.success}</Alert>
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    )
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]">Your rating</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
            >
              <Star className={cn("size-7", (hover || rating) >= n ? "fill-ink text-ink" : "text-line")} />
            </button>
          ))}
        </div>
        {state?.fieldErrors?.rating ? <p className="mt-1 text-[13px] text-ember">{state.fieldErrors.rating}</p> : null}
      </fieldset>
      <Input label="Title" name="title" maxLength={120} placeholder="Sum it up" error={state?.fieldErrors?.title} />
      <Textarea label="Review" name="content" required maxLength={2000} placeholder="How was the fit, fabric and quality?" error={state?.fieldErrors?.content} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" loading={pending}>
        Submit review
      </Button>
    </form>
  )
}
