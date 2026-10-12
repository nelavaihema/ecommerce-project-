# DS Wardrobe

E-commerce store for **DS Wardrobe** (menswear, DS Women's Wear, fragrances and gifts),
built on an open-source commerce backend with a custom, mobile-first storefront.

| | |
|---|---|
| Storefront | Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS 4) - `apps/storefront` |
| Commerce backend + admin | Medusa v2.21 (TypeScript, Node 22) - `apps/backend` |
| Database / cache | PostgreSQL (required), Redis (production) |
| Payments | Cash on Delivery (built in) + Razorpay (UPI, cards, netbanking) |
| Search | Medusa Search Module on PostgreSQL full-text search (facets, typo tolerance) |

```
Instagram / Google -> Home -> Shop / Category -> Filters, search, sort -> Product
  -> size / colour / qty -> Bag -> Guest or account checkout -> Address -> Delivery
  -> Payment -> Order confirmation -> Order tracking / Account
```

## Quick start (local development)

> New to the project? Follow the step-by-step [SETUP.md](SETUP.md) guide.

Prerequisites: **Node.js 22+**, npm, Git. Docker is optional.

```bash
# 1. Install everything (backend workspace + storefront)
npm install

# 2. Start PostgreSQL - pick ONE
docker compose up -d          # PostgreSQL + Redis in Docker
npm run db                    # or: portable PostgreSQL, no Docker needed (keep this terminal open)

# 3. Configure the backend
cp apps/backend/.env.template apps/backend/.env
#    then set JWT_SECRET, COOKIE_SECRET and AUTH_MFA_ENCRYPTION_KEY (see the template for a generator)

# 4. Create the schema and the demo catalogue
cd apps/backend
npm run db:migrate            # Medusa migrations + search index
npm run seed                  # prints the publishable API key at the end
npx medusa user -e you@example.com -p 'a-strong-password'   # admin login
cd ../..

# 5. Configure the storefront
cp apps/storefront/.env.template apps/storefront/.env.local
#    set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY to the key printed by the seed

# 6. Run both apps
npm run dev
```

| URL | What |
|---|---|
| http://localhost:8000 | Storefront |
| http://localhost:9000/app | Admin dashboard (products, prices, stock, orders, customers, promotions, **Reviews**, **Banners**) |
| http://localhost:9000/store/... | Store API used by the storefront |

Verify the whole purchase flow against the running backend:

```bash
node scripts/e2e-checkout.mjs
```

Demo coupons: `WELCOME10` (10% off), `DSFEST200` (Rs 200 off).

## Repository layout

```
apps/
  backend/            Medusa application (@dtc/backend)
    medusa-config.ts  modules, payment providers, Redis/S3 switches
    src/modules/      custom modules: product-review, wishlist, content (banners), razorpay
    src/workflows/    business logic for the custom modules (with compensation)
    src/api/          custom Store + Admin API routes and validation middleware
    src/search/       product search index definition (facets, INR prices, stock)
    src/admin/        admin dashboard pages and widgets
    src/scripts/      seed (India region, catalogue, coupons, banners)
  storefront/         Next.js storefront (@ds/storefront, independent package)
    src/app/          routes (home, shop, categories, collections, products, cart,
                      checkout, account, track, help)
    src/components/   UI, layout, product, shop, cart, checkout, account, home
    src/lib/data/     server-only data layer + Server Actions (cart, checkout, auth)
docs/                 design analysis, backend selection, architecture, env, deployment, testing
scripts/              end-to-end checkout smoke test
tools/dev-db/         portable PostgreSQL for machines without Docker
```

## Documentation

1. [Brand & design analysis](docs/01-design-analysis.md)
2. [Backend evaluation & selection](docs/02-backend-selection.md)
3. [Architecture & decisions](docs/03-architecture.md)
4. [Environment variables](docs/04-environment-variables.md)
5. [Content, images & admin guide](docs/05-content-and-images.md)
6. [Deployment](docs/06-deployment.md)
7. [Testing & QA report](docs/07-testing.md)

## Common commands

| Command (repo root) | |
|---|---|
| `npm run dev` | backend + storefront with hot reload |
| `npm run backend:dev` / `npm run storefront:dev` | one app only |
| `npm run build` | production build of both apps |
| `npm run db` | portable PostgreSQL (no Docker) |
| `node scripts/e2e-checkout.mjs` | customer-journey smoke test |

| Command (`apps/backend`) | |
|---|---|
| `npm run db:migrate` | run migrations and build search indexes |
| `npm run seed` | idempotent demo seed |
| `npx medusa db:generate <module>` | migration after changing a custom module model |
| `npx medusa user -e <email> -p <password>` | create an admin user |

## Troubleshooting

- **`Failed to load native binding` / `ERR_SWC_NATIVE_CACHE` (Windows)** - `@swc/core`
  1.16.12+ refuses to start when its cache folder is writable by another Windows account.
  The repo pins `@swc/core@1.16.2` via `overrides`; run `npm install` again if you see it.
- **Rs symbol or Hindi text garbled in the database** - the database must be UTF-8.
  `docker compose` and `npm run db` both create it as UTF-8.
- **Storefront shows "We'll be right back"** - the backend is not reachable or
  `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` is wrong.
- **Products missing from search right after seeding** - the search index fills when the
  backend starts; start `npm run dev` and wait for `[Search] Seeding "product"` in the log.
