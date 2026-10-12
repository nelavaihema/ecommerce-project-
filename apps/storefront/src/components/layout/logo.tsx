import { cn } from "@/lib/util/cn"

/**
 * DS Wardrobe monogram: serif "DS" on an ink-brush mark, echoing the brand's
 * Instagram identity. Pure SVG so it stays crisp and themeable.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.6 18.4c4.8-7.9 15.6-12.6 26.3-11.5 9.3.9 18.4 6.3 21.5 14.9 2.4 6.6.6 13.7-2.7 19.6-3.7 6.6-9.9 12.7-17.7 14.1-8.3 1.5-17.4-1.9-22.8-8.3C7.6 40.8 4.7 32 6 24.5c.4-2.2 1.3-4.2 2.6-6.1zm-3.2 9.3c-.9 1.6-1.8 2.7-1.4 3.6.5 1 1.5-.3 2.1-1.3zM57.9 38c1.4-.6 2.4-1.7 2.1-2.6-.3-.8-1.5.1-2.4 1z"
      />
      <text
        x="32"
        y="41.5"
        textAnchor="middle"
        fontFamily="var(--font-cormorant), Georgia, serif"
        fontSize="27"
        fontWeight="700"
        fill="var(--color-ivory)"
        letterSpacing="-1"
      >
        DS
      </text>
    </svg>
  )
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", inverted ? "text-ivory" : "text-ink", className)}>
      <LogoMark className={cn("size-9 sm:size-10", inverted && "[&_text]:fill-ink")} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[22px] tracking-[0.12em] sm:text-[26px]">DS WARDROBE</span>
        <span className="hidden font-serif text-[11px] italic tracking-wide opacity-70 sm:block">
          where fashion meets purpose
        </span>
      </span>
    </span>
  )
}
