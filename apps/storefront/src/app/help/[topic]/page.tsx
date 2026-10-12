import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SizeGuideTable } from "@/components/product/size-guide"
import { Instagram } from "@/components/ui/icons"
import { config } from "@/lib/config"

const TOPICS = {
  shipping: { title: "Shipping & Delivery" },
  returns: { title: "Returns & Exchanges" },
  "size-guide": { title: "Size Guide" },
  contact: { title: "Contact Us" },
} as const

type Topic = keyof typeof TOPICS
type Props = { params: Promise<{ topic: string }> }

export function generateStaticParams() {
  return Object.keys(TOPICS).map((topic) => ({ topic }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params
  const t = TOPICS[topic as Topic]
  return t ? { title: t.title } : { title: "Help" }
}

function Body({ topic }: { topic: Topic }) {
  switch (topic) {
    case "shipping":
      return (
        <>
          <p>We ship across India from our warehouse.</p>
          <ul>
            <li><strong>Standard delivery</strong> - 4 to 7 business days. Rs 99, free on orders above Rs 1,499.</li>
            <li><strong>Express delivery</strong> - 1 to 3 business days. Rs 199.</li>
            <li><strong>Cash on Delivery</strong> is available on all orders.</li>
          </ul>
          <p>Once your order ships you can follow it on the <Link href="/track">order tracking page</Link> using your order number and email.</p>
        </>
      )
    case "returns":
      return (
        <>
          <p>Wrong size? No stress. You can request a size exchange within 7 days of delivery.</p>
          <ul>
            <li>Items must be unworn, unwashed and have all original tags attached.</li>
            <li>Fragrances and items marked final sale cannot be exchanged for hygiene reasons.</li>
            <li>To start an exchange, message us on Instagram or WhatsApp with your order number.</li>
          </ul>
        </>
      )
    case "size-guide":
      return (
        <div className="not-prose space-y-10">
          <SizeGuideTable guide="tops" />
          <SizeGuideTable guide="bottoms" />
          <SizeGuideTable guide="dresses" />
        </div>
      )
    case "contact":
      return (
        <>
          <p>We&apos;re happiest on Instagram - DM us for orders, sizing help or anything else.</p>
          <p>
            <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
              <Instagram className="size-4" /> @ds__wardrobe__
            </a>
          </p>
          {config.whatsappNumber ? (
            <p>
              WhatsApp: <a href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, "")}`}>{config.whatsappNumber}</a>
            </p>
          ) : null}
        </>
      )
  }
}

export default async function HelpPage({ params }: Props) {
  const { topic } = await params
  if (!(topic in TOPICS)) notFound()
  const t = TOPICS[topic as Topic]
  return (
    <div className="container-ds max-w-3xl pb-20 pt-10 sm:pt-16">
      <p className="eyebrow mb-2">Help</p>
      <h1 className="heading-display mb-8 text-5xl sm:text-6xl">{t.title}</h1>
      <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-2">
        <Body topic={topic as Topic} />
      </div>
      <nav className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6" aria-label="Help topics">
        {(Object.keys(TOPICS) as Topic[]).map((k) => (
          <Link key={k} href={`/help/${k}`} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
            {TOPICS[k].title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
