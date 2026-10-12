import { model } from "@medusajs/framework/utils"

/**
 * Merchandising content managed from the admin (Content > Banners):
 * home hero slides, promotional strips and the announcement bar.
 */
const Banner = model
  .define("content_banner", {
    id: model.id({ prefix: "ban" }).primaryKey(),
    placement: model.enum(["hero", "promo", "announcement"]).default("hero"),
    title: model.text(),
    subtitle: model.text().nullable(),
    eyebrow: model.text().nullable(),
    image_url: model.text().nullable(),
    mobile_image_url: model.text().nullable(),
    cta_label: model.text().nullable(),
    cta_url: model.text().nullable(),
    theme: model.enum(["dark", "light"]).default("dark"),
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
  })
  .indexes([{ on: ["placement", "is_active", "rank"] }])

export default Banner
