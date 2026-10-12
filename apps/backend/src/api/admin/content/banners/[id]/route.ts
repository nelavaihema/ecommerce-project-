import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../../../modules/content"
import type ContentModuleService from "../../../../../modules/content/service"
import { deleteBannerWorkflow, updateBannerWorkflow } from "../../../../../workflows/content/banners"
import type { AdminUpdateBannerType } from "../../../../validators"

/** GET /admin/content/banners/:id */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const content: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const banner = await content.retrieveBanner(req.params.id)
  res.json({ banner })
}

/** POST /admin/content/banners/:id */
export const POST = async (req: MedusaRequest<AdminUpdateBannerType>, res: MedusaResponse) => {
  const { result } = await updateBannerWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json({ banner: result })
}

/** DELETE /admin/content/banners/:id */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteBannerWorkflow(req.scope).run({ input: req.params.id })
  res.json({ id: req.params.id, object: "banner", deleted: true })
}
