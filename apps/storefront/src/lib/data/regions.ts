import "server-only"
import type { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { sdk } from "../sdk"
import { config } from "../config"

/**
 * The store sells in a single region (India). The region is resolved from the
 * configured country so a second region can be added later without code changes.
 */
export const getRegion = cache(async (): Promise<HttpTypes.StoreRegion | null> => {
  const { regions } = await sdk.client.fetch<HttpTypes.StoreRegionListResponse>(
    "/store/regions",
    { method: "GET", next: { revalidate: 3600, tags: ["regions"] } }
  )
  const country = config.defaultCountry
  return (
    regions.find((r) => r.countries?.some((c) => c.iso_2 === country)) ??
    regions[0] ??
    null
  )
})
