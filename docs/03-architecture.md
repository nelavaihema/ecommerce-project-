# 03 - Architecture & Decisions

## System overview

```
                Browser (mobile first)
                       |
                       v
   +-------------------------------------------+
   |  Next.js storefront  (apps/storefront)     |
   |  - React Server Components render pages    |
   |  - Server Actions mutate cart / checkout   |
   |  - httpOnly cookies: cart id, customer JWT |
   +--------------------+----------------------+
                        | Store API (REST, publishable API key)
                        v
   +-------------------------------------------+       +-------------+
   |  Medusa backend + Admin  (apps/backend)    |<----->|  Razorpay   |
   |  core commerce modules   custom modules    |       |  (optional) |
   |  products, pricing,      product-review    |       +-------------+
   |  inventory, cart,        wishlist          |
   |  order, payment,         content (banners) |
   |  fulfillment, promotion, razorpay provider |
   |  customer, search        workflows + API   |
   +--------+-------------------------+--------+
            |                         |
       PostgreSQL               Redis (prod: events,
   (data + search index)        workflows, cache, locks)
```

## Key decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Medusa v2** as the commerce backend | TypeScript end to end, MIT licence, headless, covers the full commerce data model. See [02](02-backend-selection.md). |
| 2 | **Storefront is an independent package** (own `package-lock.json`, not an npm workspace) | Admin needs React 18, storefront uses React 19; separating them avoids hoisting conflicts and lets the storefront deploy on its own (e.g. Vercel). It talks to the backend only over HTTP. |
| 3 | **Server-side data layer** (`src/lib/data/*`, `server-only`) | The browser never sees the customer JWT (httpOnly cookie). Server Actions validate input with zod before calling Medusa. |
| 4 | **All listings use the search index** (`/store/search`) | One source for shop, category, collection, home rails and wishlist cards: fast faceted filters (category, size, colour, price, stock, sale) with counts, sort and pagination, computed in Postgres. |
| 5 | **Custom domain modules** for reviews, wishlist, banners | Medusa has no reviews/wishlist/CMS; each is an isolated module with its own tables and migrations, mutated only through workflows with compensation, exposed through validated routes. |
| 6 | **India-first configuration** | Single India region in INR with tax-inclusive prices (MRP style) and a GST tax region; Cash on Delivery; free shipping over Rs 1,499 via shipping price rules; Indian address/PIN/mobile validation. |
| 7 | **Payment safety** | Orders are created only by Medusa's `completeCart`, which authorises the payment session first. Razorpay authorisation checks the payment server-to-server with the Razorpay API, never trusting the browser; webhooks are signature-verified. |
| 8 | **Stock correctness** | Inventory is managed per variant. Out-of-stock sizes are disabled on the product page, the cart API rejects quantities above stock, and the search index carries `in_stock` (re-indexed on inventory and reservation events). |
| 9 | **Merchandising from the admin** | Hero slides, promo strip and announcement bar are records in the content module, managed on the admin Banners page. Categories and collections carry images in metadata. Nothing in the storefront hard-codes products. |
| 10 | **Graceful degradation** | Every data call has a fallback: the header renders without a cart, the home page shows a friendly message if the catalogue is down, each route has loading skeletons, an error boundary and empty states. |

## Storefront request flow (add to bag)

1. Product page (server component) fetches the product with region prices and stock.
2. `ProductView` (client) tracks the selected size/colour, resolves the variant and its
   price, stock and images.
3. "Add to Bag" calls the `addToCart` Server Action -> creates the cart if needed (cookie),
   adds the line item through the Store API -> `refresh()` re-renders the header and
   cart drawer with the new cart.

## Cart persistence for logged-in customers

On cart creation and on login the cart id is stored in `customer.metadata.cart_id`.
Logging in on a new device restores that cart; logging in with a guest cart transfers
the guest cart to the customer. After checkout the reference is cleared.

## Custom backend surface

| Route | Purpose |
|---|---|
| `GET/POST /store/products/:id/reviews` | approved reviews + rating stats / submit review (customer auth, moderated) |
| `GET/POST /store/customers/me/wishlist`, `DELETE .../:product_id` | wishlist (customer auth) |
| `POST /store/customers/me/orders/:id/cancel` | cancel the authenticated customer's order before fulfillment; captured payments are refunded |
| `GET /store/content/banners?placement=` | live banners (respects schedule) |
| `POST /store/order-lookup` | guest tracking: order number + email must both match |
| `GET /admin/reviews`, `POST/DELETE /admin/reviews/:id` | moderation |
| `GET/POST /admin/content/banners`, `GET/POST/DELETE .../:id` | banner management |
| `GET /admin/analytics/summary?days=` | sales overview widget |
| `POST /hooks/payment/razorpay_razorpay` | Razorpay webhooks (built-in Medusa webhook route) |

## Data model additions

- `product_review` (product_id, customer_id, author_name, rating 1-5 check constraint,
  title, content, status pending/approved/rejected, verified_purchase; one review per
  customer per product)
- `wishlist_item` (customer_id, product_id, variant_id; unique per customer + product)
- `content_banner` (placement hero/promo/announcement, copy, images, CTA, theme, rank,
  is_active, starts_at/ends_at)
