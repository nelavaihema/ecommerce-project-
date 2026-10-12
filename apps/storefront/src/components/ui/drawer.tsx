"use client"

import { X } from "lucide-react"
import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/util/cn"

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  side?: "right" | "left" | "bottom"
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Accessible slide-over panel (Esc / backdrop to close, body scroll lock, focus on open). */
export function Drawer({ open, onClose, title, side = "right", children, footer, className }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  const position = {
    right: "inset-y-0 right-0 w-full max-w-md animate-slide-in-right",
    left: "inset-y-0 left-0 w-full max-w-sm animate-[slide-in-right_0.3s_reverse]",
    bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-lg animate-slide-up",
  }[side]

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn("absolute flex flex-col bg-ivory shadow-2xl outline-none", position, className)}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 className="heading-display text-2xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid size-10 place-items-center rounded-full hover:bg-stone"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer ? <div className="shrink-0 border-t border-line bg-ivory p-5">{footer}</div> : null}
      </div>
    </div>,
    document.body
  )
}
