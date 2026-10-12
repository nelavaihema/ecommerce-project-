import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../modules/content"
import type ContentModuleService from "../../../../modules/content/service"
import { createBannerWorkflow } from "../../../../workflows/content/banners"
import type { AdminCreateBannerType } from "../../../validators"

/** GET /admin/content/banners */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const content: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const banners = await content.listBanners({}, { order: { placement: "ASC", rank: "ASC" }, take: 200 })
  res.json({ banners, count: banners.length })
}

/** POST /admin/content/banners */
export const POST = async (req: MedusaRequest<AdminCreateBannerType>, res: MedusaResponse) => {
  const { result } = await createBannerWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ banner: result })
}
