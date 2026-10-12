import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import type ContentModuleService from "../../modules/content/service"

export type BannerInput = {
  placement?: "hero" | "promo" | "announcement"
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  image_url?: string | null
  mobile_image_url?: string | null
  cta_label?: string | null
  cta_url?: string | null
  theme?: "dark" | "light"
  rank?: number
  is_active?: boolean
  starts_at?: Date | null
  ends_at?: Date | null
}

const createBannerStep = createStep(
  "create-banner",
  async (input: BannerInput, { container }) => {
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    const banner = await content.createBanners(input)
    return new StepResponse(banner, banner.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    await content.deleteBanners(id)
  }
)

export const createBannerWorkflow = createWorkflow("create-banner", (input: BannerInput) => {
  return new WorkflowResponse(createBannerStep(input))
})

const updateBannerStep = createStep(
  "update-banner",
  async (input: Partial<BannerInput> & { id: string }, { container }) => {
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    const previous = await content.retrieveBanner(input.id)
    const banner = await content.updateBanners(input)
    return new StepResponse(banner, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    const { created_at, updated_at, deleted_at, ...restorable } = previous as any
    await content.updateBanners(restorable)
  }
)

export const updateBannerWorkflow = createWorkflow(
  "update-banner",
  (input: Partial<BannerInput> & { id: string }) => {
    return new WorkflowResponse(updateBannerStep(input))
  }
)

const deleteBannerStep = createStep(
  "delete-banner",
  async (id: string, { container }) => {
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    await content.softDeleteBanners(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const content: ContentModuleService = container.resolve(CONTENT_MODULE)
    await content.restoreBanners(id)
  }
)

export const deleteBannerWorkflow = createWorkflow("delete-banner", (id: string) => {
  return new WorkflowResponse(deleteBannerStep(id))
})
