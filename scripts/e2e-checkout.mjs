#!/usr/bin/env node
/**
 * End-to-end smoke test of the customer journey against a running backend,
 * using only the public Store API (the same calls the storefront makes):
 *
 *   search -> product -> cart -> add item -> coupon -> address -> shipping
 *   -> payment (Cash on Delivery) -> complete -> order lookup (tracking)
 *   -> out-of-stock variant is rejected
 *
 * Usage:  node scripts/e2e-checkout.mjs
 * Env:    MEDUSA_BACKEND_URL (default http://localhost:9000)
 *         MEDUSA_PUBLISHABLE_KEY (default: read from apps/storefront/.env.local)
 */
import { readFileSync } from "node:fs"

const BASE = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
let KEY = process.env.MEDUSA_PUBLISHABLE_KEY
if (!KEY) {
  try {
    KEY = readFileSync(new URL("../apps/storefront/.env.local", import.meta.url), "utf8")
      .match(/NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=(\S+)/)?.[1]
  } catch {}
}
if (!KEY) {
  console.error("Set MEDUSA_PUBLISHABLE_KEY or create apps/storefront/.env.local")
  process.exit(1)
}

let step = 0
const ok = (msg) => console.log(`  ✓ ${String(++step).padStart(2)}. ${msg}`)

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "x-publishable-api-key": KEY, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function must(path, opts) {
  const r = await api(path, opts)
  if (r.status >= 400) {
    throw new Error(`${opts?.method ?? "GET"} ${path} -> ${r.status} ${JSON.stringify(r.json)}`)
  }
  return r.json
}

console.log(`\nDS Wardrobe checkout smoke test -> ${BASE}\n`)

const { regions } = await must("/store/regions")
const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === "in")) ?? regions[0]
ok(`region ${region.name} (${region.currency_code})`)

const search = await must("/store/search", {
  method: "POST",
  body: {
    entity: "product",
    filters: { q: "oversized tee", in_stock: true },
    pagination: { take: 5 },
    search_options: { facets: ["category"] },
  },
})
const hit = search.results[0].hits[0]
if (!hit) throw new Error("search returned no in-stock products")
ok(`search "oversized tee" -> ${search.results[0].metadata.count} hits, first: ${hit.document.title}`)

const { products } = await must(
  `/store/products?id=${hit.id}&region_id=${region.id}&fields=*variants.calculated_price,+variants.inventory_quantity,*variants.options`
)
const product = products[0]
const variant = product.variants.find((v) => (v.inventory_quantity ?? 0) > 0)
const soldOut = product.variants.find((v) => v.inventory_quantity === 0)
if (!variant) throw new Error("no in-stock variant")
ok(`variant ${variant.title} @ ${variant.calculated_price.calculated_amount} (stock ${variant.inventory_quantity})`)

let { cart } = await must("/store/carts", { method: "POST", body: { region_id: region.id } })
ok(`cart ${cart.id}`)

;({ cart } = await must(`/store/carts/${cart.id}/line-items`, {
  method: "POST",
  body: { variant_id: variant.id, quantity: 2 },
}))
ok(`added 2 x ${product.title}; subtotal ${cart.item_subtotal ?? cart.subtotal}`)

if (soldOut) {
  const r = await api(`/store/carts/${cart.id}/line-items`, {
    method: "POST",
    body: { variant_id: soldOut.id, quantity: 1 },
  })
  if (r.status < 400) throw new Error("out-of-stock variant was accepted!")
  ok(`out-of-stock variant ${soldOut.title} rejected (${r.status})`)
}

;({ cart } = await must(`/store/carts/${cart.id}/promotions`, {
  method: "POST",
  body: { promo_codes: ["WELCOME10"] },
}))
ok(`coupon WELCOME10 applied; discount ${cart.discount_total}`)

const address = {
  first_name: "Test",
  last_name: "Customer",
  address_1: "12 MG Road",
  city: "Hyderabad",
  province: "Telangana",
  postal_code: "500001",
  country_code: "in",
  phone: "+919999999999",
}
;({ cart } = await must(`/store/carts/${cart.id}`, {
  method: "POST",
  body: { email: `e2e+${Date.now()}@example.com`, shipping_address: address, billing_address: address },
}))
ok(`address + email set (${cart.email})`)

const { shipping_options } = await must(`/store/shipping-options?cart_id=${cart.id}`)
const standard = shipping_options.find((o) => /standard/i.test(o.name)) ?? shipping_options[0]
ok(`shipping options: ${shipping_options.map((o) => `${o.name} ${o.calculated_price?.calculated_amount ?? o.amount}`).join(", ")}`)

;({ cart } = await must(`/store/carts/${cart.id}/shipping-methods`, {
  method: "POST",
  body: { option_id: standard.id },
}))
ok(`shipping method ${standard.name}; total ${cart.total}`)

let { payment_collection } = await must("/store/payment-collections", {
  method: "POST",
  body: { cart_id: cart.id },
})
;({ payment_collection } = await must(
  `/store/payment-collections/${payment_collection.id}/payment-sessions`,
  { method: "POST", body: { provider_id: "pp_system_default" } }
))
ok(`payment session (Cash on Delivery) on ${payment_collection.id}`)

const completed = await must(`/store/carts/${cart.id}/complete`, { method: "POST" })
if (completed.type !== "order") throw new Error(`cart not completed: ${JSON.stringify(completed).slice(0, 300)}`)
const order = completed.order
ok(`ORDER #${order.display_id} placed, total ${order.total} ${order.currency_code}`)

const lookup = await must("/store/order-lookup", {
  method: "POST",
  body: { display_id: order.display_id, email: cart.email },
})
ok(`tracking lookup -> status ${lookup.order.status}, ${lookup.order.items.length} item line(s)`)

const wrong = await api("/store/order-lookup", {
  method: "POST",
  body: { display_id: order.display_id, email: "someone-else@example.com" },
})
if (wrong.status !== 404) throw new Error("order lookup leaked an order for a wrong email")
ok("tracking lookup with wrong email -> 404")

console.log("\nAll checks passed. The order is visible in the admin under Orders.\n")
