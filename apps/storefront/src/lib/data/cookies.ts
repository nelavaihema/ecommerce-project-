import "server-only"
import { cookies } from "next/headers"

const CART_COOKIE = "_ds_cart_id"
const AUTH_COOKIE = "_ds_jwt"

const secure = process.env.NODE_ENV === "production"

export async function getAuthToken() {
  return (await cookies()).get(AUTH_COOKIE)?.value
}

/** Headers to authenticate the current customer against the Store API (empty for guests). */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken()
  return token ? { authorization: `Bearer ${token}` } : {}
}

export async function setAuthToken(token: string) {
  ;(await cookies()).set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function removeAuthToken() {
  ;(await cookies()).delete(AUTH_COOKIE)
}

export async function getCartId() {
  return (await cookies()).get(CART_COOKIE)?.value
}

export async function setCartId(cartId: string) {
  ;(await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function removeCartId() {
  ;(await cookies()).delete(CART_COOKIE)
}
