# 06 - Deployment

The backend and storefront deploy independently.

## Recommended setup

| Part | Option |
|---|---|
| Backend + admin | Any Docker host (Railway, Render, Fly.io, AWS ECS, a VPS) using `apps/backend/Dockerfile`, or Medusa Cloud |
| PostgreSQL | Managed Postgres 15+ (Neon, Supabase, RDS, Railway). UTF-8. |
| Redis | Managed Redis (Upstash, Railway, ElastiCache). Required in production. |
| Product images | S3-compatible bucket + CDN (S3, Cloudflare R2, Spaces). Set `S3_*`. |
| Storefront | Netlify, Vercel (zero config) or `apps/storefront/Dockerfile` |
| Payments | Razorpay live keys after KYC; test keys until then |

## Backend

1. Create Postgres and Redis; set all backend variables from
   [04-environment-variables.md](04-environment-variables.md) in the host's secret store
   (`NODE_ENV=production`, strong secrets, `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS` set to the
   real domains, `MEDUSA_BACKEND_URL`).
2. Build and run the image (repository root as build context):
   ```bash
   docker build -f apps/backend/Dockerfile -t ds-wardrobe-backend .
   docker run --env-file production.env -p 9000:9000 ds-wardrobe-backend
   ```
   The container runs `db:migrate` and `db:migrate:search` before starting.
3. First deploy only: create the admin user and the store data.
   ```bash
   npx medusa user -e owner@dswardrobe.in -p '<strong password>'
   npx medusa exec ./src/scripts/seed.ts   # optional: demo catalogue; skip for a clean store
   ```
   For a clean production store, create the India region, tax region, shipping options,
   sales channel and publishable key in the admin instead (or run the seed and delete the
   demo products).
4. Razorpay: add a webhook in the Razorpay dashboard to
   `https://<backend>/hooks/payment/razorpay_razorpay` for `payment.authorized`,
   `payment.captured`, `payment.failed`, with the same secret as `RAZORPAY_WEBHOOK_SECRET`.
   Then enable `pp_razorpay_razorpay` on the India region (Settings > Regions).

## Storefront

**Netlify**: import the repository. The root `netlify.toml` selects `apps/storefront` as
the base directory and builds with `npm run build`; Netlify automatically configures its
Next.js adapter for server-rendered routes and API endpoints. The Next.js config leaves
output management to Netlify during Netlify builds while retaining standalone output for
Docker. In the Netlify site settings, set the
storefront variables from [04-environment-variables.md](04-environment-variables.md),
including `NEXT_PUBLIC_MEDUSA_BACKEND_URL` (the public backend URL),
`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_BASE_URL` (the deployed storefront
URL). These public variables must be available during the build. Add the Netlify site
domain to the backend's `STORE_CORS` and `AUTH_CORS`.

**Vercel**: import the repo, set the root directory to `apps/storefront`, add the
`NEXT_PUBLIC_*` variables, deploy. Add the Vercel domain to the backend's `STORE_CORS`
and `AUTH_CORS`.

**Docker**:
```bash
cd apps/storefront
docker build \
  --build-arg NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.dswardrobe.in \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_live_xxx \
  --build-arg NEXT_PUBLIC_BASE_URL=https://dswardrobe.in \
  -t ds-wardrobe-storefront .
docker run -p 8000:8000 ds-wardrobe-storefront
```

If you serve product images from a CDN, set `NEXT_PUBLIC_MEDIA_HOST` so `next/image`
can optimise them.

## Local full stack in Docker

```bash
docker compose --profile app up -d --build
```

Note: the Docker files were written for this project but could not be executed on the
development machine (Docker is not installed there). Run the commands above once on a
machine with Docker before relying on them in CI.

## Go-live checklist

- [ ] Real product photos uploaded; demo products and demo reviews removed
- [ ] Prices, GST rate per category and shipping rates confirmed with DS Wardrobe
- [ ] Razorpay live keys + webhook; COD limits agreed
- [ ] Domain + HTTPS for storefront and backend; CORS updated
- [ ] Admin users created with strong passwords; `DEV_*` variables not set
- [ ] Policies: shipping, returns, privacy, terms pages reviewed by the business
- [ ] Analytics / Search Console added; sitemap submitted (`/sitemap.xml`)
- [ ] Database backups enabled
