import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const isProd = process.env.NODE_ENV === "production"
const redisUrl = process.env.REDIS_URL

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See apps/backend/.env.template`)
  }
  return value
}

// Secrets must be real values in production; never fall back to defaults there.
const jwtSecret = isProd ? requireEnv("JWT_SECRET") : process.env.JWT_SECRET || "dev-only-jwt-secret"
const cookieSecret = isProd
  ? requireEnv("COOKIE_SECRET")
  : process.env.COOKIE_SECRET || "dev-only-cookie-secret"

const razorpayEnabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
const s3Enabled = Boolean(process.env.S3_BUCKET)

const paymentProviders = [
  ...(razorpayEnabled
    ? [
        {
          resolve: "./src/modules/razorpay",
          id: "razorpay",
          options: {
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
            webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
          },
        },
      ]
    : []),
]

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret,
      cookieSecret,
    },
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    // DS Wardrobe custom domain modules
    { resolve: "./src/modules/product-review" },
    { resolve: "./src/modules/wishlist" },
    { resolve: "./src/modules/content" },

    // Payments: system provider (Cash on Delivery) is always available; Razorpay when configured
    {
      resolve: "@medusajs/medusa/payment",
      options: { providers: paymentProviders },
    },

    // Product media: S3-compatible object storage in production, local disk otherwise
    ...(s3Enabled
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.S3_FILE_URL,
                    access_key_id: process.env.S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                    region: process.env.S3_REGION,
                    bucket: process.env.S3_BUCKET,
                    endpoint: process.env.S3_ENDPOINT,
                  },
                },
              ],
            },
          },
        ]
      : []),

    // Redis-backed infrastructure modules when REDIS_URL is set (required in production)
    ...(redisUrl
      ? [
          { resolve: "@medusajs/medusa/cache-redis", options: { redisUrl } },
          { resolve: "@medusajs/medusa/event-bus-redis", options: { redisUrl } },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: { redis: { url: redisUrl } },
          },
          {
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: { redisUrl },
                },
              ],
            },
          },
        ]
      : []),
  ],
})

