import { MedusaService } from "@medusajs/framework/utils"
import Banner from "./models/banner"

class ContentModuleService extends MedusaService({ Banner }) {
  /** Active banners for the storefront, honouring the optional schedule window. */
  async listLiveBanners(placement?: "hero" | "promo" | "announcement") {
    const banners = await this.listBanners(
      { is_active: true, ...(placement ? { placement } : {}) },
      { order: { rank: "ASC" }, take: 50 }
    )
    const now = Date.now()
    return banners.filter((b) => {
      const startsOk = !b.starts_at || new Date(b.starts_at).getTime() <= now
      const endsOk = !b.ends_at || new Date(b.ends_at).getTime() > now
      return startsOk && endsOk
    })
  }
}

export default ContentModuleService
