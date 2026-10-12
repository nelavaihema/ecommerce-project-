import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminCreateBanner,
  AdminListReviews,
  AdminUpdateBanner,
  AdminUpdateReview,
  StoreAddWishlistItem,
  StoreCreateReview,
  StoreListBanners,
  StoreListReviews,
  StoreOrderLookup,
} from "./validators"

const queryConfig = { defaults: [], isList: false }

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`, so
    // the route narrows it to published products in the key's sales channels.
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },

    // Reviews (store)
    {
      method: ["GET"],
      matcher: "/store/products/:id/reviews",
      middlewares: [validateAndTransformQuery(StoreListReviews, queryConfig)],
    },
    {
      method: ["POST"],
      matcher: "/store/products/:id/reviews",
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformBody(StoreCreateReview),
      ],
    },

    // Order cancellation (store, owning customer only)
    {
      method: ["POST"],
      matcher: "/store/customers/me/orders/:id/cancel",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },

    // Wishlist (store, customer only)
    {
      matcher: "/store/customers/me/wishlist*",
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/wishlist",
      middlewares: [validateAndTransformBody(StoreAddWishlistItem)],
    },

    // Order tracking without an account
    {
      method: ["POST"],
      matcher: "/store/order-lookup",
      middlewares: [validateAndTransformBody(StoreOrderLookup)],
    },

    // Content
    {
      method: ["GET"],
      matcher: "/store/content/banners",
      middlewares: [validateAndTransformQuery(StoreListBanners, queryConfig)],
    },

    // Admin: reviews moderation
    {
      method: ["GET"],
      matcher: "/admin/reviews",
      middlewares: [validateAndTransformQuery(AdminListReviews, queryConfig)],
    },
    {
      method: ["POST"],
      matcher: "/admin/reviews/:id",
      middlewares: [validateAndTransformBody(AdminUpdateReview)],
    },

    // Admin: content banners
    {
      method: ["POST"],
      matcher: "/admin/content/banners",
      middlewares: [validateAndTransformBody(AdminCreateBanner)],
    },
    {
      method: ["POST"],
      matcher: "/admin/content/banners/:id",
      middlewares: [validateAndTransformBody(AdminUpdateBanner)],
    },
  ],
})
