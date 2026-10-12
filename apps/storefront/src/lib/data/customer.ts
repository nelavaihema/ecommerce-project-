import "server-only"
import type { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { sdk } from "../sdk"
import { getAuthHeaders } from "./cookies"

/** The logged-in customer, or null for guests / expired sessions. */
export const getCustomer = cache(async (): Promise<HttpTypes.StoreCustomer | null> => {
  const headers = await getAuthHeaders()
  if (!headers.authorization) return null
  try {
    const { customer } = await sdk.client.fetch<HttpTypes.StoreCustomerResponse>(
      "/store/customers/me",
      { method: "GET", query: { fields: "*addresses,+metadata" }, headers, cache: "no-store" }
    )
    return customer
  } catch {
    return null
  }
})

export async function listOrders(limit = 20, offset = 0) {
  const headers = await getAuthHeaders()
  return sdk.client.fetch<HttpTypes.StoreOrderListResponse>("/store/orders", {
    method: "GET",
    query: {
      limit,
      offset,
      order: "-created_at",
      fields: "id,display_id,status,created_at,total,currency_code,payment_status,fulfillment_status,*items,*fulfillments",
    },
    headers,
    cache: "no-store",
  })
}

const ORDER_FIELDS = [
  "*items",
  "*items.variant",
  "*shipping_address",
  "*billing_address",
  "*shipping_methods",
  "*payment_collections",
  "*payment_collections.payments",
  "*fulfillments",
  "*fulfillments.labels",
  "+payment_status",
  "+fulfillment_status",
  "+metadata",
].join(",")

/** Retrieve an order. Works for the customer who owns it and for the just-completed guest checkout. */
export async function getOrder(id: string) {
  const headers = await getAuthHeaders()
  try {
    const { order } = await sdk.client.fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: { fields: ORDER_FIELDS },
      headers,
      cache: "no-store",
    })
    return order
  } catch {
    return null
  }
}

export async function getWishlistProductIds(): Promise<string[]> {
  const headers = await getAuthHeaders()
  if (!headers.authorization) return []
  try {
    const { items } = await sdk.client.fetch<{ items: { product_id: string }[] }>(
      "/store/customers/me/wishlist",
      { method: "GET", headers, cache: "no-store" }
    )
    return items.map((i) => i.product_id)
  } catch {
    return []
  }
}
