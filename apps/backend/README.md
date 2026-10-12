# DS Wardrobe - Medusa backend

Medusa v2 application: commerce APIs, admin dashboard (`/app`), custom modules and seed.
See the [root README](../../README.md) for setup and [docs/03-architecture.md](../../docs/03-architecture.md)
for the design.

```
src/
  modules/
    product-review/   reviews with moderation + rating stats
    wishlist/         saved products per customer
    content/          storefront banners (hero / promo / announcement)
    razorpay/         Razorpay payment provider (enabled when keys are set)
  workflows/          review, wishlist and banner workflows (with compensation)
  api/
    middlewares.ts    auth + zod validation for custom routes, store search config
    validators.ts
    store/...         reviews, wishlist, banners, order lookup
    admin/...         reviews, banners, analytics
  search/             product search index (INR prices, stock, facets)
  admin/              Reviews and Banners pages, sales and product-review widgets
  scripts/seed.ts     India store setup + demo catalogue (idempotent)
```

| Command | |
|---|---|
| `npm run dev` | develop with hot reload (http://localhost:9000) |
| `npm run db:migrate` | migrations + search index migration |
| `npm run seed` | demo data; prints the publishable API key |
| `npx medusa db:generate <productReview\|wishlist\|content>` | after changing a module model |
| `npx medusa user -e <email> -p <password>` | create an admin |
| `npm run build && npm run start` | production |
