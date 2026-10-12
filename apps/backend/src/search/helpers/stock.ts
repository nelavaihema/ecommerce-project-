export type StockVariantRow = {
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_items?: ({
    required_quantity?: number | null
    inventory?: {
      location_levels?: ({
        stocked_quantity?: number | null
        reserved_quantity?: number | null
      } | null)[] | null
    } | null
  } | null)[] | null
} | null

/** Graph fields needed to decide whether a product can be bought right now. */
export const STOCK_GRAPH_FIELDS = [
  "variants.manage_inventory",
  "variants.allow_backorder",
  "variants.inventory_items.required_quantity",
  "variants.inventory_items.inventory.location_levels.stocked_quantity",
  "variants.inventory_items.inventory.location_levels.reserved_quantity",
]

function variantAvailable(variant: StockVariantRow): boolean {
  if (!variant) {
    return false
  }
  if (variant.manage_inventory === false || variant.allow_backorder) {
    return true
  }
  const items = variant.inventory_items ?? []
  if (!items.length) {
    return false
  }
  // A variant is available when every inventory item it needs has stock.
  return items.every((item) => {
    const required = item?.required_quantity ?? 1
    const available = (item?.inventory?.location_levels ?? []).reduce(
      (sum, level) =>
        sum + (level?.stocked_quantity ?? 0) - (level?.reserved_quantity ?? 0),
      0
    )
    return available >= required
  })
}

/** True when at least one variant can be purchased. */
export function toInStock(variants: StockVariantRow[] | null | undefined): boolean {
  return (variants ?? []).some(variantAvailable)
}
