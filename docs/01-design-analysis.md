# 01 — Brand & Design Analysis

Reference: https://www.instagram.com/ds__wardrobe__/ (reviewed October 2026).
DS Wardrobe commissioned this website, so the brand name, monogram and voice are used directly.
Photography in the demo catalogue is licensed stock (see `docs/05-content-and-images.md`)
and is meant to be replaced with DS Wardrobe's own shoots from the admin panel.

## What the Instagram presence tells us

| Signal | Observation | What it means for the site |
|---|---|---|
| Logo | Black ink-brush stroke behind a white serif **DS** monogram, "DS WARDROBE" small caps underneath | Monochrome identity. Black + off-white carries the brand; colour comes from the clothes. |
| Bio | "Your style is Ur personal brand", "where fashion meets purpose", "DM for orders", "India-wide shipping" | Confident, personal, youthful tone. Today orders happen over DM; the site must make ordering *easier than a DM*: fast mobile checkout, COD, clear sizes. |
| Product mix | Menswear (jackets, shirts, denim, graphic / oversized tees), a **DS Women's Wear** line (dresses, kurtis, tops, net/party dresses), perfumes (UMIRA), gifts, teddies | Two primary departments (Men, Women) plus an Accessories & Gifts department. |
| Highlights | "New stock", "deals", "happy customers", "Winner's", "Our store", "orders" | Home page needs **New Arrivals**, a **Deals / Sale** strip, social proof (reviews / customer love), and a "Visit our store" block. |
| Content style | Reels-first, bold poster typography, high-contrast dark visuals, celebrity / film tie-ins, festive drops | Editorial, high-contrast hero. Large uppercase display type, generous imagery, short punchy copy. |
| Audience | Instagram-native, mobile, India (Telugu-region audience visible) | Mobile-first, INR pricing, Cash on Delivery, UPI-friendly payment provider (Razorpay), WhatsApp/Instagram touch points. |

## Design direction: "Ink & Ivory"

- **Palette** — Ink `#0E0E0E`, Ivory `#F6F3EE`, Stone `#E7E2DA`, Ash `#8A857D`, accent
  Ember `#C8371D` used *only* for sale prices, badges and urgent states. Success `#1F7A4D`.
- **Typography** — Display: *Bebas Neue* style condensed uppercase for headlines (poster energy
  from the reels). Body/UI: *Inter* for legibility at small sizes. Serif accent: *Cormorant* italic for
  the occasional editorial line (echoes the serif monogram).
- **Shape** — Square corners on product imagery, 2px radius on buttons and inputs. Thin 1px
  ink rules instead of shadows. Feels like a printed lookbook, not a SaaS dashboard.
- **Motion** — Subtle: image zoom on hover (desktop only), slide-in cart drawer, marquee
  announcement bar. Respect `prefers-reduced-motion`.
- **Photography** — Portrait 3:4 product cards, full-bleed editorial hero, lifestyle imagery
  for collections.

## Voice

Short, confident, second person. "Your style. Your statement." "New drop just landed." Never
corporate. Use the brand's lightning-bolt energy in copy rather than emoji in the UI.

## Key UX decisions

1. **Thumb-zone navigation** on mobile: sticky header with search + cart, bottom-sheet filters,
   sticky "Add to bag" bar on the product page.
2. **Size-first purchase**: sizes shown as large tappable chips; out-of-stock sizes are struck through
   and disabled; size guide one tap away.
3. **COD + online payment** at checkout, both first-class.
4. **Guest checkout by default**, account creation optional after the order.
5. **Trust**: easy returns note, India-wide shipping, reviews on PDP, order tracking page that
   does not require login (order number + email).
6. Every data-driven view ships **loading skeletons, empty states and error states**.
