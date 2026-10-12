import { model } from "@medusajs/framework/utils"

/**
 * A customer review of a product. Reviews are moderated: new reviews start as
 * `pending` and only `approved` reviews are returned by the Store API.
 */
const Review = model
  .define("product_review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    product_id: model.text(),
    customer_id: model.text().nullable(),
    author_name: model.text(),
    rating: model.number(),
    title: model.text().nullable(),
    content: model.text(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    verified_purchase: model.boolean().default(false),
  })
  .indexes([
    { on: ["product_id", "status"] },
    { on: ["customer_id"] },
    // One review per customer per product
    {
      on: ["product_id", "customer_id"],
      unique: true,
      where: "customer_id IS NOT NULL AND deleted_at IS NULL",
    },
  ])
  .checks([
    { name: "product_review_rating_range", expression: (columns) => `${columns.rating} >= 1 AND ${columns.rating} <= 5` },
  ])

export default Review
