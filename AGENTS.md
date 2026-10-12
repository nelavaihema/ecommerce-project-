# AGENTS.md

DS Wardrobe e-commerce: Medusa v2 backend + admin (`apps/backend`, npm workspace) and a
Next.js 16 storefront (`apps/storefront`, **independent package with its own lockfile**).
Read `README.md` and `docs/03-architecture.md` first.

## Layout

```
apps/backend      Medusa (@dtc/backend). Custom modules in src/modules, workflows in
                  src/workflows, routes in src/api (validation in middlewares.ts),
                  search index in src/search, admin UI in src/admin, seed in src/scripts.
apps/storefront   Next.js (@ds/storefront). Data layer in src/lib/data (server-only;
                  cart.ts and account-actions.ts are Server Actions).
docs/             analysis, decisions, env vars, deployment, QA report
scripts/          e2e-checkout.mjs (Store API customer-journey test)
tools/dev-db      portable UTF-8 PostgreSQL (npm run db)
```

## Commands

- Package manager: **npm** (root lockfile for the backend workspace; separate lockfile in
  `apps/storefront`). Install backend deps with `npm install <pkg> -w apps/backend`;
  storefront deps with `npm --prefix apps/storefront install <pkg>`.
- `npm run dev` (both), `npm run backend:dev`, `npm run storefront:dev`
- Backend: `cd apps/backend && npm run db:migrate | npm run seed | npx medusa db:generate <module>`
- Checks: `cd apps/storefront && npx tsc --noEmit && npx next build`;
  `cd apps/backend && npx tsc --noEmit && npx tsc --noEmit -p src/admin/tsconfig.json`;
  `node scripts/e2e-checkout.mjs` (backend must be running)

## Conventions

- Backend business logic goes in workflows (with compensation); routes validate with zod
  in `src/api/middlewares.ts` and run a workflow. Never write raw SQL.
- Changing a custom module model requires `npx medusa db:generate <module>`; never edit an
  existing migration.
- Storefront: server components fetch through `src/lib/data`; mutations are Server Actions
  that call `refresh()`. Never expose the customer JWT to client components.
- Next.js 16 has breaking changes vs older versions; check
  `apps/storefront/node_modules/next/dist/docs/` before using unfamiliar APIs.
- Amounts are major units (Rs 649 = 649). Prices are tax inclusive (INR, GST).
- Line totals: `item.total` / `cart.item_total` are after discounts; show
  `original_total` / `original_item_total` as the subtotal.
- Keep `@swc/core` pinned to 1.16.2 (newer versions fail on this Windows machine's ACLs).
- No secrets in git: `.env`, `.env.local` are ignored; document new variables in the
  `.env.template` files and `docs/04-environment-variables.md`.

## Off-limits

- `apps/backend/.medusa/`, `.next/`, `node_modules/`, `tools/dev-db/.pgdata/`
- Lockfiles (change only through npm)
- Existing migrations in `apps/backend/src/modules/*/migrations/`

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
