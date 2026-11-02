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
| `/track` | Track Order page — phone number + order ID lookup with a plain-words timeline |
| `/dashboard` | Seller dashboard — stats, funnel, RTO log, orders table, courier CSV export, onboarding checklist |
| `/dashboard/returns` | Returns command centre — record returns by hand, import courier sheets (CSV), RTO log, import history |
| `/dashboard/products` | Product management — add, edit, delete, stock quantities, show/hide |
| `/dashboard/reports` | Weekly summary (last 7 days vs previous 7), reminders, printable report, full-data CSV export |
| `/dashboard/settings` | Seller settings — shop details, delivery charges, confirmation message, default courier, announcement |
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

## Phase A: returns, tracking, products & reports

The complete strategy lives in [`STRATEGY.md`](STRATEGY.md), which ships in
this repo. Its core question: **how does the seller know a parcel came back?**
Before Phase A, "Returned" was only a status set by hand, with no courier,
tracking number, reason or fee. Phase A fixes that with three connected ways
of knowing, all writing the same record:

### 1. Returns command centre (`/dashboard/returns`)

- **Record a return by hand** — from any Shipped or Delivered order: courier
  company, tracking/AWB number, return reason, return date, return fee and a
  note. The order moves to **Return in transit**, then **Returned to seller**
  when the parcel is physically back (the form has a checkbox for "already
  back"). The RTO log, stats, funnel, city risk board, trust score and savings
  meter all update from the same record. Demo: open Returns, choose order
  PD-1043 (Shipped), fill in the form, and watch the dashboard move.
- **Return statuses**: `Return in transit → Returned to seller`. The old
  `Returned` status is kept as a legacy alias that counts exactly like
  `Returned to seller` in stats. Returns in transit are shown separately and
  are never counted as money lost before the parcel is back.
- **RTO log** — every return with courier, AWB, reason, fee, dates and days
  spent away; filter by reason and courier; "Mark parcel received" for
  in-transit returns.
- **Return cost accounting** — total return fees and fee per returned parcel.
  A return recorded against a phone number lowers that number's trust badge
  on future orders.

### 2. Courier sheet import (on `/dashboard/returns`)

Couriers send a daily delivery/return sheet as CSV. Upload it and ParcelDesk
parses it fully in the browser (nothing is uploaded anywhere), matches rows to
orders by tracking number first, then phone number, and shows a preview
grouped as **will update / already current / unmatched**. Only the rows the
seller ticks are applied — and applying writes exactly what a hand recording
writes, stamped with the file name. Unmatched rows are listed, never silently
dropped. The page includes a **downloadable sample sheet** (filled with the
demo orders' own tracking numbers, so the preview matches on first try) and a
**column guide** for accepted headings (AWB / tracking / CN, phone / mobile,
status / remarks, reason, date, fee / charges). Import history (date, file
name, rows applied) is stored locally. Import and export formats are
compatible with each other.

### 3. Tracking end to end + Track Order page (`/track`)

- Every order from Packed onward carries a **courier + AWB number**, editable
  in the order detail panel.
- `/track` — the customer enters their mobile number and order ID and sees a
  plain-words timeline (Placed → Confirmed → Packed → Shipped → Delivered, or
  the return branch), a "what happens next" line per state, and the courier +
  tracking number. Wrong details show a helpful no-match message and no other
  customer's data. Demo: track **PD-1043** with phone **0333-7788990**, or
  **PD-1042** with **0312-4455667** to see the return branch.
- The courier-sheet export (dashboard) now adds courier, AWB, return reason
  and return fee columns.

### 4. Product management (`/dashboard/products`)

Add, edit and delete products; set price, compare-at price, category, badge,
picture style and **stock quantity**. Stock decides the shop label (0 = Out of
stock and the product cannot be added to an order; 1–3 = Only N left; 4–5 =
Low stock) and the show/hide toggle removes a product from the shop without
deleting it. Changes appear on the storefront immediately and persist in
`localStorage`. Past orders are never changed by catalogue edits.

### 5. Order actions & activity timeline (order detail, `/dashboard`)

From any order's detail panel: advance one step at a time (an order cannot
skip confirmation or be marked Delivered before it ships), record a return,
mark a return received, **reship** a returned order (creates a linked
follow-up order marked "Reship of PD-xxxx" starting at Confirmed), **resend
confirmation** once (resets the expiry window, stamped), **flag a phone
number** (forces "Careful" trust until cleared), edit courier/AWB, and record
notes/refunds. Every change lands in the order's **activity timeline**, also
shown on the Track page.

### 6. Reports & reminders (`/dashboard/reports`)

- **Weekly summary**: orders, confirmation rate, delivered rate, return rate,
  return fees, top return reason, riskiest city and savings — last 7 days vs
  the previous 7 days, computed from local data.
- **Reminders**: unconfirmed orders expiring within 2 hours, returns in
  transit over 5 days, and new orders from flagged numbers.
- **Printable weekly report** (browser print dialog, print stylesheet) and a
  **full-data CSV export** (orders + returns in one file).
- **Onboarding checklist** on the dashboard (add a product, place a test
  order, record a test return, import a sample sheet) plus a **Restore demo
  data** button. Settings gained a default courier and a shop announcement
  line shown on the storefront.

### Honest limits (shown in the app)

The trust score, city risk board and savings meter only see order history
stored in the same browser on the same device. There is no backend, no
courier API, no WhatsApp integration and no cross-device sync in this build —
those are Phase B. The dashboard says so in plain words.

## How the demo works

- Place an order through any shop's checkout and it appears in the dashboard
  immediately (shared state, persisted in `localStorage`).
- After placing an order you get a confirmation screen with a **Simulate customer
  confirmation** button — this stands in for the confirmation message the customer
  would receive in the real product.
- In the dashboard, click any order to see its detail and advance its status
  one step at a time (New → Awaiting confirmation → Confirmed → Packed →
  Shipped → Delivered), record a return, reship it, flag the number, or add a
  note/refund — every action lands in the order's activity timeline. The
  **Download courier sheet (CSV)** button exports the currently filtered
  orders as a real CSV file, including each order's trust score, courier,
  tracking number, return reason and return fee.
- Returns recorded by hand and returns applied from a courier-sheet import
  produce identical records: same statuses, same RTO log rows, same effect on
  the funnel, risk board, trust score and savings meter.
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
