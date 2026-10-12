import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"
import type { StoreListBannersType } from "../../../validators"

/** GET /store/content/banners?placement=hero - live merchandising banners. */
export const GET = async (
  req: MedusaRequest<unknown, StoreListBannersType>,
  res: MedusaResponse
) => {
  const { placement } = req.validatedQuery as unknown as StoreListBannersType
  const content: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const banners = await content.listLiveBanners(placement)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ banners })
}
