"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/util/cn"

/**
 * Mobile: full-width swipeable carousel with dots.
 * Desktop: thumbnail rail + large image.
 */
export function ProductGallery({ images, title, soldOut }: { images: string[]; title: string; soldOut?: boolean }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)

  // Reset to the first image when the image set changes (e.g. colour switch)
  const key = images.join("|")
  useEffect(() => {
    setActive(0)
    trackRef.current?.scrollTo({ left: 0 })
  }, [key])

  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (!images.length) {
    return <div className="grid aspect-[3/4] place-items-center bg-stone font-display text-5xl text-ash">DS</div>
  }

  return (
    <div className="lg:flex lg:gap-4">
      {/* Thumbnails (desktop) */}
      <div className="hidden w-20 shrink-0 flex-col gap-3 lg:flex">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show image ${i + 1}`}
            aria-current={i === active}
            className={cn(
              "relative aspect-[3/4] overflow-hidden bg-stone outline-offset-2",
              i === active ? "outline outline-2 outline-ink" : "opacity-70 hover:opacity-100"
            )}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main image (desktop) */}
      <div className="relative hidden aspect-[3/4] flex-1 overflow-hidden bg-stone lg:block">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${title} - image ${active + 1}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn("animate-fade-in object-cover", soldOut && "grayscale-[40%]")}
        />
      </div>

      {/* Carousel (mobile) */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-roledescription="carousel"
        >
          {images.map((src, i) => (
            <div key={src} className="relative aspect-[3/4] w-full shrink-0 snap-center bg-stone">
              <Image
                src={src}
                alt={`${title} - image ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className={cn("object-cover", soldOut && "grayscale-[40%]")}
              />
            </div>
          ))}
        </div>
        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden="true">
            {images.map((src, i) => (
              <span key={src} className={cn("h-1.5 rounded-full bg-ink transition-all", i === active ? "w-5" : "w-1.5 opacity-30")} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
