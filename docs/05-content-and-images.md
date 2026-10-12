# 05 - Content, Images & Admin Guide

## Demo photography (replace before launch)

The demo catalogue uses photos from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license) (free for commercial use, no attribution
required). They are **placeholders**: replace them with DS Wardrobe's own product shoots.
No images or text were copied from the DS Wardrobe Instagram account or any other store.

Every demo image was reviewed by eye; shots showing third-party brand logos or
trademarked packaging (e.g. designer perfume bottles, branded prints, denim back-pocket
tabs) were removed. Image ids are listed in `apps/backend/src/scripts/seed-data.ts`.

The demo reviews in the seed are sample data for development; delete them in
Admin > Reviews before launch.

## Everyday admin tasks (http://localhost:9000/app)

| Task | Where |
|---|---|
| Add / edit a product, its photos, sizes and colours | Products > (product) > Edit / Media / Variants |
| Change a price | Products > (product) > Variants > Edit prices, or Price Lists for sales |
| Put items on sale | Pricing > Price Lists > "DS Season Sale" (type Sale) - add products and sale prices |
| Update stock | Inventory > (item) > Locations, or the variant's inventory section |
| See and process orders | Orders > (order) > Fulfill items > Mark as shipped (add tracking number) |
| Customers | Customers |
| Coupons | Promotions (e.g. `WELCOME10`, `DSFEST200`) |
| Categories / collections | Products > Categories / Collections. Add `image` to metadata for the home tiles |
| Home page hero, promo strip, announcement bar | **Banners** (custom page) |
| Approve reviews | **Reviews** (custom page) |
| Sales overview | Orders page (widget at the top) |

## Product data conventions

- **Options**: `Size` (XS-XXL), `Waist` (28-36), `Volume` (perfumes) and `Color`. These
  names drive the size chips, colour swatches and the shop filters.
- **Colour photos**: put the colour's image URLs (comma separated) in the variant metadata
  key `images`, or attach images to the variant. The gallery switches when the shopper
  picks that colour.
- **Product metadata** keys shown as Specifications: `fabric`, `fit`, `care`, `neck`,
  `collar`, `length`, `set`, ... (any key). `size_guide` = `tops` | `bottoms` | `dresses` |
  `none` selects the size chart.
- **Tags**: `new-arrival`, `bestseller`, `festive`, `sale` (badges, home rails, filters).
- **Stock**: variants use managed inventory at the "DS Wardrobe Warehouse" location.
  Zero stock = the size is struck through and cannot be added to the bag.

## Swatch colours

Swatches map common colour names to hex values in
`apps/storefront/src/lib/util/product.ts` (`COLOR_SWATCHES`). Add new colour names there.
