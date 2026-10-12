import { MedusaError } from "@medusajs/framework/utils"

const API_BASE = "https://api.razorpay.com/v1"

export type RazorpayOrder = {
  id: string
  amount: number
  amount_paid: number
  currency: string
  receipt?: string
  status: "created" | "attempted" | "paid"
  notes?: Record<string, string>
}

export type RazorpayPayment = {
  id: string
  order_id: string
  amount: number
  currency: string
  status: "created" | "authorized" | "captured" | "refunded" | "failed"
  method?: string
  notes?: Record<string, string> | []
  error_description?: string | null
}

/** Minimal Razorpay REST client (avoids an extra SDK dependency). */
export class RazorpayClient {
  private readonly authHeader: string

  constructor(keyId: string, keySecret: string) {
    this.authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")
  }

  private async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        authorization: this.authHeader,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = (await res.json().catch(() => ({}))) as any
    if (!res.ok) {
      const description = json?.error?.description ?? res.statusText
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Razorpay ${method} ${path} failed: ${description}`
      )
    }
    return json as T
  }

  createOrder(input: {
    amount: number
    currency: string
    receipt: string
    notes?: Record<string, string>
  }) {
    return this.request<RazorpayOrder>("POST", "/orders", input)
  }

  fetchOrder(orderId: string) {
    return this.request<RazorpayOrder>("GET", `/orders/${orderId}`)
  }

  async fetchOrderPayments(orderId: string) {
    const res = await this.request<{ items: RazorpayPayment[] }>(
      "GET",
      `/orders/${orderId}/payments`
    )
    return res.items ?? []
  }

  capturePayment(paymentId: string, amount: number, currency: string) {
    return this.request<RazorpayPayment>("POST", `/payments/${paymentId}/capture`, {
      amount,
      currency,
    })
  }

  refundPayment(paymentId: string, amount: number) {
    return this.request<{ id: string }>("POST", `/payments/${paymentId}/refund`, { amount })
  }
}

/** INR uses 2 decimal places: rupees -> paise. */
export function toSmallestUnit(amount: unknown): number {
  return Math.round(Number(amount) * 100)
}

export function fromSmallestUnit(amount: number): number {
  return amount / 100
}
