"use server"

import type { HttpTypes } from "@medusajs/types"
import { refresh } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { sdk } from "../sdk"
import { errorMessage, type ActionResult } from "../util/errors"
import {
  getAuthHeaders,
  getCartId,
  removeAuthToken,
  setAuthToken,
  setCartId,
} from "./cookies"

export type FormState = { error?: string; fieldErrors?: Record<string, string>; success?: string } | null

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {}
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message
  return out
}

function safeRedirectPath(value: FormDataEntryValue | null) {
  const v = typeof value === "string" ? value : ""
  return v.startsWith("/") && !v.startsWith("//") ? v : "/account"
}

/**
 * After login: attach the guest cart to the customer, or restore the customer's
 * saved cart on a new device (cart persistence for logged-in users).
 */
async function syncCartAfterLogin(token: string) {
  const headers = { authorization: `Bearer ${token}` }
  const cartId = await getCartId()
  try {
    if (cartId) {
      await sdk.store.cart.transferCart(cartId, { fields: "id" }, headers)
      await sdk.store.customer.update({ metadata: { cart_id: cartId } }, {}, headers)
      return
    }
    const { customer } = await sdk.store.customer.retrieve({ fields: "+metadata" }, headers)
    const saved = customer.metadata?.cart_id
    if (typeof saved === "string" && saved) {
      const { cart } = await sdk.store.cart.retrieve(saved, { fields: "id,+completed_at" }, headers)
      if (cart && !(cart as { completed_at?: string | null }).completed_at) {
        await setCartId(cart.id)
      }
    }
  } catch {
    // Cart sync is best-effort; never block login on it.
  }
}

async function loginWithPassword(email: string, password: string) {
  const token = await sdk.auth.login("customer", "emailpass", { email, password })
  if (typeof token !== "string") {
    throw new Error("Additional authentication is required for this account.")
  }
  await setAuthToken(token)
  await syncCartAfterLogin(token)
  return token
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  try {
    await loginWithPassword(parsed.data.email, parsed.data.password)
  } catch (e) {
    const msg = errorMessage(e, "")
    return {
      error: /invalid|unauthor|credentials/i.test(msg) || !msg
        ? "Incorrect email or password."
        : msg,
    }
  }
  refresh()
  redirect(safeRedirectPath(formData.get("redirect")))
}

const registerSchema = credentials.extend({
  first_name: z.string().trim().min(1, "Required").max(60),
  last_name: z.string().trim().min(1, "Required").max(60),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v.replace(/[\s-]/g, "") : undefined))
    .refine((v) => !v || /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number"),
})

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  const { email, password, first_name, last_name, phone } = parsed.data
  try {
    const registrationToken = await sdk.auth.register("customer", "emailpass", { email, password })
    await sdk.store.customer.create(
      { email, first_name, last_name, phone },
      {},
      { authorization: `Bearer ${registrationToken}` }
    )
    await loginWithPassword(email, password)
  } catch (e) {
    const msg = errorMessage(e, "")
    return {
      error: /exist|already/i.test(msg)
        ? "An account with this email already exists. Try signing in."
        : msg || "We couldn't create your account. Please try again.",
    }
  }
  refresh()
  redirect(safeRedirectPath(formData.get("redirect")))
}

export async function logout() {
  const headers = await getAuthHeaders()
  if (headers.authorization) {
    await sdk.client
      .fetch("/auth/session", { method: "DELETE", headers })
      .catch(() => undefined)
  }
  await removeAuthToken()
  refresh()
  redirect("/")
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema
    .pick({ first_name: true, last_name: true, phone: true })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  try {
    await sdk.store.customer.update(parsed.data, {}, await getAuthHeaders())
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh()
  return { success: "Profile updated" }
}

const addressSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(60),
  last_name: z.string().trim().min(1, "Required").max(60),
  address_1: z.string().trim().min(3, "Required").max(120),
  address_2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Required").max(60),
  province: z.string().trim().min(2, "Select a state").max(60),
  postal_code: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number"),
  is_default_shipping: z
    .union([z.literal("on"), z.literal("true"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
})

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id")
  const parsed = addressSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  const payload: HttpTypes.StoreCreateCustomerAddress = { ...parsed.data, country_code: "in" }
  try {
    const headers = await getAuthHeaders()
    if (typeof id === "string" && id) {
      await sdk.store.customer.updateAddress(id, payload, {}, headers)
    } else {
      await sdk.store.customer.createAddress(payload, {}, headers)
    }
  } catch (e) {
    return { error: errorMessage(e) }
  }
  refresh()
  return { success: "Address saved" }
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    await sdk.store.customer.deleteAddress(addressId, await getAuthHeaders())
    refresh()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

export async function cancelCustomerOrder(orderId: string): Promise<ActionResult> {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(orderId)) {
    return { ok: false, error: "Invalid order." }
  }
  const headers = await getAuthHeaders()
  if (!headers.authorization) return { ok: false, error: "Please sign in to cancel this order." }
  try {
    await sdk.client.fetch(`/store/customers/me/orders/${orderId}/cancel`, {
      method: "POST",
      headers,
    })
    refresh()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// ------------------------------------------------------------------ wishlist

export async function toggleWishlist(
  productId: string,
  saved: boolean
): Promise<ActionResult<{ saved: boolean }>> {
  const headers = await getAuthHeaders()
  if (!headers.authorization) return { ok: false, error: "login_required" }
  try {
    if (saved) {
      await sdk.client.fetch(`/store/customers/me/wishlist/${productId}`, {
        method: "DELETE",
        headers,
      })
    } else {
      await sdk.client.fetch("/store/customers/me/wishlist", {
        method: "POST",
        headers,
        body: { product_id: productId },
      })
    }
    refresh()
    return { ok: true, data: { saved: !saved } }
  } catch (e) {
    return { ok: false, error: errorMessage(e) }
  }
}

// ------------------------------------------------------------------ reviews

const reviewSchema = z.object({
  product_id: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(2000),
})

export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const headers = await getAuthHeaders()
  if (!headers.authorization) return { error: "Please sign in to write a review." }
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  const { product_id, ...body } = parsed.data
  try {
    const res = await sdk.client.fetch<{ message: string }>(
      `/store/products/${product_id}/reviews`,
      { method: "POST", headers, body: { ...body, title: body.title || null } }
    )
    return { success: res.message }
  } catch (e) {
    const msg = errorMessage(e)
    return { error: /already reviewed/i.test(msg) ? "You've already reviewed this product." : msg }
  }
}

// ------------------------------------------------------------------ order tracking

export type TrackState = (NonNullable<FormState> & { order?: TrackedOrder }) | null
export type TrackedOrder = {
  id: string
  display_id: number
  status: string
  created_at: string
  currency_code: string
  total: number
  payment_status?: string
  fulfillment_status?: string
  items: { id: string; title: string; subtitle?: string; thumbnail?: string; quantity: number; total: number; original_total?: number; variant_title?: string; product_handle?: string }[]
  shipping_address?: Record<string, string | null>
  shipping_methods?: { name: string }[]
  fulfillments?: {
    id: string
    created_at: string
    packed_at?: string | null
    shipped_at?: string | null
    delivered_at?: string | null
    canceled_at?: string | null
    labels?: { tracking_number?: string; tracking_url?: string }[]
  }[]
}

const trackSchema = z.object({
  order: z
    .string()
    .trim()
    .transform((v) => v.replace(/^#/, ""))
    .refine((v) => /^\d{1,10}$/.test(v), "Enter your order number, e.g. 1024"),
  email: z.string().trim().toLowerCase().email("Enter the email used at checkout"),
})

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = trackSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { fieldErrors: fieldErrorsOf(parsed.error) }
  try {
    const { order } = await sdk.client.fetch<{ order: TrackedOrder }>("/store/order-lookup", {
      method: "POST",
      body: { display_id: Number(parsed.data.order), email: parsed.data.email },
      cache: "no-store",
    })
    return { order }
  } catch (e) {
    const msg = errorMessage(e)
    return { error: /couldn't find|not found/i.test(msg) ? "We couldn't find an order with that number and email." : msg }
  }
}
