import "server-only"
import { sdk } from "../sdk"

export type Banner = {
  id: string
  placement: "hero" | "promo" | "announcement"
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  image_url?: string | null
  mobile_image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  theme: "dark" | "light"
  rank: number
}

/** Admin-managed banners (Content module). Returns [] if the backend is unreachable. */
export async function listBanners(placement?: Banner["placement"]): Promise<Banner[]> {
  try {
    const { banners } = await sdk.client.fetch<{ banners: Banner[] }>("/store/content/banners", {
      method: "GET",
      query: placement ? { placement } : {},
      next: { revalidate: 60, tags: ["banners"] },
    })
    return banners
  } catch {
    return []
  }
}
