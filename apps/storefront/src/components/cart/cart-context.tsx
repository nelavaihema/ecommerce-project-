"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

type CartUI = {
  isOpen: boolean
  open: () => void
  close: () => void
  /** Short-lived message shown at the top of the drawer, e.g. "Added to bag". */
  notice: string | null
  openWithNotice: (notice: string) => void
}

const CartUIContext = createContext<CartUI | null>(null)

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => {
    setOpen(false)
    setNotice(null)
  }, [])
  const openWithNotice = useCallback((msg: string) => {
    setNotice(msg)
    setOpen(true)
  }, [])

  const value = useMemo(
    () => ({ isOpen, open, close, notice, openWithNotice }),
    [isOpen, open, close, notice, openWithNotice]
  )
  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>
}

export function useCartUI() {
  const ctx = useContext(CartUIContext)
  if (!ctx) throw new Error("useCartUI must be used inside CartUIProvider")
  return ctx
}
