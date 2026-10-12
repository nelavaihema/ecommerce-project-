import { ArrowUpRight } from "lucide-react"
import { Instagram } from "@/components/ui/icons"
import Image from "next/image"
import Link from "next/link"
import { buttonClasses } from "@/components/ui/button"
import type { Banner } from "@/lib/data/content"
import { config } from "@/lib/config"

export type Tile = { title: string; href: string; image?: string | null; subtitle?: string | null }

/** Large editorial department tiles (Men / Women / Accessories). */
export function DepartmentTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
      {tiles.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          className="group relative block aspect-[4/5] overflow-hidden bg-stone sm:aspect-[3/4]"
        >
          {t.image ? (
            <Image
              src={t.image}
              alt={t.title}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-105"
              priority={i === 0}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-ivory sm:p-6">
            <div>
              <h3 className="heading-display text-5xl">{t.title}</h3>
              {t.subtitle ? <p className="mt-1 text-sm text-ivory/80">{t.subtitle}</p> : null}
            </div>
            <span className="grid size-11 place-items-center rounded-full bg-ivory text-ink transition-transform group-hover:-rotate-45">
              <ArrowUpRight className="size-5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** Category chips row (sub-categories) - quick, thumb-friendly navigation on mobile. */
export function CategoryChips({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div className="-mx-4 sm:mx-0">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:flex-wrap sm:px-0">
        {items.map((c) => (
          <li key={c.href} className="shrink-0">
            <Link
              href={c.href}
              className="inline-flex h-10 items-center rounded-full border border-line bg-white px-5 text-sm font-medium hover:border-ink"
            >
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PromoBanner({ banner }: { banner: Banner }) {
  return (
    <section className="relative overflow-hidden bg-ink text-ivory">
      {banner.image_url ? (
        <Image src={banner.image_url} alt="" fill sizes="100vw" className="object-cover opacity-45" />
      ) : null}
      <div className="container-ds relative flex flex-col items-start gap-6 py-20 sm:py-28 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {banner.eyebrow ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-ivory/80">{banner.eyebrow}</p> : null}
          <h2 className="heading-display text-6xl sm:text-8xl">{banner.title}</h2>
          {banner.subtitle ? <p className="mt-4 max-w-lg text-ivory/85">{banner.subtitle}</p> : null}
        </div>
        {banner.cta_url ? (
          <Link href={banner.cta_url} className={buttonClasses({ variant: "ember", size: "lg" })}>
            {banner.cta_label || "Shop Now"}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

export function CollectionTiles({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {tiles.map((t) => (
        <Link key={t.href} href={t.href} className="group block">
          <div className="relative aspect-square overflow-hidden bg-stone">
            {t.image ? (
              <Image
                src={t.image}
                alt={t.title}
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : null}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold uppercase tracking-[0.1em]">{t.title}</h3>
              {t.subtitle ? <p className="text-[13px] text-ash">{t.subtitle}</p> : null}
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4 opacity-0 transition-opacity group-hover:opacity-100">
              View
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/**
 * Instagram community block. Uses our own lifestyle imagery and links to the
 * brand profile (we never embed or copy Instagram posts).
 */
export function InstagramSection({ images }: { images: string[] }) {
  return (
    <section className="container-ds py-16 sm:py-24">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">@ds__wardrobe__</p>
          <h2 className="heading-display text-[34px] sm:text-5xl">Styled by you</h2>
          <p className="mt-2 max-w-md text-[15px] text-ash">
            New stock reveals, behind-the-scenes and happy customers. Tag us to get featured.
          </p>
        </div>
        <a
          href={config.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "secondary" })}
        >
          <Instagram className="size-4" /> Follow on Instagram
        </a>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6">
        {images.slice(0, 6).map((src, i) => (
          <a
            key={src}
            href={config.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden bg-stone"
            aria-label="Open DS Wardrobe on Instagram"
          >
            <Image src={src} alt="" fill sizes="(min-width: 1024px) 16vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 grid place-items-center bg-ink/0 text-ivory opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100">
              <Instagram className="size-6" />
            </div>
            <span className="sr-only">Instagram image {i + 1}</span>
          </a>
        ))}
      </div>
    </section>
  )
}

export function BrandStatement() {
  return (
    <section className="container-ds py-20 text-center sm:py-28">
      <p className="eyebrow mb-6">The DS promise</p>
      <p className="mx-auto max-w-4xl font-serif text-3xl italic leading-tight sm:text-5xl">
        &ldquo;Your style is your personal brand.&rdquo;
      </p>
      <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ash">
        From heavyweight street tees to festive kurta sets, every DS piece is picked to make you look
        and feel like the best version of you. Where fashion meets purpose.
      </p>
    </section>
  )
}
