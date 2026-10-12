"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/misc"
import { cancelCustomerOrder } from "@/lib/data/account-actions"

export function OrderCancelButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cancel = () => {
    setError(null)
    startTransition(async () => {
      const result = await cancelCustomerOrder(orderId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setConfirming(false)
      router.refresh()
    })
  }

  return (
    <section className="border border-line bg-white p-5 sm:p-6">
      <h3 className="font-semibold">Need to cancel?</h3>
      <p className="mt-1 text-sm text-ash">
        You can cancel this order before fulfillment starts. Any captured online payment will be refunded.
      </p>
      {error ? <Alert className="mt-4">{error}</Alert> : null}
      {confirming ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="ember" loading={pending} onClick={cancel}>
            Confirm cancellation
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => setConfirming(false)}>
            Keep order
          </Button>
        </div>
      ) : (
        <Button
          className="mt-4"
          variant="secondary"
          disabled={pending}
          onClick={() => setConfirming(true)}
        >
          Cancel order
        </Button>
      )}
    </section>
  )
}
