# ParcelDesk

ParcelDesk is a link-in-bio order desk for small social sellers in Pakistan — the
Instagram, TikTok and WhatsApp sellers who take orders in DMs and ship cash on
delivery (COD).

The problem it tackles: orders get lost in chat messages, and unconfirmed COD
parcels come back undelivered, leaving the seller to pay the return cost. ParcelDesk
gives each seller one ordering link. Customers order through a simple form, see the
full total including delivery, and the seller only ships after the customer confirms.

Built by Muhammad Shahzaib, Full Stack Developer, Rawalpindi.

## How to run

```bash
npm install
npm run dev      # local development server
npm run build    # production build
npm run preview  # preview the production build
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | Landing page — the problem, how it works in 3 steps, who it is for |
| `/shop/:sellerSlug` | A seller's public ordering page (demo sellers: `noor-studio`, `rose-glow`) |
| `/shop/:sellerSlug/checkout` | Validated order form with live delivery/total calculator |
| `/dashboard` | Seller dashboard — stats, funnel, RTO log, orders table, courier CSV export |
| `/dashboard/settings` | Seller settings — shop details, delivery charges, confirmation message |
| `/pricing` | Honest pricing page (free up to 30 orders/month; paid tiers marked as to be tested) |

## Unique features (found in no competing seller tool)

All five are computed live from the orders stored on the device — no backend,
no buyer data leaving the browser, no fake numbers.

1. **Buyer Trust Score** — typing a mobile number in checkout shows a live badge
   built from that number's own past orders in this shop: **Trusted** (2+ delivered,
   0 returns), **Careful** (1+ returns), **New buyer** (no history). The score is
   stored on each order and shown per order in the dashboard. Demo numbers:
   `0302-1112233` (Trusted), `0312-4455667` (Careful), any other number (New buyer).
2. **Confirmation countdown** — every "Awaiting confirmation" order has a
   seller-set expiry (default 12 hours, changeable in Shop settings). The
   dashboard shows a live countdown, and when it hits zero the order moves
   automatically to a new 8th status, **Expired — not confirmed**, which appears
   in the status filter and the funnel. Confirming (the demo button in checkout,
   or "Move to: Confirmed" in the dashboard) stops the countdown. Demo: order
   PD-1045 expires ~25 minutes after first load; PD-1058 is already expired.
3. **Duplicate-order guard** — placing an order with the same phone number for
   the same product within 24 hours shows a warning ("You already ordered this —
   did you mean to order again?") with the choice to order again anyway or go
   back. The dashboard flags such orders with a "Possible duplicate" badge.
   Demo: order PD-1057 duplicates PD-1043.
4. **City return-risk board** — the dashboard ranks cities by return rate
   (returned ÷ delivered + returned, from real stored orders) and flags the
   riskiest city with a plain-words suggestion. It updates as orders change.
5. **Returning-customer quick fill + Savings meter** — checkout has an "I ordered
   before" lookup that auto-fills name, address and city from the number's most
   recent order on the device. The dashboard's savings meter estimates money
   saved by confirmations: delivered orders that were confirmed first × the
   seller-set courier return fee (default PKR 250, changeable in settings),
   with an animated counter.

## How the demo works

- Place an order through any shop's checkout and it appears in the dashboard
  immediately (shared state, persisted in `localStorage`).
- After placing an order you get a confirmation screen with a **Simulate customer
  confirmation** button — this stands in for the confirmation message the customer
  would receive in the real product.
- In the dashboard, click any order to see its detail and advance its status
  (New → Awaiting confirmation → Confirmed → Packed → Shipped → Delivered, or
  mark it Returned). Unconfirmed orders expire on their own when their
  confirmation window runs out (see "Confirmation countdown" above). The **Download courier sheet (CSV)** button exports the
  currently filtered orders as a real CSV file, including each order's trust score.
- Settings saved in `/dashboard/settings` update the demo shop's header and the
  checkout delivery calculator, and persist in `localStorage`.

## Fictional data only

All sellers, products, customers, phone numbers and orders in this project are
invented demo data. No real business names, real people or real phone numbers are
used. No backend, no API calls, no image files — all product art is CSS gradients
and inline SVG.

## Tech

React 18 + Vite + Tailwind CSS v3 + Framer Motion + react-router-dom. SEO tags,
JSON-LD, `robots.txt` and `sitemap.xml` are included from the start.
