import crypto from "node:crypto"
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  RazorpayClient,
  RazorpayPayment,
  fromSmallestUnit,
  toSmallestUnit,
} from "./client"

type Options = {
  key_id: string
  key_secret: string
  webhook_secret?: string
}

type SessionData = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  amount?: number
  currency?: string
  session_id?: string
  key_id?: string
  status?: string
}

/**
 * Flow:
 * 1. initiatePayment creates a Razorpay Order; the storefront opens Razorpay Checkout with its id.
 * 2. After the customer pays, the storefront completes the cart. authorizePayment then asks the
 *    Razorpay API (server to server) whether the order has an authorized/captured payment, so a
 *    Medusa order is only created after Razorpay confirms the payment.
 * 3. Webhooks (payment.authorized / payment.captured / payment.failed) keep Medusa in sync if the
 *    customer closes the browser before completion.
 */
class RazorpayProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "razorpay"

  protected readonly options_: Options
  protected readonly client_: RazorpayClient
  protected readonly logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    if (!options.key_id || !options.key_secret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay provider requires `key_id` and `key_secret` options"
      )
    }
  }

  constructor(container: { logger: Logger }, options: Options) {
    super(container, options)
    this.options_ = options
    this.logger_ = container.logger
    this.client_ = new RazorpayClient(options.key_id, options.key_secret)
  }

  private orderIdOf(data?: Record<string, unknown>) {
    const id = (data as SessionData | undefined)?.razorpay_order_id
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing Razorpay order id on payment session"
      )
    }
    return id
  }

  private pickPayment(payments: RazorpayPayment[]) {
    return (
      payments.find((p) => p.status === "captured") ??
      payments.find((p) => p.status === "authorized") ??
      payments.find((p) => p.status === "refunded")
    )
  }

  async initiatePayment({
    amount,
    currency_code,
    data,
    context,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = String(
      (data?.session_id as string | undefined) ??
        context?.idempotency_key ??
        crypto.randomUUID()
    )
    const order = await this.client_.createOrder({
      amount: toSmallestUnit(amount),
      currency: currency_code.toUpperCase(),
      receipt: sessionId.slice(0, 40),
      notes: { session_id: sessionId },
    })
    const sessionData: SessionData = {
      razorpay_order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      session_id: sessionId,
      // Public key id, required by Razorpay Checkout in the browser
      key_id: this.options_.key_id,
    }
    return { id: order.id, data: sessionData, status: PaymentSessionStatus.PENDING }
  }

  async getPaymentStatus({ data }: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const orderId = this.orderIdOf(data)
    const payment = this.pickPayment(await this.client_.fetchOrderPayments(orderId))
    if (!payment) {
      return { status: PaymentSessionStatus.PENDING, data }
    }
    const next = { ...data, razorpay_payment_id: payment.id, status: payment.status }
    switch (payment.status) {
      case "captured":
        return { status: PaymentSessionStatus.CAPTURED, data: next }
      case "authorized":
        return { status: PaymentSessionStatus.AUTHORIZED, data: next }
      default:
        return { status: PaymentSessionStatus.PENDING, data: next }
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const result = await this.getPaymentStatus(input)
    if (
      result.status !== PaymentSessionStatus.AUTHORIZED &&
      result.status !== PaymentSessionStatus.CAPTURED
    ) {
      this.logger_.info(
        `Razorpay order ${(input.data as SessionData)?.razorpay_order_id} has no successful payment yet`
      )
    }
    return result
  }

  async capturePayment({ data }: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const session = data as SessionData
    const payment = this.pickPayment(
      await this.client_.fetchOrderPayments(this.orderIdOf(data))
    )
    if (!payment) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No Razorpay payment to capture")
    }
    if (payment.status === "captured") {
      return { data: { ...session, razorpay_payment_id: payment.id, status: "captured" } }
    }
    const captured = await this.client_.capturePayment(
      payment.id,
      payment.amount,
      payment.currency
    )
    return { data: { ...session, razorpay_payment_id: captured.id, status: captured.status } }
  }

  async refundPayment({ amount, data }: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const session = data as SessionData
    let paymentId = session.razorpay_payment_id
    if (!paymentId) {
      paymentId = this.pickPayment(
        await this.client_.fetchOrderPayments(this.orderIdOf(data))
      )?.id
    }
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No Razorpay payment to refund")
    }
    await this.client_.refundPayment(paymentId, toSmallestUnit(amount))
    return { data: { ...session, razorpay_payment_id: paymentId } }
  }

  // Razorpay orders cannot be cancelled; an unpaid order simply expires.
  async cancelPayment({ data }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data }
  }

  async deletePayment({ data }: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data }
  }

  async retrievePayment({ data }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const order = await this.client_.fetchOrder(this.orderIdOf(data))
    return {
      data: { ...data, amount_paid: fromSmallestUnit(order.amount_paid), status: order.status },
    }
  }

  /** Razorpay orders are immutable, so an amount change creates a fresh order. */
  async updatePayment({
    amount,
    currency_code,
    data,
    context,
  }: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const session = data as SessionData
    if (session?.razorpay_order_id && session.amount === toSmallestUnit(amount)) {
      return { data, status: PaymentSessionStatus.PENDING }
    }
    const created = await this.initiatePayment({
      amount,
      currency_code,
      data: { session_id: session?.session_id },
      context,
    } as InitiatePaymentInput)
    return { data: created.data, status: PaymentSessionStatus.PENDING }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const secret = this.options_.webhook_secret
    if (!secret) {
      this.logger_.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set; ignoring")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const signature = String(payload.headers["x-razorpay-signature"] ?? "")
    const raw =
      typeof payload.rawData === "string"
        ? payload.rawData
        : Buffer.from(payload.rawData as Buffer).toString("utf8")
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex")
    const valid =
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    if (!valid) {
      this.logger_.warn("Razorpay webhook signature mismatch")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const event = payload.data as {
      event?: string
      payload?: { payment?: { entity?: RazorpayPayment } }
    }
    const payment = event?.payload?.payment?.entity
    if (!payment?.order_id) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    let sessionId = !Array.isArray(payment.notes) ? payment.notes?.session_id : undefined
    if (!sessionId) {
      const order = await this.client_.fetchOrder(payment.order_id)
      sessionId = order.notes?.session_id
    }
    if (!sessionId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const data = { session_id: sessionId, amount: fromSmallestUnit(payment.amount) }
    switch (event.event) {
      case "payment.authorized":
        return { action: PaymentActions.AUTHORIZED, data }
      case "payment.captured":
        return { action: PaymentActions.SUCCESSFUL, data }
      case "payment.failed":
        return { action: PaymentActions.FAILED, data }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default RazorpayProviderService
