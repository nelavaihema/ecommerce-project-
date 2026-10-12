"use server"

import type { HttpTypes } from "@medusajs/types"
import { refresh } from "next/cache"
import { z } from "zod"
import { sdk } from "../sdk"
import { errorMessage, type ActionResult } from "../util/errors"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { getCustomer } from "./customer"
import { getRegion } from "./regions"

const CART_FIELDS = [
  "*items",
  "*items.variant",
  "*items.variant.options",
  "*items.product",
  "+items.variant.inventory_quantity",
  "+items.variant.manage_inventory",
  "+items.variant.allow_backorder",
  "*promotions",
  "*shipping_methods",
  "*shipping_address",
  "*billing_address",
  "*payment_collection",
  "*payment_collection.payment_sessions",
  "*region",
  "+completed_at",
].join(",")

async function fetchCart(id: string) {
  const headers = await getAuthHeaders()
  const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
    method: "GET",
    query: { fields: CART_FIELDS },
    headers,
    cache: "no-store",
  })
  return cart
}

/** The current visitor's open cart, or null. Never throws (header must still render). */
export async function getCart(): Promise<HttpTypes.StoreCart | null> {
  const id = await getCartId()
  if (!id) return null
  try {
    const cart = await fetchCart(id)
    return cart && !(cart as { completed_at?: string | null }).completed_at ? cart : null
  } catch {
    return null
  }
}

async function getOrCreateCart(): Promise<HttpTypes.StoreCart> {
  const existing = await getCart()
  if (existing) return existing
  const region = await getRegion()
  if (!region) throw new Error("The store is not configured yet (no region).")
  const headers = await getAuthHeaders()
  const { cart } = await sdk.store.cart.create({ region_id: region.id }, { fields: "id" }, headers)
  await setCartId(cart.id)
  // Remember the cart on the customer so it follows them across devices.
  if (headers.authorization) {
    await sdk.store.customer
      .update({ metadata: { cart_id: cart.id } }, {}, headers)
      .catch(() => undefined)
  }
  return cart
}

function done() {
  refresh()
}

const quantity = z.coerce.number().int().min(1).max(10)

export async function addToCart(input: {
  variantId: string
  quantity: number
}): Promise<ActionResult<{ count: number }>> {
  const parsed = z.object({ variantId: z.string().min(1), quantity }).safeParse(input)
  if (!parsed.success) return { ok: false, error: "Please choose a size and quantity." }
  try {
    const cart = await getOrCreateCart()
    const headers = await getAuthHeaders()
    const { cart: updated } = await sdk.store.cart.createLineItem(
      cart.id,
      { variant_id: parsed.data.variantId, quantity: parsed.data.quantity },
      { fields: "id,*items" },
      headers
    )
    done()
    const count = (updated.items ?? []).reduce((n, i) => n + i.quantity, 0)
    return { ok: true, data: { count } }
  } catch (e) {
    const msg = errorMessage(e)
    return {
      ok: false,
      error: /inventory|stock|quantity/i.test(msg)
        ? "Sorry, we don't have enough stock for that size."
        : msg,
    }
  }
}

export async function updateLineItem(input: {
  lineId: string
  quantity: number
}): Promise<ActionResult> {
  const id = await getCartId()
  if (!id) return { ok: false, error: "Your bag has expired. Please add the item again." }
  const parsed = z
    .object({ lineId: z.string().min(1), quantity: z.coerce.number().int().min(0).max(10) })
    .safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid quantity." }
  try {
    const headers = await getAuthHeaders()
    if (parsed.data.quantity === 0) {
      await sdk.store.cart.deleteLineItem(id, parsed.data.lineId, {}, headers)
    } else {
      await sdk.store.cart.updateLineItem(
        id,
        parsed.data.lineId,
        { quantity: parsed.data.quantity },
        { fields: "id" },
        headers
      )
    }
    done()
    return { ok: true }
  } catch (e) {
    const msg = errorMessage(e)
    return {
      ok: false,
      error: /inventory|stock|quantity/i.test(msg) ? "That's all the stock we have for this size." : msg,
    }
  }
}

export async function removeLineItem(lineId: string): Promise<ActionResult> {
  return updateLineItem({ lineId, quantity: 0 })
}

export async function applyPromoCode(code: string): Promise<ActionResult> {
  const id = await getCartId()
  const clean = code.trim().toUpperCase()
  if (!id) return { ok: false, error: "Your bag is empty." }
  if (!/^[A-Z0-9_-]{2,40}$/.test(clean)) return { ok: false, error: "Enter a valid code." }
  try {
    const headers = await getAuthHeaders()
    const { cart } = await sdk.store.cart.addPromotions(
      id,
      { promo_codes: [clean] },
      { fields: "id,*promotions" },
      headers
    )
    const applied = (cart.promotions ?? []).some((p) => p.code?.toUpperCase() === clean)
    if (!applied) return { ok: false, error: "This code isn't valid for your bag." }
    done()
    return { ok: true, message: `${clean} applied` }
  } catch (e) {
    return { ok: false, error: "This code isn't valid or has expired." }
  }
}

export async function removePromoCode(code: string): Promise<ActionResult> {
  const id = await getCartId()
  if (!id) return { ok: false, error: "Your bag is empty." }
  try {
    const headers = await getAuthHeaders()
    await sdk.store.cart.removePromotions(id, { promo_codes: [code] }, { fields: "id" }, headers)
    done()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// ------------------------------------------------------------------ checkout

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")

const addressSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(60),
  last_name: z.string().trim().min(1, "Required").max(60),
  address_1: z.string().trim().min(3, "Enter your house / street").max(120),
  address_2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Required").max(60),
  province: z.string().trim().min(2, "Select a state").max(60),
  postal_code: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  phone,
})

export type CheckoutAddressInput = z.input<typeof addressSchema> & { email: string }

export async function setCheckoutAddress(
  input: CheckoutAddressInput
): Promise<ActionResult> {
  if (!(await getCustomer())) return { ok: false, error: "login_required" }
  const id = await getCartId()
  if (!id) return { ok: false, error: "Your bag has expired." }
  const parsed = addressSchema
    .extend({ email: z.string().trim().toLowerCase().email("Enter a valid email") })
    .safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0])
      fieldErrors[key] ??= issue.message
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors }
  }
  const { email, ...address } = parsed.data
  const full = { ...address, country_code: "in" }
  try {
    const headers = await getAuthHeaders()
    await sdk.store.cart.update(
      id,
      { email, shipping_address: full, billing_address: full },
      { fields: "id" },
      headers
    )
    done()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function listShippingOptions(): Promise<HttpTypes.StoreCartShippingOption[]> {
  const id = await getCartId()
  if (!id) return []
  try {
    const headers = await getAuthHeaders()
    const { shipping_options } = await sdk.client.fetch<HttpTypes.StoreShippingOptionListResponse>(
      "/store/shipping-options",
      { method: "GET", query: { cart_id: id }, headers, cache: "no-store" }
    )
    return shipping_options
  } catch {
    return []
  }
}

export async function setShippingMethod(optionId: string): Promise<ActionResult> {
  const id = await getCartId()
  if (!id) return { ok: false, error: "Your bag has expired." }
  try {
    const headers = await getAuthHeaders()
    await sdk.store.cart.addShippingMethod(id, { option_id: optionId }, { fields: "id" }, headers)
    done()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function listPaymentProviders(regionId: string) {
  try {
    const { payment_providers } = await sdk.client.fetch<HttpTypes.StorePaymentProviderListResponse>(
      "/store/payment-providers",
      { method: "GET", query: { region_id: regionId }, next: { revalidate: 300 } }
    )
    return payment_providers
  } catch {
    return []
  }
}

/**
 * Creates/updates the payment session for the chosen provider. For Razorpay the
 * returned session data carries the Razorpay order id used by the browser checkout.
 */
export async function selectPaymentProvider(
  providerId: string
): Promise<ActionResult<{ session?: Record<string, unknown> }>> {
  const cart = await getCart()
  if (!cart) return { ok: false, error: "Your bag has expired." }
  try {
    const headers = await getAuthHeaders()
    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(
      cart,
      { provider_id: providerId },
      {},
      headers
    )
    const session = payment_collection.payment_sessions?.find(
      (s) => s.provider_id === providerId
    )
    done()
    return { ok: true, data: { session: session?.data as Record<string, unknown> } }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

/**
 * Completes the cart. Medusa authorises the payment session first; an order is
 * only created when authorisation succeeds (COD authorises immediately, Razorpay
 * only after the provider confirms the payment).
 */
export async function placeOrder(): Promise<ActionResult<{ orderId: string }>> {
  const id = await getCartId()
  if (!id) return { ok: false, error: "Your bag has expired." }
  try {
    const headers = await getAuthHeaders()
    const result = await sdk.store.cart.complete(id, {}, headers)
    if (result.type === "order") {
      await removeCartId()
      if (headers.authorization) {
        await sdk.store.customer
          .update({ metadata: { cart_id: null } }, {}, headers)
          .catch(() => undefined)
      }
      refresh()
      return { ok: true, data: { orderId: result.order.id } }
    }
    return {
      ok: false,
      error:
        result.error?.message ||
        "We couldn't confirm your payment. You have not been charged twice - please try again.",
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}
