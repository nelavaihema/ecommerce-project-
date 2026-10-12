# 07 - Testing & QA Report

Last run: 11 October 2026, local development environment (Windows 11, Node 22,
PostgreSQL 18 portable, Medusa 2.21.2, Next.js 16.4.0).

## Automated checks

| Check | Command | Result |
|---|---|---|
| Storefront type check | `cd apps/storefront && npx tsc --noEmit` | pass |
| Storefront production build | `cd apps/storefront && npx next build` | pass (22 routes) |
| Backend type check | `cd apps/backend && npx tsc --noEmit` | pass |
| Admin extensions type check | `cd apps/backend && npx tsc --noEmit -p src/admin/tsconfig.json` | pass |
| Backend + admin production build | `cd apps/backend && npx medusa build` | admin bundle pass; backend pass after fixes |
| Customer journey (API) | `node scripts/e2e-checkout.mjs` | 14/14 pass |

`scripts/e2e-checkout.mjs` covers: region, search with in-stock filter, product + variant
pricing and stock, cart creation, add item, **out-of-stock variant rejected**, coupon,
address, shipping options, shipping method, Cash on Delivery payment session, cart
completion -> **order created**, guest order lookup, lookup with the wrong email -> 404.

## Manual browser QA (storefront)

| Flow | Result |
|---|---|
| Home: hero slider (admin banners), category chips, new arrivals, departments, best sellers, promo strip, sale rail, collections, Instagram block, footer | pass |
| Shop / category / collection listing, counts, sort | pass |
| Filters: category, size, colour, price buckets, in stock, on sale; URL-driven; active chips | pass |
| Search (header search, `/shop?q=`) incl. empty results state | pass |
| Product page: gallery, colour switch changes photos, sold-out sizes disabled, price + sale %, stock message, size guide, specs, reviews, related products, JSON-LD | pass |
| Add to bag -> cart drawer with free-shipping meter; quantity change; remove | pass |
| Buy Now -> checkout | pass |
| Checkout validation (empty form -> per-field errors; PIN / mobile format) | pass |
| Checkout as guest: address -> delivery (Rs 99 / free over Rs 1,499) -> coupon -> Cash on Delivery -> place order -> confirmation page | pass (order #1) |
| Register -> logged in; account overview empty states | pass |
| Wishlist add from product page -> wishlist page | pass |
| Write review -> "awaiting approval" | pass |
| Checkout as customer (pre-filled contact) -> order in My orders | pass (order #2) |
| Admin API: orders visible, review approved, analytics summary | pass |
| Admin dashboard: Sales overview widget on Orders, Reviews page (status tabs, approve), Banners page (list by placement, edit + save) | pass |
| Fulfil + ship with tracking number -> tracking page timeline and tracking link | pass |
| Mobile (375 px): header, hero, chips, product grid, filter bottom sheet, sticky add-to-bag bar | pass |

### Bugs found during QA and fixed

- Colour selection didn't change the gallery (Medusa returns all product images on
  variants without their own images).
- Order summary showed the post-discount subtotal and then subtracted the discount again.
- Cart drawer showed "Only 0 left" because cart items don't carry computed stock.
- Order status badge stayed "Confirmed" after shipping.
- Hero primary button rendered white-on-white; announcement bar clipped on small screens.
- Demo images containing third-party brands were replaced.

## Not covered / known limitations

- **Razorpay** was implemented against Razorpay's REST API but not exercised end-to-end:
  it needs test keys (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`). Test with Razorpay test
  mode before enabling it on the region.
- **Docker files** could not be executed on the development machine (no Docker).
- Order emails: Medusa's local notification provider only logs; connect an email provider
  (e.g. SendGrid/Resend notification module) for real confirmation emails.
- Password reset is not exposed in the storefront yet (needs an email provider first).
