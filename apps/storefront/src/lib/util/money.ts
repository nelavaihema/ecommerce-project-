/**
 * Medusa v2 stores amounts in major units (e.g. 1299 = Rs 1,299), so no
 * division is needed. Rupees are shown without paise when whole.
 */
export function formatMoney(amount: number | null | undefined, currencyCode = "inr") {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  const code = currencyCode.toUpperCase()
  const whole = Number.isInteger(value)
  return new Intl.NumberFormat(code === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency: code,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function discountPercent(original?: number | null, calculated?: number | null) {
  if (!original || !calculated || original <= calculated) return 0
  return Math.round(((original - calculated) / original) * 100)
}
