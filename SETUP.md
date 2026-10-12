# DS Wardrobe - Setup Guide

Step-by-step instructions to run the DS Wardrobe store on your own computer
(Windows, macOS or Linux). Takes about 15-20 minutes the first time.

You will end up with:

- **Storefront** (the shop customers see): http://localhost:8000
- **Admin dashboard** (products, orders, stock...): http://localhost:9000/app

---

## 1. Install the prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | **22 or newer** (LTS) | https://nodejs.org |
| Git | any recent | https://git-scm.com |
| Docker Desktop | optional | https://www.docker.com/products/docker-desktop |

Check them in a terminal:

```bash
node -v      # should print v22.x or higher
npm -v
git --version
```

> Windows: use **Git Bash** or **PowerShell**. All commands below work in both unless noted.

---

## 2. Get the code

```bash
git clone https://github.com/mahesh-codes-765/ds-wardrobe-store.git ds-wardrobe
cd ds-wardrobe
npm install
```

`npm install` installs the backend and then the storefront automatically (takes a few minutes).

---

## 3. Start the database (PostgreSQL)

Pick **one** option.

**Option A - Docker** (if you have Docker Desktop running):

```bash
docker compose up -d
```

**Option B - No Docker** (portable PostgreSQL, downloads automatically):

```bash
npm run db
```

Keep this terminal open - the database runs while it is open. Open a **new terminal**
(in the same `ds-wardrobe` folder) for the next steps.

Both options create a database called `ds_wardrobe` on `localhost:5432`
(user `postgres`, password `postgres` - local development only).

---

## 4. Configure the backend

Copy the example settings file:

```bash
cp apps/backend/.env.template apps/backend/.env
```

(PowerShell: `Copy-Item apps/backend/.env.template apps/backend/.env`)

Generate three random secrets - run this **three times** and copy each output:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Open `apps/backend/.env` in an editor and paste them:

```
JWT_SECRET=<first value>
COOKIE_SECRET=<second value>
AUTH_MFA_ENCRYPTION_KEY=<third value>
```

Leave everything else as it is.

---

## 5. Create the database tables and demo data

```bash
cd apps/backend
npm run db:migrate
npm run seed
```

At the end of the seed you will see a line like:

```
Publishable API key (set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY): pk_0123abcd...
```

**Copy that `pk_...` value** - you need it in step 7.

The seed adds: India store (INR, GST-inclusive prices), Cash on Delivery, shipping
options, 28 demo products with sizes/colours/stock, categories, collections, coupons,
home page banners and sample reviews.

---

## 6. Create your admin login

Still inside `apps/backend`:

```bash
npx medusa user -e admin@example.com -p "ChooseAStrongPassword123"
```

Use your own email and password - you will log in to the admin with them.

Go back to the project folder:

```bash
cd ../..
```

---

## 7. Configure the storefront

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
```

(PowerShell: `Copy-Item apps/storefront/.env.template apps/storefront/.env.local`)

Open `apps/storefront/.env.local` and replace `pk_replace_me` with the key from step 5:

```
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_0123abcd...
```

---

## 8. Run the store

From the project folder:

```bash
npm run dev
```

Wait until you see both `Server is ready on port: 9000` and `Ready` for Next.js
(the first start can take 1-2 minutes). Then open:

- http://localhost:8000 - the shop
- http://localhost:9000/app - the admin (log in with the user from step 6;
  the very first admin load can take a minute while it compiles)

---

## 9. Check that everything works

In a new terminal (with `npm run dev` still running):

```bash
node scripts/e2e-checkout.mjs
```

It places a test order through the whole flow and should end with
`All checks passed.` You will see the order in the admin under **Orders**.

Try it yourself in the browser:

1. Open a product, pick a size, **Add to Bag**.
2. **Checkout** - any name, a 6-digit PIN code (e.g. `500001`) and a 10-digit mobile
   number starting with 6-9 (e.g. `9876543210`).
3. Choose delivery, then **Cash on Delivery**, **Place Order**.
4. Coupons to try: `WELCOME10` (10% off), `DSFEST200` (Rs 200 off).

---

## Everyday use

| What | Command |
|---|---|
| Start database (Option B) | `npm run db` (keep open) |
| Start database (Option A) | `docker compose up -d` |
| Start the store | `npm run dev` |
| Stop | `Ctrl + C` in the terminal(s); `docker compose down` for Docker |

The data stays between restarts.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `port 5432 is already in use` from `npm run db` | A PostgreSQL is already running - that's fine, continue. If it's a different PostgreSQL installed on your PC, stop it or change `PG_PORT` and `DATABASE_URL`. |
| `EADDRINUSE :8000` or `:9000` | The store is already running in another terminal. Close it or stop the old Node process. |
| Storefront says **"We'll be right back"** or shows no products | The backend isn't running, or the `pk_...` key in `apps/storefront/.env.local` is wrong. Restart `npm run dev` after fixing it. |
| Shop / search shows 0 products right after setup | The search index fills when the backend starts. Wait for `[Search] Seeding "product"` in the backend log, then refresh. |
| `Failed to load native binding` / `ERR_SWC_NATIVE_CACHE` (Windows) | Run `npm install` again in the project folder (the repo pins a compatible `@swc/core`). |
| `Missing required environment variable JWT_SECRET` | You started with `NODE_ENV=production`; for local use keep `NODE_ENV=development` in `apps/backend/.env`. |
| Strange characters instead of ₹ | The database must be UTF-8. Both Option A and B create it that way; if you use your own PostgreSQL, create the database with `ENCODING 'UTF8'`. |
| Want to start over with fresh demo data | Option A: `docker compose down -v` then repeat from step 3. Option B: stop `npm run db`, delete the folder `tools/dev-db/.pgdata`, then repeat from step 3. |

---

## Optional: Razorpay online payments

Cash on Delivery works out of the box. To enable UPI/card payments in test mode:

1. Create a free account at https://dashboard.razorpay.com, switch to **Test Mode**,
   go to **Account & Settings -> API Keys -> Generate Test Key**.
2. In `apps/backend/.env` set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. In `apps/storefront/.env.local` set `NEXT_PUBLIC_RAZORPAY_KEY_ID` (the key id only).
4. Restart `npm run dev`. In the admin go to **Settings -> Regions -> India** and add the
   payment provider **razorpay**.

Never commit `.env` files or share the Key Secret.

---

## Where to read more

- `README.md` - project overview and commands
- `docs/` - design analysis, backend choice, architecture, environment variables,
  admin guide, deployment, testing report
