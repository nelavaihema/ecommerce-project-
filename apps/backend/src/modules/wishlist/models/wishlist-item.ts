import { model } from "@medusajs/framework/utils"

/** A product saved by a customer. One row per (customer, product). */
const WishlistItem = model
  .define("wishlist_item", {
    id: model.id({ prefix: "wli" }).primaryKey(),
    customer_id: model.text(),
    product_id: model.text(),
    variant_id: model.text().nullable(),
  })
  .indexes([
    { on: ["customer_id"] },
    {
      on: ["customer_id", "product_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default WishlistItem
