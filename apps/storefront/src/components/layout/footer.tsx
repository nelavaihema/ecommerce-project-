import { MessageCircle, RotateCcw, ShieldCheck, Truck, Wallet } from "lucide-react"
import { Instagram } from "@/components/ui/icons"
import Link from "next/link"
import { brand, config } from "@/lib/config"
import { Logo } from "./logo"

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Men", href: "/categories/men" },
      { label: "Women", href: "/categories/women" },
      { label: "Accessories & Gifts", href: "/categories/accessories" },
      { label: "New Drop", href: "/collections/new-drop" },
      { label: "Sale", href: "/shop?sale=1" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Track your order", href: "/track" },
      { label: "Shipping & delivery", href: "/help/shipping" },
      { label: "Returns & exchanges", href: "/help/returns" },
      { label: "Size guide", href: "/help/size-guide" },
      { label: "Contact us", href: "/help/contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in / Register", href: "/account" },
      { label: "My orders", href: "/account/orders" },
      { label: "Wishlist", href: "/account/wishlist" },
      { label: "Addresses", href: "/account/addresses" },
    ],
  },
]

const USPS = [
  { icon: Truck, title: "Free shipping", text: "On orders above Rs 1,499" },
  { icon: Wallet, title: "Cash on Delivery", text: "Pay when it arrives" },
  { icon: RotateCcw, title: "Easy exchanges", text: "7-day size exchange" },
  { icon: ShieldCheck, title: "Secure payments", text: "UPI, cards, netbanking" },
]

export function UspStrip() {
  return (
    <section className="border-y border-line bg-ivory" aria-label="Why shop with us">
      <div className="container-ds grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
        {USPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <Icon className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em]">{title}</p>
              <p className="mt-0.5 text-[13px] text-ash">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function Footer() {
  const whatsapp = config.whatsappNumber.replace(/\D/g, "")
  return (
    <footer className="bg-ink text-ivory">
      <div className="container-ds grid gap-12 py-14 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo inverted />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/70">
            {brand.tagline}. Menswear, DS Women&apos;s Wear and gifts, shipped across India.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={config.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-10 place-items-center rounded-full border border-ivory/20 hover:bg-ivory hover:text-ink"
              aria-label="DS Wardrobe on Instagram"
            >
              <Instagram className="size-4" />
            </a>
            {whatsapp ? (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid size-10 place-items-center rounded-full border border-ivory/20 hover:bg-ivory hover:text-ink"
                aria-label="Chat on WhatsApp"
              >
                <MessageCircle className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ivory/50">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ivory/85 hover:text-ivory hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-ds flex flex-col gap-2 py-6 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <p>Prices inclusive of GST. Made with care in India.</p>
        </div>
      </div>
    </footer>
  )
}
