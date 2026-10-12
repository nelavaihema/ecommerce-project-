import { z } from "@medusajs/framework/zod"

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max)

export const StoreCreateReview = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: trimmed(0, 120).optional().nullable(),
    content: trimmed(10, 2000),
    author_name: trimmed(2, 80).optional(),
  })
  .strict()
export type StoreCreateReviewType = z.infer<typeof StoreCreateReview>

export const StoreListReviews = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
})
export type StoreListReviewsType = z.infer<typeof StoreListReviews>

export const AdminListReviews = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  product_id: z.string().optional(),
})
export type AdminListReviewsType = z.infer<typeof AdminListReviews>

export const AdminUpdateReview = z
  .object({ status: z.enum(["pending", "approved", "rejected"]) })
  .strict()
export type AdminUpdateReviewType = z.infer<typeof AdminUpdateReview>

export const StoreAddWishlistItem = z
  .object({
    product_id: z.string().min(1),
    variant_id: z.string().min(1).optional().nullable(),
  })
  .strict()
export type StoreAddWishlistItemType = z.infer<typeof StoreAddWishlistItem>

export const StoreOrderLookup = z
  .object({
    display_id: z.coerce.number().int().positive(),
    email: z.string().trim().toLowerCase().email(),
  })
  .strict()
export type StoreOrderLookupType = z.infer<typeof StoreOrderLookup>

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), {
    message: "Must be an absolute http(s) URL or a site path starting with /",
  })
  .transform((v) => (v === "" ? null : v))
  .optional()
  .nullable()

const BannerFields = {
  placement: z.enum(["hero", "promo", "announcement"]),
  title: trimmed(1, 160),
  subtitle: trimmed(0, 400).optional().nullable(),
  eyebrow: trimmed(0, 80).optional().nullable(),
  image_url: optionalUrl,
  mobile_image_url: optionalUrl,
  cta_label: trimmed(0, 40).optional().nullable(),
  cta_url: optionalUrl,
  theme: z.enum(["dark", "light"]),
  rank: z.coerce.number().int().min(0).max(1000),
  is_active: z.boolean(),
  starts_at: z.coerce.date().optional().nullable(),
  ends_at: z.coerce.date().optional().nullable(),
}

export const AdminCreateBanner = z
  .object({
    ...BannerFields,
    placement: BannerFields.placement.default("hero"),
    theme: BannerFields.theme.default("dark"),
    rank: BannerFields.rank.default(0),
    is_active: BannerFields.is_active.default(true),
  })
  .strict()
export type AdminCreateBannerType = z.infer<typeof AdminCreateBanner>

export const AdminUpdateBanner = z.object(BannerFields).partial().strict()
export type AdminUpdateBannerType = z.infer<typeof AdminUpdateBanner>

export const StoreListBanners = z.object({
  placement: z.enum(["hero", "promo", "announcement"]).optional(),
})
export type StoreListBannersType = z.infer<typeof StoreListBanners>
