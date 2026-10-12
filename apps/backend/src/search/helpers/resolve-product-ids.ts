import type {
  RemoteQueryFunction,
  SearchTypes,
} from "@medusajs/framework/types";

const RESOLVE_BATCH_SIZE = 200;

// Core emits either a single `{ id }` or a batch of them.
function payloadIds(data: unknown): string[] {
  return (Array.isArray(data) ? data : [data])
    .map((entry) => (entry as { id?: string } | undefined)?.id)
    .filter((id): id is string => Boolean(id));
}

/**
 * The products behind rows of another entity, read through `query.graph`.
 * Deleted rows are soft-deleted, so they're still readable with `withDeleted`,
 * which is how a deleted variant or category still leads back to its products.
 */
async function relatedProductIds(
  query: RemoteQueryFunction,
  entity: string,
  fields: string[],
  ids: string[],
  pick: (row: Record<string, any>) => (string | null | undefined)[],
  withDeleted: boolean,
): Promise<string[]> {
  const { data } = await query.graph({
    entity,
    fields,
    filters: { id: ids },
    withDeleted,
  });

  return (data as Record<string, any>[])
    .flatMap(pick)
    .filter((id): id is string => Boolean(id));
}

/**
 * Deleting a sales channel removes its product links, so the products can no
 * longer be found through `query.graph`. The index still holds the channel on
 * each document, which is what's searched here.
 */
async function productIdsInSalesChannels(
  query: RemoteQueryFunction,
  salesChannelIds: string[],
): Promise<string[]> {
  const ids: string[] = [];
  let skip = 0;

  while (true) {
    const { search_result: result } = await query.search({
      entity: "product",
      fields: ["id"],
      filters: { sales_channel_ids: salesChannelIds },
      pagination: { skip, take: RESOLVE_BATCH_SIZE },
    });

    ids.push(...result.hits.map((hit) => hit.id));

    if (result.hits.length < RESOLVE_BATCH_SIZE) {
      return ids;
    }

    skip += RESOLVE_BATCH_SIZE;
  }
}

/**
 * Inventory levels and reservations point at an inventory item, which is linked
 * to the variants (and so the products) that sell it.
 */
async function productIdsForInventory(
  query: RemoteQueryFunction,
  entity: "inventory_level" | "reservation_item",
  ids: string[],
  withDeleted: boolean,
): Promise<string[]> {
  const itemIds = await relatedProductIds(
    query,
    entity,
    ["inventory_item_id"],
    ids,
    (row) => [row.inventory_item_id],
    withDeleted,
  );
  if (!itemIds.length) {
    return [];
  }
  const { data } = await query.graph({
    entity: "inventory_item",
    fields: ["variants.product_id"],
    filters: { id: Array.from(new Set(itemIds)) },
  });
  return (data as Record<string, any>[])
    .flatMap((row) => (row.variants ?? []).map((variant: any) => variant?.product_id))
    .filter((id): id is string => Boolean(id));
}

/**
 * The products an event affects. A product event carries them directly; an
 * event about a variant, option, tag, category or sales channel is mapped to
 * the products behind it.
 */
export async function resolveProductIds(
  event: { name: string; data: unknown },
  { container: { query } }: SearchTypes.SearchIngestionContext,
): Promise<string[]> {
  const ids = payloadIds(event.data);

  if (!ids.length) {
    return [];
  }

  // Module-level events are prefixed with the module name ("inventory.inventory-level.updated").
  const name = event.name.startsWith("inventory.")
    ? event.name.slice("inventory.".length)
    : event.name;
  const [entity] = name.split(".");
  const deleted = name.endsWith(".deleted");

  switch (entity) {
    case "product":
      return ids;
    case "product-variant":
      return relatedProductIds(
        query,
        "product_variant",
        ["product_id"],
        ids,
        (row) => [row.product_id],
        deleted,
      );
    case "product-option":
      return relatedProductIds(
        query,
        "product_option",
        ["product_id"],
        ids,
        (row) => [row.product_id],
        deleted,
      );
    case "product-option-value":
      return relatedProductIds(
        query,
        "product_option_value",
        ["option.product_id"],
        ids,
        (row) => [row.option?.product_id],
        deleted,
      );
    case "product-tag":
      return relatedProductIds(
        query,
        "product_tag",
        ["products.id"],
        ids,
        (row) => (row.products ?? []).map((product: any) => product?.id),
        deleted,
      );
    case "product-category":
      return relatedProductIds(
        query,
        "product_category",
        ["products.id"],
        ids,
        (row) => (row.products ?? []).map((product: any) => product?.id),
        deleted,
      );
    case "inventory-level":
      return productIdsForInventory(query, "inventory_level", ids, deleted);
    case "reservation-item":
      return productIdsForInventory(query, "reservation_item", ids, deleted);
    case "sales-channel":
      return productIdsInSalesChannels(query, ids);
    default:
      return [];
  }
}
