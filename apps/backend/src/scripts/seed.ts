/**
 * Seeds DS Wardrobe for local development / demo:
 *   store (INR, tax inclusive) - India region - GST tax region - warehouse - shipping
 *   - publishable key - categories - collections - products/variants/prices/stock
 *   - sale price list - coupons - home banners - demo reviews - search index.
 *
 *   npm run seed            (from apps/backend)   or   npm run backend:seed (repo root)
 *
 * Safe to re-run: each section skips what already exists.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { CONTENT_MODULE } from "../modules/content"
import type ContentModuleService from "../modules/content/service"
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review"
import type ProductReviewModuleService from "../modules/product-review/service"
import { createBannerWorkflow } from "../workflows/content/banners"
import { BANNERS, CATEGORIES, COLLECTIONS, DEMO_REVIEWS, PRODUCTS, SeedProduct } from "./seed-data"

const CURRENCY = "inr"
const COUNTRY = "in"
const GST_RATE = 5 // apparel <= Rs 2,500 (GST 2.0). Adjust per HSN in admin as needed.

/** Deterministic pseudo-random stock so demo data is the same on every machine. */
function stockFor(pattern: SeedProduct["stock"], index: number) {
  const n = (index * 7919 + 13) % 17
  switch (pattern) {
    case "soldout":
      return 0
    case "low":
      return n % 4 === 0 ? 0 : (n % 3) + 1
    case "mixed":
      return n % 5 === 0 ? 0 : n % 3 === 0 ? 2 : 8 + n
    default:
      return 15 + n
  }
}

function combinations(options: SeedProduct["options"]): Record<string, string>[] {
  return options.reduce<Record<string, string>[]>(
    (acc, option) =>
      acc.flatMap((combo) => option.values.map((value) => ({ ...combo, [option.title]: value }))),
    [{}]
  )
}

function skuFor(handle: string, combo: Record<string, string>) {
  const base = handle
    .split("-")
    .map((w) => w.slice(0, 3))
    .join("")
    .toUpperCase()
    .slice(0, 12)
  const suffix = Object.values(combo)
    .map((v) => v.replace(/\s+/g, "").toUpperCase())
    .join("-")
  return `DS-${base}-${suffix}`
}

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const storeService = container.resolve(Modules.STORE)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const regionService = container.resolve(Modules.REGION)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const apiKeyService = container.resolve(Modules.API_KEY)
  const productService = container.resolve(Modules.PRODUCT)
  const promotionService = container.resolve(Modules.PROMOTION)
  const taxService = container.resolve(Modules.TAX)

  // ---------------------------------------------------------------- store + channel
  logger.info("[seed] store & sales channel")
  let [salesChannel] = await salesChannelService.listSalesChannels({ name: "DS Wardrobe Online" })
  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          { name: "DS Wardrobe Online", description: "Website storefront" },
        ],
      },
    })
    salesChannel = result[0]
  }

  const supported = [{ currency_code: CURRENCY, is_default: true, is_tax_inclusive: true }]
  let [store] = await storeService.listStores()
  if (!store) {
    const { result } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "DS Wardrobe",
            supported_currencies: supported,
            default_sales_channel_id: salesChannel.id,
          },
        ],
      },
    })
    store = result[0]
  } else {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: "DS Wardrobe",
          supported_currencies: supported,
          default_sales_channel_id: salesChannel.id,
        },
      },
    })
  }

  // ---------------------------------------------------------------- region + taxes
  logger.info("[seed] region & taxes")
  const razorpayEnabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  const paymentProviders = ["pp_system_default", ...(razorpayEnabled ? ["pp_razorpay_razorpay"] : [])]
  let [region] = await regionService.listRegions({ name: "India" })
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "India",
            currency_code: CURRENCY,
            countries: [COUNTRY],
            payment_providers: paymentProviders,
            automatic_taxes: true,
            is_tax_inclusive: true,
          },
        ],
      },
    })
    region = result[0]
  }

  const [taxRegion] = await taxService.listTaxRegions({ country_code: COUNTRY })
  if (!taxRegion) {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: COUNTRY,
          provider_id: "tp_system",
          default_tax_rate: { name: "GST", code: "GST", rate: GST_RATE },
        },
      ],
    })
  }

  // ---------------------------------------------------------------- warehouse + shipping
  logger.info("[seed] stock location & shipping")
  let [location] = await stockLocationService.listStockLocations({ name: "DS Wardrobe Warehouse" })
  if (!location) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "DS Wardrobe Warehouse",
            address: { address_1: "Main warehouse", country_code: "IN" },
          },
        ],
      },
    })
    location = result[0]
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [salesChannel.id] },
    })
  }

  let [shippingProfile] = await fulfillmentService.listShippingProfiles({ type: "default" })
  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Default Shipping Profile", type: "default" }] },
    })
    shippingProfile = result[0]
  }

  const [existingSet] = await fulfillmentService.listFulfillmentSets(
    { name: "India delivery" },
    { relations: ["service_zones"] }
  )
  if (!existingSet) {
    const fulfillmentSet = await fulfillmentService.createFulfillmentSets({
      name: "India delivery",
      type: "shipping",
      service_zones: [
        { name: "India", geo_zones: [{ country_code: COUNTRY, type: "country" }] },
      ],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    const zoneId = fulfillmentSet.service_zones[0].id
    const rules = [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ]
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Delivery",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zoneId,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Standard", description: "Delivered in 4-7 business days.", code: "standard" },
          prices: [
            { currency_code: CURRENCY, amount: 99 },
            { region_id: region.id, amount: 99 },
            // Free above Rs 1,499 (cart item total)
            {
              currency_code: CURRENCY,
              amount: 0,
              rules: [{ attribute: "item_total", operator: "gte", value: 1499 }],
            },
            {
              region_id: region.id,
              amount: 0,
              rules: [{ attribute: "item_total", operator: "gte", value: 1499 }],
            },
          ],
          rules,
        },
        {
          name: "Express Delivery",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zoneId,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Express", description: "Delivered in 1-3 business days.", code: "express" },
          prices: [
            { currency_code: CURRENCY, amount: 199 },
            { region_id: region.id, amount: 199 },
          ],
          rules,
        },
      ],
    })
  }

  // ---------------------------------------------------------------- publishable key
  logger.info("[seed] publishable API key")
  let [apiKey] = await apiKeyService.listApiKeys({ type: "publishable", title: "DS Wardrobe Storefront" })
  if (!apiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "DS Wardrobe Storefront", type: "publishable", created_by: "" }] },
    })
    apiKey = result[0]
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: apiKey.id, add: [salesChannel.id] },
    })
  }

  // ---------------------------------------------------------------- categories
  logger.info("[seed] categories")
  const existingCategories = await productService.listProductCategories(
    { handle: CATEGORIES.map((c) => c.handle) },
    { take: null }
  )
  const categoryIds = new Map(existingCategories.map((c) => [c.handle, c.id]))
  for (const level of [false, true]) {
    const batch = CATEGORIES.filter((c) => Boolean(c.parent) === level && !categoryIds.has(c.handle))
    if (!batch.length) {
      continue
    }
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: batch.map((c, i) => ({
          name: c.name,
          handle: c.handle,
          description: c.description,
          is_active: true,
          rank: CATEGORIES.indexOf(c),
          parent_category_id: c.parent ? categoryIds.get(c.parent) : undefined,
          metadata: c.image ? { image: c.image } : undefined,
        })),
      },
    })
    result.forEach((c) => categoryIds.set(c.handle, c.id))
  }

  // ---------------------------------------------------------------- collections
  logger.info("[seed] collections")
  const existingCollections = await productService.listProductCollections(
    { handle: COLLECTIONS.map((c) => c.handle) },
    { take: null }
  )
  const collectionIds = new Map(existingCollections.map((c) => [c.handle, c.id]))
  const missingCollections = COLLECTIONS.filter((c) => !collectionIds.has(c.handle))
  if (missingCollections.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: missingCollections.map((c) => ({
          title: c.title,
          handle: c.handle,
          metadata: { subtitle: c.subtitle, image: c.image },
        })),
      },
    })
    result.forEach((c) => collectionIds.set(c.handle, c.id))
  }

  // ---------------------------------------------------------------- tags
  const tagValues = Array.from(new Set(PRODUCTS.flatMap((p) => p.tags ?? [])))
  const existingTags = await productService.listProductTags({ value: tagValues }, { take: null })
  const tagIds = new Map(existingTags.map((t) => [t.value, t.id]))
  const missingTags = tagValues.filter((v) => !tagIds.has(v))
  if (missingTags.length) {
    const created = await productService.createProductTags(missingTags.map((value) => ({ value })))
    created.forEach((t) => tagIds.set(t.value, t.id))
  }

  // ---------------------------------------------------------------- products
  logger.info("[seed] products")
  const existingProducts = await productService.listProducts(
    { handle: PRODUCTS.map((p) => p.handle) },
    { select: ["id", "handle"], take: null }
  )
  const existingHandles = new Set(existingProducts.map((p) => p.handle))
  const toCreate = PRODUCTS.filter((p) => !existingHandles.has(p.handle))

  for (const p of toCreate) {
    const combos = combinations(p.options)
    const colorOption = p.options.find((o) => o.title === "Color")
    const allImages = Array.from(
      new Set([...p.images, ...Object.values(p.colorImages ?? {}).flat()])
    )
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: p.title,
            subtitle: p.subtitle,
            handle: p.handle,
            description: p.description,
            status: ProductStatus.PUBLISHED,
            material: p.material,
            weight: p.weight,
            origin_country: "IN",
            thumbnail: p.images[0],
            images: allImages.map((url) => ({ url })),
            category_ids: [categoryIds.get(p.category)!].filter(Boolean),
            collection_id: p.collections?.[0] ? collectionIds.get(p.collections[0]) : undefined,
            tag_ids: (p.tags ?? []).map((t) => tagIds.get(t)!).filter(Boolean),
            shipping_profile_id: shippingProfile.id,
            sales_channels: [{ id: salesChannel.id }],
            metadata: p.metadata,
            options: p.options,
            variants: combos.map((combo) => {
              const priceKey = Object.values(combo).find((v) => p.priceBy?.[v] !== undefined)
              const amount = priceKey ? p.priceBy![priceKey] : p.price
              return {
                title: Object.values(combo).join(" / "),
                sku: skuFor(p.handle, combo),
                options: combo,
                manage_inventory: true,
                allow_backorder: false,
                metadata:
                  colorOption && p.colorImages?.[combo.Color]
                    ? { images: p.colorImages[combo.Color].join(",") }
                    : undefined,
                prices: [{ amount, currency_code: CURRENCY }],
              }
            }),
          },
        ],
      },
    })
  }

  // ---------------------------------------------------------------- inventory levels
  logger.info("[seed] inventory levels")
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "variants.id",
      "variants.sku",
      "variants.prices.amount",
      "variants.inventory_items.inventory_item_id",
      "variants.inventory_items.inventory.location_levels.location_id",
    ],
    filters: { handle: PRODUCTS.map((p) => p.handle) },
  })

  const levels: { location_id: string; inventory_item_id: string; stocked_quantity: number }[] = []
  let counter = 0
  for (const product of seededProducts as any[]) {
    const def = PRODUCTS.find((p) => p.handle === product.handle)!
    for (const variant of product.variants ?? []) {
      for (const item of variant.inventory_items ?? []) {
        counter += 1
        const hasLevel = (item.inventory?.location_levels ?? []).some(
          (l: any) => l.location_id === location.id
        )
        if (!hasLevel) {
          levels.push({
            location_id: location.id,
            inventory_item_id: item.inventory_item_id,
            stocked_quantity: stockFor(def.stock, counter),
          })
        }
      }
    }
  }
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } })
  }

  // ---------------------------------------------------------------- sale price list
  logger.info("[seed] sale prices")
  const pricingService = container.resolve(Modules.PRICING)
  const [existingSale] = (await pricingService.listPriceLists({ q: "DS Season Sale" })).filter((pl) => pl.title === "DS Season Sale")
  if (!existingSale) {
    const salePrices = (seededProducts as any[]).flatMap((product) => {
      const def = PRODUCTS.find((p) => p.handle === product.handle)!
      if (!def.sale) {
        return []
      }
      return (product.variants ?? []).map((v: any) => ({
        variant_id: v.id,
        amount: def.sale!,
        currency_code: CURRENCY,
      }))
    })
    if (salePrices.length) {
      await createPriceListsWorkflow(container).run({
        input: {
          price_lists_data: [
            {
              title: "DS Season Sale",
              description: "Storewide sale prices",
              status: "active",
              starts_at: new Date().toISOString(),
              prices: salePrices,
            },
          ],
        },
      })
    }
  }

  // ---------------------------------------------------------------- promotions
  logger.info("[seed] coupons")
  const existingPromos = await promotionService.listPromotions({ code: ["WELCOME10", "DSFEST200"] })
  const promoCodes = new Set(existingPromos.map((p) => p.code))
  const promos = [
    {
      code: "WELCOME10",
      type: "standard" as const,
      status: "active" as const,
      is_automatic: false,
      application_method: {
        type: "percentage" as const,
        target_type: "items" as const,
        allocation: "across" as const,
        value: 10,
        currency_code: CURRENCY,
      },
    },
    {
      code: "DSFEST200",
      type: "standard" as const,
      status: "active" as const,
      is_automatic: false,
      application_method: {
        type: "fixed" as const,
        target_type: "order" as const,
        allocation: "across" as const,
        value: 200,
        currency_code: CURRENCY,
      },
    },
  ].filter((p) => !promoCodes.has(p.code))
  if (promos.length) {
    await createPromotionsWorkflow(container).run({ input: { promotionsData: promos } })
  }

  // ---------------------------------------------------------------- banners
  logger.info("[seed] banners")
  const content: ContentModuleService = container.resolve(CONTENT_MODULE)
  const [, bannerCount] = await content.listAndCountBanners({}, { take: 1 })
  if (!bannerCount) {
    for (const banner of BANNERS) {
      await createBannerWorkflow(container).run({ input: { ...banner, is_active: true } })
    }
  }

  // ---------------------------------------------------------------- demo reviews
  logger.info("[seed] demo reviews")
  const reviews: ProductReviewModuleService = container.resolve(PRODUCT_REVIEW_MODULE)
  const [, reviewCount] = await reviews.listAndCountReviews({}, { take: 1 })
  if (!reviewCount) {
    const idByHandle = new Map((seededProducts as any[]).map((p) => [p.handle, p.id]))
    await reviews.createReviews(
      DEMO_REVIEWS.filter((r) => idByHandle.has(r.handle)).map((r) => ({
        product_id: idByHandle.get(r.handle)!,
        author_name: r.author,
        rating: r.rating,
        title: r.title,
        content: r.content,
        status: "approved" as const,
        verified_purchase: true,
      }))
    )
  }

  // ---------------------------------------------------------------- search index
  logger.info("[seed] search index")
  const search = container.resolve(Modules.SEARCH, { allowUnregistered: true }) as any
  if (search?.ingest) {
    const ids = (seededProducts as any[]).map((p) => p.id)
    try {
      for (let i = 0; i < ids.length; i += 25) {
        await search.ingest({
          name: "product.updated",
          data: ids.slice(i, i + 25).map((id) => ({ id })),
        })
      }
    } catch (e) {
      logger.warn(
        `[seed] search index not ready (${(e as Error).message}). It is filled automatically when the server starts (npm run dev).`
      )
    }
  }

  logger.info("--------------------------------------------------------------")
  logger.info(`[seed] done. ${toCreate.length} products created.`)
  logger.info(`[seed] Region: India (${region.id}), payment providers: ${paymentProviders.join(", ")}`)
  logger.info(`[seed] Publishable API key (set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY): ${apiKey.token}`)
  logger.info("--------------------------------------------------------------")
}
