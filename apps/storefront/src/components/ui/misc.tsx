import type { ReactNode } from "react"
import { cn } from "@/lib/util/cn"
import { discountPercent, formatMoney } from "@/lib/util/money"

export function Badge({
  children,
  tone = "ink",
  className,
}: {
  children: ReactNode
  tone?: "ink" | "ember" | "ivory" | "success" | "muted"
  className?: string
}) {
  const tones = {
    ink: "bg-ink text-ivory",
    ember: "bg-ember text-white",
    ivory: "bg-ivory text-ink",
    success: "bg-success-soft text-success",
    muted: "bg-stone text-ink-soft",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export function Price({
  amount,
  original,
  currency = "inr",
  size = "md",
  className,
  showDiscount = true,
}: {
  amount: number | null | undefined
  original?: number | null
  currency?: string
  size?: "sm" | "md" | "lg"
  className?: string
  showDiscount?: boolean
}) {
  if (typeof amount !== "number") {
    return <span className={cn("text-ash", className)}>Price unavailable</span>
  }
  const onSale = typeof original === "number" && original > amount
  const off = discountPercent(original, amount)
  const sizes = { sm: "text-sm", md: "text-[15px]", lg: "text-2xl" }
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-semibold", sizes[size], onSale && "text-ember")}>
        {formatMoney(amount, currency)}
      </span>
      {onSale ? (
        <>
          <s className={cn("text-ash", size === "lg" ? "text-base" : "text-[13px]")}>
            {formatMoney(original, currency)}
          </s>
          {showDiscount && off > 0 ? (
            <span className={cn("font-semibold text-ember", size === "lg" ? "text-sm" : "text-xs")}>
              {off}% off
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xs bg-stone", className)} aria-hidden="true" />
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center sm:py-24",
        className
      )}
    >
      {icon ? <div className="mb-5 text-ash [&>svg]:size-10">{icon}</div> : null}
      <h2 className="heading-display text-3xl sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-md text-[15px] text-ash">{description}</p> : null}
      {action ? <div className="mt-8">{action}</div> : null}
    </div>
  )
}

export function Alert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success" | "info"
  children: ReactNode
  className?: string
}) {
  const tones = {
    error: "border-ember/30 bg-ember-soft text-ember",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-line bg-stone/60 text-ink",
  }
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-xs border px-4 py-3 text-sm", tones[tone], className)}>
      {children}
    </div>
  )
}

export function Stars({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)))
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
            <defs>
              <linearGradient id={`star-${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#star-${i}-${Math.round(fill * 100)})`}
              d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
            />
          </svg>
        )
      })}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4 sm:mb-8", className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h2 className="heading-display text-[34px] sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}
