"use client"

import { Heart, LayoutDashboard, LogOut, MapPin, Package, UserRound } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { logout } from "@/lib/data/account-actions"
import { cn } from "@/lib/util/cn"

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
]

export function AccountNav() {
  const pathname = usePathname()
  const [pending, start] = useTransition()
  return (
    <nav aria-label="Account" className="-mx-4 sm:mx-0">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto px-4 sm:px-0 lg:flex-col">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xs px-4 text-sm font-medium transition-colors",
                  active ? "bg-ink text-ivory" : "hover:bg-stone"
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            </li>
          )
        })}
        <li className="shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => logout())}
            className="flex h-11 w-full items-center gap-3 rounded-xs px-4 text-sm font-medium text-ash hover:bg-stone hover:text-ink"
          >
            <LogOut className="size-4" /> {pending ? "Signing out..." : "Sign out"}
          </button>
        </li>
      </ul>
    </nav>
  )
}
