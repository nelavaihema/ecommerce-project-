import type { Metadata } from "next"
import { TrackOrderForm } from "@/components/account/track-order-form"

export const metadata: Metadata = {
  title: "Track your order",
  description: "Track your DS Wardrobe order with your order number and email.",
}

type Props = { searchParams: Promise<{ order?: string }> }

export default async function TrackPage({ searchParams }: Props) {
  const { order } = await searchParams
  return (
    <div className="container-ds max-w-2xl pb-20 pt-10 sm:pt-16">
      <p className="eyebrow mb-2 text-center">Order status</p>
      <h1 className="heading-display mb-3 text-center text-5xl sm:text-6xl">Track your order</h1>
      <p className="mb-10 text-center text-[15px] text-ash">
        Enter your order number (from your confirmation) and the email you used at checkout.
      </p>
      <TrackOrderForm defaultOrder={order?.replace(/\D/g, "")} />
    </div>
  )
}
