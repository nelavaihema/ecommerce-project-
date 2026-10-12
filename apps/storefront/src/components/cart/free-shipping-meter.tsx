import { config } from "@/lib/config"
import { formatMoney } from "@/lib/util/money"

export function FreeShippingMeter({ itemTotal, currency }: { itemTotal: number; currency: string }) {
  const threshold = config.freeShippingThreshold
  const remaining = Math.max(0, threshold - itemTotal)
  const pct = Math.min(100, Math.round((itemTotal / threshold) * 100))
  return (
    <div className="space-y-2">
      <p className="text-[13px]">
        {remaining > 0 ? (
          <>
            You are <strong>{formatMoney(remaining, currency)}</strong> away from{" "}
            <strong>free shipping</strong>
          </>
        ) : (
          <strong className="text-success">You have unlocked free standard shipping</strong>
        )}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-stone" aria-hidden="true">
        <div
          className={remaining > 0 ? "h-full bg-ink transition-all" : "h-full bg-success transition-all"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
