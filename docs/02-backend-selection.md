# 02 — Commerce Backend Evaluation & Selection

Evaluated October 2026 against the live GitHub repositories (license files read directly).

| | Medusa | Vendure | Saleor | Bagisto | Spree |
|---|---|---|---|---|---|
| Repo | medusajs/medusa | vendurehq/vendure | saleor/saleor | bagisto/bagisto | spree/spree |
| Language / stack | TypeScript, Node | TypeScript, NestJS | Python, Django | PHP, Laravel | Ruby, Rails |
| API style | REST (store + admin), JS SDK | GraphQL | GraphQL | REST/GraphQL (add-on), Blade theme | REST (Storefront/Platform API) |
| License | MIT (Enterprise Edition files separately licensed) | GPLv3 **or** commercial | BSD-3-Clause | MIT | BSD-3-Clause |
| Headless-first | Yes | Yes | Yes | Mostly monolithic (headless possible) | Yes (v5 also ships a Rails storefront) |
| Admin panel | Built-in (React, extendable) | Built-in (React, extendable) | Built-in dashboard | Built-in | Built-in |
| Variants / inventory / multi-location | Yes / Yes / Yes | Yes / Yes / Yes | Yes / Yes / Yes | Yes / Yes / Yes | Yes / Yes / Yes |
| Promotions / coupons | Yes (promotion module) | Yes | Yes (vouchers) | Yes | Yes |
| Custom data (wishlist, reviews) | Custom modules + module links | Plugins / custom entities | Apps / metadata | Packages | Extensions |
| Same language as the storefront | **Yes** | Yes | No | No | No |
| Activity (pushed) | 2026-10-09 | 2026-10-09 | 2026-10-09 | 2026-10-09 | 2026-10-09 |

## Decision: **Medusa v2 (2.21.x)**

1. **One language end to end.** TypeScript in backend and Next.js storefront: shared types,
   one toolchain, easier hand-over to the next developer.
2. **Permissive license.** MIT core. Vendure's GPLv3 would impose copyleft obligations
   on our customisations unless a commercial license is purchased.
3. **Headless by design.** The Store API + `@medusajs/js-sdk` lets the storefront be fully
   decoupled and redesigned without touching commerce logic (brief §1).
4. **Covers the data model out of the box:** products, options/variants, SKUs/barcodes,
   multi-currency prices + price lists (sale prices), inventory & stock locations, categories,
   collections, customers & addresses, carts, orders, payments (provider abstraction),
   fulfilment/shipping options, promotions, sales channels, and an admin dashboard.
   Built-in search index (2.21) with facets for filtering.
5. **Extensible where the brief needs more:** Wishlist and Product Reviews are implemented as
   **custom Medusa modules** linked to `product`/`customer` via module links, with their own
   Store/Admin API routes and an admin widget — no forks of core.
6. **India payments.** Medusa's payment-provider interface lets us add **Razorpay**
   (UPI / cards / netbanking) as a custom provider module; **Cash on Delivery** uses the
   built-in system provider. Orders are only created after the payment session is authorised
   (Medusa's `completeCart` workflow enforces this).

### Trade-offs accepted

- Medusa requires PostgreSQL (and Redis in production for events/workflows/cache) — standard
  infra, included in `docker-compose.yml`.
- Reviews / wishlist aren't core — we own those two small modules.
- Some features (e.g. Medusa Cloud, Enterprise Edition) are out of scope; nothing used here
  depends on them.

### Why not the others

- **Vendure** — technically excellent and very close second; rejected on GPLv3 licensing and
  GraphQL-only API adding client complexity for a small team.
- **Saleor** — strong GraphQL platform, but Python backend means a second language and a heavier
  infra footprint.
- **Bagisto** — productive Laravel monolith, but its strengths (Blade theme) are what we
  are *not* using; PHP adds a second stack.
- **Spree** — mature and now headless-capable, but Ruby/Rails adds a second stack and fewer
  team members know it.
