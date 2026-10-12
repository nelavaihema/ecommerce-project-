import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import RazorpayProviderService from "./service"

/**
 * Razorpay payment provider (UPI, cards, netbanking, wallets) for India.
 * Registered as `pp_razorpay_razorpay` when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are set.
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [RazorpayProviderService],
})
