import Medusa from "@medusajs/js-sdk"
import { config } from "./config"

/**
 * Single Medusa JS SDK instance. Auth is handled explicitly (JWT stored in an
 * httpOnly cookie and passed per request), so the SDK itself stays stateless
 * and safe to share between server requests.
 */
export const sdk = new Medusa({
  baseUrl: config.backendUrl,
  publishableKey: config.publishableKey,
  debug: process.env.NODE_ENV === "development" && process.env.MEDUSA_SDK_DEBUG === "true",
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
})
