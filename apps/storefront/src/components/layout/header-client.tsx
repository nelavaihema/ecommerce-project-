"use client"

import { ChevronRight, Heart, Menu, Search, ShoppingBag, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Drawer } from "@/components/ui/drawer"
import { cn } from "@/lib/util/cn"
import { useCartUI } from "../cart/cart-context"
import { Logo } from "./logo"

export type NavItem = {
  label: string
  href: string
  image?: string
  children: { label: string; href: string }[]
}

const EXTRA_LINKS = [
  { label: "New Drop", href: "/collections/new-drop" },
  { label: "Sale", href: "/shop?sale=1", accent: true },
]

const POPULAR_SEARCHES = ["Oversized tee", "Denim jacket", "Kurta set", "Co-ord", "Jeans", "Perfume"]

export function HeaderClient({
  nav,
  cartCount,
  customerName,
}: {
  nav: NavItem[]
  cartCount: number
  customerName: string | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const { open: openCart } = useCartUI()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close overlays on navigation
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
    setMegaOpen(null)
  }, [pathname])

  const iconBtn = "relative grid size-10 place-items-center rounded-full transition-colors hover:bg-stone"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/85",
        scrolled ? "border-line shadow-[0_1px_0_rgba(0,0,0,0.02)]" : "border-transparent"
      )}
      onMouseLeave={() => setMegaOpen(null)}
    >
      <div className="container-ds flex h-16 items-center gap-2 lg:h-20">
        <button type="button" className={cn(iconBtn, "-ml-2 lg:hidden")} onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu className="size-5" />
        </button>

        <Link href="/" className="mr-auto lg:mr-10" aria-label="DS Wardrobe home">
          <Logo />
        </Link>

        <nav className="hidden flex-1 items-center gap-7 lg:flex" aria-label="Main">
          {nav.map((item) => (
            <div key={item.href} onMouseEnter={() => setMegaOpen(item.children.length ? item.href : null)}>
              <Link
                href={item.href}
                className={cn(
                  "py-7 text-[13px] font-semibold uppercase tracking-[0.16em] hover:text-ash",
                  pathname.startsWith(item.href) && "underline decoration-2 underline-offset-8"
                )}
              >
                {item.label}
              </Link>
            </div>
          ))}
          {EXTRA_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onMouseEnter={() => setMegaOpen(null)}
              className={cn(
                "text-[13px] font-semibold uppercase tracking-[0.16em] hover:opacity-70",
                l.accent && "text-ember"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <button type="button" className={iconBtn} onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search className="size-5" />
          </button>
          <Link href="/account/wishlist" className={cn(iconBtn, "hidden sm:grid")} aria-label="Wishlist">
            <Heart className="size-5" />
          </Link>
          <Link href="/account" className={cn(iconBtn, "hidden sm:grid")} aria-label={customerName ? `Account (${customerName})` : "Sign in"}>
            <User className="size-5" />
            {customerName ? <span className="absolute bottom-1.5 right-1.5 size-2 rounded-full bg-success ring-2 ring-ivory" /> : null}
          </Link>
          <button type="button" className={cn(iconBtn, "-mr-2")} onClick={openCart} aria-label={`Bag, ${cartCount} items`}>
            <ShoppingBag className="size-5" />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold leading-[18px] text-ivory">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      {megaOpen ? (
        <MegaMenu item={nav.find((n) => n.href === megaOpen)!} onClose={() => setMegaOpen(null)} />
      ) : null}

      {/* Mobile menu */}
      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="left">
        <nav className="flex flex-col py-2" aria-label="Mobile">
          {nav.map((item) => (
            <details key={item.href} className="group border-b border-line">
              <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-5 text-[15px] font-semibold uppercase tracking-[0.12em]">
                {item.label}
                <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="flex flex-col pb-3">
                <Link href={item.href} className="px-8 py-2.5 text-[15px] font-medium">
                  Shop all {item.label}
                </Link>
                {item.children.map((c) => (
                  <Link key={c.href} href={c.href} className="px-8 py-2.5 text-[15px] text-ink-soft">
                    {c.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          {EXTRA_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("flex h-14 items-center border-b border-line px-5 text-[15px] font-semibold uppercase tracking-[0.12em]", l.accent && "text-ember")}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-1 px-5 text-[15px]">
            <Link href="/account" className="flex items-center gap-3 py-2.5">
              <User className="size-4" /> {customerName ? `Hi, ${customerName}` : "Sign in / Register"}
            </Link>
            <Link href="/account/wishlist" className="flex items-center gap-3 py-2.5">
              <Heart className="size-4" /> Wishlist
            </Link>
            <Link href="/track" className="flex items-center gap-3 py-2.5">
              <ShoppingBag className="size-4" /> Track your order
            </Link>
          </div>
        </nav>
      </Drawer>

      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}

function MegaMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 top-full hidden animate-fade-in border-b border-line bg-ivory lg:block">
      <div className="container-ds grid grid-cols-12 gap-8 py-10">
        <div className="col-span-3">
          <p className="eyebrow mb-4">{item.label}</p>
          <ul className="space-y-3">
            <li>
              <Link href={item.href} onClick={onClose} className="text-[15px] font-semibold hover:underline">
                Shop all
              </Link>
            </li>
            {item.children.map((c) => (
              <li key={c.href}>
                <Link href={c.href} onClick={onClose} className="text-[15px] text-ink-soft hover:text-ink hover:underline">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-3">
          <p className="eyebrow mb-4">Featured</p>
          <ul className="space-y-3 text-[15px]">
            <li><Link href="/collections/new-drop" onClick={onClose} className="hover:underline">New Drop</Link></li>
            <li><Link href="/shop?sale=1" onClick={onClose} className="text-ember hover:underline">Sale</Link></li>
            <li><Link href="/collections/festive-edit" onClick={onClose} className="hover:underline">Festive Edit</Link></li>
          </ul>
        </div>
        {item.image ? (
          <Link href={item.href} onClick={onClose} className="group relative col-span-6 h-64 overflow-hidden bg-stone">
            <Image src={item.image} alt={item.label} fill sizes="50vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            <span className="heading-display absolute bottom-5 left-6 text-4xl text-ivory">Shop {item.label}</span>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

function SearchDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get("q")?.toString().trim()
    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`)
      onClose()
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Search" side="right">
      <form onSubmit={submit} className="p-5" role="search">
        <label htmlFor="site-search" className="sr-only">
          Search products
        </label>
        <div className="flex h-14 items-center gap-3 border-b-2 border-ink">
          <Search className="size-5 shrink-0" />
          <input
            ref={inputRef}
            id="site-search"
            name="q"
            type="search"
            placeholder="Search tees, denim, kurtas..."
            className="h-full w-full bg-transparent text-lg outline-none placeholder:text-ash"
            autoComplete="off"
            maxLength={100}
          />
        </div>
      </form>
      <div className="px-5 pb-8">
        <p className="eyebrow mb-3">Popular searches</p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/shop?q=${encodeURIComponent(term)}`}
              onClick={onClose}
              className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>
    </Drawer>
  )
}
