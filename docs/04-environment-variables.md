# 04 - Environment Variables

Never commit `.env` / `.env.local` (they are git-ignored). Templates live next to each app:
`apps/backend/.env.template` and `apps/storefront/.env.template`.

## Backend (`apps/backend/.env`)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` / `production` | In production the secrets below are mandatory (startup fails without them). |
| `DATABASE_URL` | yes | `postgres://postgres:postgres@localhost:5432/ds_wardrobe` | PostgreSQL 15+, **UTF-8** encoding. |
| `REDIS_URL` | prod | `redis://localhost:6379` | Enables Redis event bus, workflow engine, cache and locking. In-memory fallbacks in development. |
| `STORE_CORS` | yes | `http://localhost:8000` | Storefront origin(s), comma separated. |
| `ADMIN_CORS` | yes | `http://localhost:9000` | Admin origin(s). |
| `AUTH_CORS` | yes | `http://localhost:9000,http://localhost:8000` | Origins allowed to call `/auth`. |
| `JWT_SECRET` | yes | 64 hex chars | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `COOKIE_SECRET` | yes | 64 hex chars | as above |
| `AUTH_MFA_ENCRYPTION_KEY` | yes | 64 hex chars | as above |
| `MEDUSA_BACKEND_URL` | yes | `https://api.dswardrobe.in` | Public backend URL (admin uses it). |
| `STOREFRONT_URL` | no | `https://dswardrobe.in` | Informational. |
| `RAZORPAY_KEY_ID` | no | `rzp_test_xxx` | With the secret, registers payment provider `pp_razorpay_razorpay`. |
| `RAZORPAY_KEY_SECRET` | no | | Keep only in the secret store. |
| `RAZORPAY_WEBHOOK_SECRET` | no | | Secret set on the Razorpay webhook (`payment.authorized`, `payment.captured`, `payment.failed`). |
| `S3_BUCKET` | no | `ds-wardrobe-media` | When set, product images go to S3-compatible storage instead of local disk. |
| `S3_FILE_URL`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | with S3 | | Works with AWS S3, Cloudflare R2, DigitalOcean Spaces. |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, `DEV_TEST_CUSTOMER_*` | no | | Local convenience only (created during setup); never set in production. |

## Storefront (`apps/storefront/.env.local`)

All storefront variables are public (`NEXT_PUBLIC_*`): they are visible in the browser and
are inlined at **build time**, so rebuild after changing them.

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | yes | `http://localhost:9000` | Backend base URL. |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | yes | `pk_...` | Printed by the seed; also in Admin > Settings > Publishable API Keys. Scopes the storefront to the "DS Wardrobe Online" sales channel. |
| `NEXT_PUBLIC_BASE_URL` | yes | `https://dswardrobe.in` | Canonical URLs, sitemap, Open Graph. |
| `NEXT_PUBLIC_DEFAULT_COUNTRY` | no | `in` | Region lookup. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | `rzp_test_xxx` | Fallback public key for Razorpay Checkout (the backend also sends it per payment session). |
| `NEXT_PUBLIC_INSTAGRAM_URL` | no | `https://www.instagram.com/ds__wardrobe__/` | Footer, Instagram section, contact page. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no | `+91XXXXXXXXXX` | Shows WhatsApp links when set. |
| `NEXT_PUBLIC_MEDIA_HOST` | no | `cdn.dswardrobe.in` | Allow-lists the S3/CDN image host for `next/image`. |
