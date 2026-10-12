"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { buttonClasses } from "@/components/ui/button"
import { cn } from "@/lib/util/cn"

export type HeroSlide = {
  id: string
  eyebrow?: string | null
  title: string
  subtitle?: string | null
  image: string
  mobileImage?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  const go = useCallback((i: number) => setIndex((i + count) % count), [count])

  useEffect(() => {
    if (count < 2 || paused) return
    const id = window.setTimeout(() => go(index + 1), 6500)
    return () => window.clearTimeout(id)
  }, [index, paused, count, go])

  if (!count) return null

  return (
    <section
      className="relative h-[78svh] min-h-[520px] w-full overflow-hidden bg-ink text-ivory lg:h-[86vh]"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-hidden={i !== index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
        >
          <Image
            src={slide.mobileImage || slide.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover object-top md:hidden"
          />
          <Image
            src={slide.image}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={cn("hidden object-cover md:block", i === index && "animate-[kenburns_14s_ease-out_both]")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-ink/10 md:bg-gradient-to-r md:from-ink/75 md:via-ink/35 md:to-transparent" />

          <div className="container-ds relative flex h-full flex-col justify-end pb-16 md:justify-center md:pb-0">
            <div className={cn("max-w-xl", i === index && "animate-[rise_0.9s_cubic-bezier(0.22,1,0.36,1)_both]")}>
              {slide.eyebrow ? (
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-ivory/80">{slide.eyebrow}</p>
              ) : null}
              <h1 className="heading-display text-[56px] sm:text-7xl lg:text-[104px]">{slide.title}</h1>
              {slide.subtitle ? (
                <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ivory/85 sm:text-base">{slide.subtitle}</p>
              ) : null}
              <div className="mt-8 flex flex-wrap gap-3">
                {slide.ctaUrl ? (
                  <Link href={slide.ctaUrl} className={buttonClasses({ size: "lg", variant: "inverse" })}>
                    {slide.ctaLabel || "Shop Now"}
                  </Link>
                ) : null}
                <Link
                  href="/shop"
                  className={buttonClasses({ size: "lg", variant: "outline-inverse" })}
                >
                  Shop All
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {count > 1 ? (
        <div className="container-ds pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-between">
          <div className="pointer-events-auto flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className="group py-2"
              >
                <span className={cn("block h-[3px] rounded-full bg-ivory transition-all", i === index ? "w-10" : "w-5 opacity-40 group-hover:opacity-70")} />
              </button>
            ))}
          </div>
          <div className="pointer-events-auto hidden gap-2 md:flex">
            <button type="button" onClick={() => go(index - 1)} className="grid size-11 place-items-center rounded-full border border-ivory/40 hover:bg-ivory hover:text-ink" aria-label="Previous slide">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="grid size-11 place-items-center rounded-full border border-ivory/40 hover:bg-ivory hover:text-ink" aria-label="Next slide">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
