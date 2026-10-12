"use client"

import type { HttpTypes } from "@medusajs/types"
import { Check, CreditCard, Lock, Pencil, Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/field"
import { Alert } from "@/components/ui/misc"
import {
  placeOrder,
  selectPaymentProvider,
  setCheckoutAddress,
  setShippingMethod,
  type CheckoutAddressInput,
} from "@/lib/data/cart"
import { cn } from "@/lib/util/cn"
import { formatMoney } from "@/lib/util/money"
import { INDIAN_STATES } from "@/lib/util/size-guides"

type Step = "address" | "delivery" | "payment" | "review"

const PROVIDER_INFO: Record<string, { label: string; description: string; icon: ReactNode }> = {
  pp_system_default: {
    label: "Cash on Delivery",
    description: "Pay in cash or UPI when your order arrives.",
    icon: <Wallet className="size-5" />,
  },
  pp_razorpay_razorpay: {
    label: "Pay online",
    description: "UPI, cards, netbanking and wallets via Razorpay.",
    icon: <CreditCard className="size-5" />,
  },
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void }
  }
}

function StepCard({
  index,
  title,
  active,
  done,
  summary,
  onEdit,
  children,
}: {
  index: number
  title: string
  active: boolean
  done: boolean
  summary?: ReactNode
  onEdit?: () => void
  children: ReactNode
}) {
  return (
    <section className={cn("border-b border-line py-6", !active && !done && "opacity-50")} aria-current={active ? "step" : undefined}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em]">
          <span className={cn("grid size-7 place-items-center rounded-full text-xs", done && !active ? "bg-success text-white" : active ? "bg-ink text-ivory" : "border border-line")}>
            {done && !active ? <Check className="size-4" /> : index}
          </span>
          {title}
        </h2>
        {done && !active && onEdit ? (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-[13px] underline underline-offset-4">
            <Pencil className="size-3.5" /> Edit
          </button>
        ) : null}
      </div>
      {active ? <div className="mt-6">{children}</div> : done && summary ? <div className="mt-3 pl-10 text-[14px] text-ink-soft">{summary}</div> : null}
    </section>
  )
}

export function CheckoutClient({
  cart,
  customer,
  shippingOptions,
  providers,
  razorpayKeyId,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
  providers: string[]
  razorpayKeyId: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const addr = cart.shipping_address
  const addressDone = Boolean(cart.email && addr?.address_1)
  const deliveryDone = (cart.shipping_methods ?? []).length > 0
  const session = cart.payment_collection?.payment_sessions?.find((s) => s.status !== "canceled")
  const paymentDone = Boolean(session)

  const firstIncomplete: Step = !addressDone ? "address" : !deliveryDone ? "delivery" : !paymentDone ? "payment" : "review"
  const [editing, setEditing] = useState<Step | null>(null)
  const step = editing ?? firstIncomplete

  const savedAddresses = customer?.addresses ?? []
  const [prefill, setPrefill] = useState<Partial<HttpTypes.StoreCustomerAddress> | null>(null)
  const defaults = useMemo(
    () => ({
      email: cart.email ?? customer?.email ?? "",
      first_name: addr?.first_name ?? prefill?.first_name ?? customer?.first_name ?? "",
      last_name: addr?.last_name ?? prefill?.last_name ?? customer?.last_name ?? "",
      address_1: addr?.address_1 ?? prefill?.address_1 ?? "",
      address_2: addr?.address_2 ?? prefill?.address_2 ?? "",
      city: addr?.city ?? prefill?.city ?? "",
      province: addr?.province ?? prefill?.province ?? "",
      postal_code: addr?.postal_code ?? prefill?.postal_code ?? "",
      phone: addr?.phone ?? prefill?.phone ?? customer?.phone ?? "",
    }),
    [cart.email, customer, addr, prefill]
  )

  const run = (fn: () => Promise<{ ok: boolean; error?: string; fieldErrors?: Record<string, string> }>, then?: () => void) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if (!res.ok) {
        if (res.error === "login_required") {
          router.push(`/account/login?redirect=${encodeURIComponent("/checkout")}&reason=checkout`)
          return
        }
        setError(res.error ?? "Something went wrong")
        setFieldErrors(res.fieldErrors ?? {})
        return
      }
      setFieldErrors({})
      setEditing(null)
      then?.()
    })
  }

  const submitAddress = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget)) as unknown as CheckoutAddressInput
    run(() => setCheckoutAddress(data))
  }

  // ------------------------------------------------------------- payment / place order
  const selectedProvider = session?.provider_id
  const total = cart.total ?? 0

  const finishOrder = () =>
    start(async () => {
      const res = await placeOrder()
      if (res.ok && res.data) {
        router.push(`/order/${res.data.orderId}/confirmed`)
      } else if (!res.ok) {
        setError(res.error)
      }
    })

  const payWithRazorpay = () => {
    const data = (session?.data ?? {}) as Record<string, unknown>
    const key = (data.key_id as string) || razorpayKeyId
    if (!window.Razorpay || !key || !data.razorpay_order_id) {
      setError("Online payment is unavailable right now. Please choose Cash on Delivery or try again.")
      return
    }
    const rzp = new window.Razorpay({
      key,
      order_id: data.razorpay_order_id,
      amount: data.amount,
      currency: data.currency ?? "INR",
      name: "DS Wardrobe",
      description: `Order of ${cart.items?.length ?? 0} item(s)`,
      prefill: { name: `${addr?.first_name ?? ""} ${addr?.last_name ?? ""}`.trim(), email: cart.email, contact: addr?.phone },
      notes: { session_id: data.session_id },
      theme: { color: "#0e0e0e" },
      // Payment is verified server-side when the cart is completed.
      handler: () => finishOrder(),
      modal: { ondismiss: () => setError("Payment was cancelled. You can try again.") },
    })
    rzp.on("payment.failed", () => setError("Payment failed. No money was taken - please try again."))
    rzp.open()
  }

  const placeOrderClick = () => {
    setError(null)
    if (selectedProvider === "pp_razorpay_razorpay") payWithRazorpay()
    else finishOrder()
  }

  return (
    <div>
      {providers.includes("pp_razorpay_razorpay") ? (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      ) : null}

      {/* 1. Contact & address */}
      <StepCard
        index={1}
        title="Contact & Address"
        active={step === "address"}
        done={addressDone}
        onEdit={() => setEditing("address")}
        summary={
          addr ? (
            <>
              <p>{cart.email}</p>
              <p>
                {addr.first_name} {addr.last_name}, {addr.address_1}
                {addr.address_2 ? `, ${addr.address_2}` : ""}, {addr.city}, {addr.province} {addr.postal_code}
              </p>
              <p>{addr.phone}</p>
            </>
          ) : null
        }
      >
        {savedAddresses.length ? (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]">Saved addresses</p>
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setPrefill(a)}
                  className="rounded-xs border border-line bg-white px-3 py-2 text-left text-[13px] hover:border-ink"
                >
                  <span className="font-semibold">{a.first_name} {a.last_name}</span>
                  <br />
                  {a.address_1}, {a.city} {a.postal_code}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <form key={JSON.stringify(defaults)} onSubmit={submitAddress} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Input wrapperClassName="sm:col-span-2" label="Email" name="email" type="email" autoComplete="email" required defaultValue={defaults.email} error={fieldErrors.email} hint="Order updates will be sent here" />
          <Input label="First name" name="first_name" autoComplete="given-name" required defaultValue={defaults.first_name} error={fieldErrors.first_name} />
          <Input label="Last name" name="last_name" autoComplete="family-name" required defaultValue={defaults.last_name} error={fieldErrors.last_name} />
          <Input wrapperClassName="sm:col-span-2" label="Address" name="address_1" autoComplete="address-line1" placeholder="House no., building, street" required defaultValue={defaults.address_1} error={fieldErrors.address_1} />
          <Input wrapperClassName="sm:col-span-2" label="Apartment, landmark (optional)" name="address_2" autoComplete="address-line2" defaultValue={defaults.address_2} />
          <Input label="City" name="city" autoComplete="address-level2" required defaultValue={defaults.city} error={fieldErrors.city} />
          <Select label="State" name="province" required placeholder="Select state" defaultValue={defaults.province} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} error={fieldErrors.province} />
          <Input label="PIN code" name="postal_code" inputMode="numeric" autoComplete="postal-code" maxLength={6} required defaultValue={defaults.postal_code} error={fieldErrors.postal_code} />
          <Input label="Mobile number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" required defaultValue={defaults.phone} error={fieldErrors.phone} />
          <div className="sm:col-span-2">
            <Button type="submit" size="lg" loading={pending} fullWidth>
              Continue to delivery
            </Button>
          </div>
        </form>
      </StepCard>

      {/* 2. Delivery */}
      <StepCard
        index={2}
        title="Delivery"
        active={step === "delivery"}
        done={deliveryDone}
        onEdit={() => setEditing("delivery")}
        summary={cart.shipping_methods?.map((m) => (
          <p key={m.id}>
            {m.name} - {m.amount ? formatMoney(m.amount, cart.currency_code) : "Free"}
          </p>
        ))}
      >
        {shippingOptions.length ? (
          <div className="space-y-3" role="radiogroup" aria-label="Delivery options">
            {shippingOptions.map((o) => {
              const amount = (o as { calculated_price?: { calculated_amount?: number } }).calculated_price?.calculated_amount ?? o.amount
              const selected = cart.shipping_methods?.some((m) => m.shipping_option_id === o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => run(() => setShippingMethod(o.id))}
                  className={cn("flex w-full items-center justify-between gap-4 border bg-white p-4 text-left transition-colors", selected ? "border-ink" : "border-line hover:border-ink")}
                >
                  <span>
                    <span className="block font-semibold">{o.name}</span>
                    <span className="text-[13px] text-ash">{o.type?.description}</span>
                  </span>
                  <span className="font-semibold">{amount ? formatMoney(amount, cart.currency_code) : "Free"}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <Alert tone="info">We don&apos;t deliver to this PIN code yet. Please try another address.</Alert>
        )}
      </StepCard>

      {/* 3. Payment */}
      <StepCard
        index={3}
        title="Payment"
        active={step === "payment"}
        done={paymentDone}
        onEdit={() => setEditing("payment")}
        summary={selectedProvider ? <p>{PROVIDER_INFO[selectedProvider]?.label ?? selectedProvider}</p> : null}
      >
        <div className="space-y-3" role="radiogroup" aria-label="Payment methods">
          {providers.length ? (
            providers.map((id) => {
              const info = PROVIDER_INFO[id] ?? { label: id, description: "", icon: <CreditCard className="size-5" /> }
              const selected = selectedProvider === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => run(() => selectPaymentProvider(id))}
                  className={cn("flex w-full items-center gap-4 border bg-white p-4 text-left transition-colors", selected ? "border-ink" : "border-line hover:border-ink")}
                >
                  <span className="grid size-10 place-items-center rounded-full bg-stone">{info.icon}</span>
                  <span>
                    <span className="block font-semibold">{info.label}</span>
                    <span className="text-[13px] text-ash">{info.description}</span>
                  </span>
                </button>
              )
            })
          ) : (
            <Alert>No payment methods are available. Please contact us.</Alert>
          )}
        </div>
      </StepCard>

      {/* 4. Review */}
      <StepCard index={4} title="Review & Place Order" active={step === "review"} done={false}>
        <p className="text-[14px] text-ink-soft">
          By placing your order you agree to our terms and returns policy. You&apos;ll pay{" "}
          <strong className="text-ink">{formatMoney(total, cart.currency_code)}</strong>
          {selectedProvider === "pp_system_default" ? " in cash or UPI on delivery." : " securely online."}
        </p>
        <Button size="lg" fullWidth className="mt-6" loading={pending} onClick={placeOrderClick}>
          <Lock className="size-4" /> {selectedProvider === "pp_razorpay_razorpay" ? `Pay ${formatMoney(total, cart.currency_code)}` : "Place Order"}
        </Button>
      </StepCard>

      {error ? (
        <Alert className="mt-6">{error}</Alert>
      ) : null}
    </div>
  )
}
