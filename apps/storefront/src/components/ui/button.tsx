import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/util/cn"
import { Spinner } from "./spinner"

type Variant = "primary" | "secondary" | "ghost" | "ember" | "link" | "inverse" | "outline-inverse"
type Size = "sm" | "md" | "lg"

const base =
  "inline-flex items-center justify-center gap-2 rounded-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 select-none"

const variants: Record<Variant, string> = {
  primary: "bg-ink text-ivory hover:bg-ink-soft",
  secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-ivory",
  ghost: "bg-transparent text-ink hover:bg-stone",
  ember: "bg-ember text-white hover:brightness-110",
  inverse: "bg-ivory text-ink hover:bg-white",
  "outline-inverse": "border border-ivory bg-transparent text-ivory hover:bg-ivory hover:text-ink",
  link: "bg-transparent px-0 text-ink underline underline-offset-4 normal-case tracking-normal font-medium hover:decoration-2",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[11px]",
  md: "h-11 px-6 text-xs",
  lg: "h-14 px-8 text-[13px]",
}

type CommonProps = {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: Omit<CommonProps, "children" | "loading">) {
  return cn(base, variants[variant], variant !== "link" && sizes[size], fullWidth && "w-full", className)
}

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  children,
  className,
  disabled,
  ...props
}: CommonProps & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  children,
  className,
  ...props
}: CommonProps & Omit<ComponentProps<typeof Link>, "children">) {
  return (
    <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {children}
    </Link>
  )
}
