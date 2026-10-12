import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteReviewWorkflow } from "../../../../workflows/reviews/delete-review"
import { updateReviewStatusWorkflow } from "../../../../workflows/reviews/update-review-status"
import type { AdminUpdateReviewType } from "../../../validators"

/** POST /admin/reviews/:id - approve / reject / reset a review. */
export const POST = async (req: MedusaRequest<AdminUpdateReviewType>, res: MedusaResponse) => {
  const { result } = await updateReviewStatusWorkflow(req.scope).run({
    input: { id: req.params.id, status: req.validatedBody.status },
  })
  res.json({ review: result })
}

/** DELETE /admin/reviews/:id */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteReviewWorkflow(req.scope).run({ input: req.params.id })
  res.json({ id: req.params.id, object: "review", deleted: true })
}
