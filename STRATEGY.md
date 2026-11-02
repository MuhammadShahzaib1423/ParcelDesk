# ParcelDesk — Complete Strategy

Last updated: 2 November 2026. Owner: Muhammad Shahzaib.
Status: Phase A is the build target. Everything in this file is scoped to a
frontend-only demo app (React + localStorage). A real production service
would need a backend; that is Phase B, not this build.

## 1. The problem (in one paragraph)

Small sellers in Pakistan sell through Instagram, TikTok and WhatsApp DMs.
There is no shop checkout for them here: PayPal, Stripe and Shopify Payments
do not serve Pakistan-based merchants, and Instagram Shop / TikTok Shop are
not available in Pakistan. Orders arrive as chat messages, addresses are
retyped by hand, and almost everything ships cash-on-delivery. In one large
Pakistani retailer's ~170,000 orders (June 2025–May 2026, OrderNation study),
94.5% were COD and COD orders were cancelled 37.3% of the time, versus 2.8%
for prepaid orders. Every failed parcel costs the seller courier charges
both ways. ParcelDesk exists to cut that loss.

## 2. The product (in one sentence)

One ordering link per seller: customers order through a validated form,
confirm the order before anything ships, and the seller runs every order,
return and courier sheet from one dashboard.

## 3. Who pays

The seller. The pain is theirs (return fees, wasted packing time, lost stock
days). Pricing to test with real sellers (unverified): free up to 30
orders/month, then PKR 1,500–3,000/month. No commission, no payment
handling in v1 — the seller collects COD through their courier as today.

## 4. The gap the user found: how does the seller know a parcel was returned?

Today (before Phase A): they don't, not from the app. "Returned" is only a
status the seller sets by hand, with no courier name, no tracking number, no
reason and no fee recorded. The order simply says Returned and the trail
goes cold. That is incomplete, and Phase A fixes it with three connected
ways of knowing — a seller should never have to guess:

1. **Record a return (manual, 30 seconds).** From any shipped order: courier
   company, tracking/AWB number, return reason (refused at door / wrong
   address / customer unreachable / moved / damaged / other), return date,
   return fee charged, and a note. The order moves to "Return in transit",
   then "Returned to seller" when the parcel is physically back. The RTO log,
   stats, funnel, city risk board, trust score and savings meter all update
   from the same record. No return exists in the app unless it is recorded
   this way or imported (see 2).
2. **Courier sheet import (how sellers really find out).** Couriers send a
   daily delivery/return sheet (CSV). The seller uploads it; ParcelDesk
   matches rows to orders by tracking number first, then phone number;
   shows a preview (matched / already-updated / unmatched) and only applies
   what the seller approves. Unmatched rows are listed, never silently
   dropped. A sample sheet format is documented in the app so the seller
   knows which columns to keep.
3. **Tracking numbers end to end.** Every shipped order carries a courier +
   AWB number. The customer-facing Track Order page (phone number + order
   ID) shows a plain timeline: Placed → Confirmed → Packed → Shipped →
   Delivered, or the return branch: Return in transit → Returned to seller.
   The seller sees the same timeline in the order detail.

Rule: a return is only "complete" when the parcel is marked "Returned to
seller" (physically received) or the import confirms it. "Return in
transit" is a waiting state, shown separately in stats so in-flight returns
are never counted as money lost before the parcel is back.

## 5. Complete feature map (Phase A — this build)

### A. Storefront & ordering (already built — keep, do not regress)
- Seller ordering page per seller, search/filter/sort, product cards.
- Validated checkout: name, Pakistani mobile, address, city, live delivery
  calculator (PKR 200 same-city / 350 other-city), duplicate-order guard,
  returning-customer quick fill, buyer trust badge.
- Confirmation loop: order starts "Awaiting confirmation" with a
  seller-set expiry window and live countdown; auto-expires; demo
  confirmation flips it to Confirmed.

### B. Returns command centre (NEW — the core of this build)
- Record Return form (Section 4.1) on shipped/delivered orders and from a
  dedicated Returns page.
- Return statuses: "Return in transit" → "Returned to seller" (plus the
  existing "Returned" kept as a legacy alias that maps to "Returned to
  seller" in stats; seed data migrated by normalisation, not by editing
  history the user can see).
- RTO log: every return listed with courier, AWB, reason, fee, dates and
  days-in-transit; filter by reason and courier.
- Return cost accounting: total return fees, fee per returned parcel, and
  the savings meter updated so confirmed-then-delivered orders still count
  as saved return fees.
- Trust score impact: a return recorded against a phone number lowers that
  number's trust badge on future orders (visible in checkout and dashboard).

### C. Courier sheet import (NEW)
- Upload CSV (.csv only, size-guarded). Parse in-browser (no upload to any
  server). Column detection for: tracking number, phone, status, reason,
  date, fee. Accepts common header spellings (AWB / tracking / cn / phone /
  mobile / status / remarks / reason / date / fee / charges).
- Preview table grouped as: will update (matched), already current,
  unmatched (with reason: no order found). Seller ticks which rows apply.
- Applying an import writes statuses, return records and fees exactly as
  if recorded by hand, and stamps each order with import source + date.
- Downloadable sample CSV + in-app column guide. Import history list
  (date, file name, rows applied) stored locally.

### D. Tracking & customer view (NEW)
- AWB + courier fields on every order from Packed onward (editable in
  order detail).
- Public Track Order page (`/track`): phone + order ID lookup against
  local history; timeline view; plain-words status explanations; "what
  happens next" line per state. Wrong details show a helpful no-match
  message, never another customer's data beyond the matched order itself
  (demo scope: local data only).
- Courier sheet export (existing) extended: adds courier, AWB, return
  reason and return fee columns; import and export formats are compatible
  with each other.

### E. Seller product management (NEW)
- Dashboard Products page: add, edit, delete products; stock states (In
  stock / Low stock / Only N left / Out of stock — out-of-stock products
  cannot be added to cart); price and compare-at price; category; badge.
- Changes reflect immediately on the storefront and persist in
  localStorage. Seed products remain the starting catalogue.

### F. Order actions & follow-up (NEW)
- From order detail: advance status (guarded: cannot skip confirmation for
  unconfirmed orders; cannot mark Delivered before Shipped), reship a
  returned order (creates a linked follow-up order marked "Reship of
  PD-xxxx"), record refund/note, resend confirmation (resets the expiry
  window once, stamped), and flag a phone number (forces "Careful" trust
  until the seller clears it).
- Activity timeline per order: every status change, return, import,
  reship and note, with timestamps.

### G. Reports & reminders (NEW)
- Weekly summary band: orders, confirmation rate, delivered rate, return
  rate, return fees, top return reason, riskiest city — for the last 7
  days vs the previous 7 days, computed from local data.
- Reminders list: unconfirmed orders near expiry, returns in transit over
  5 days, flagged numbers with new orders.
- Printable weekly report (print stylesheet; uses the browser print
  dialog) and full-data CSV export (orders + returns in one file).

### H. Setup, SEO & polish (keep + extend)
- Settings extended: courier return fee, confirmation window (existing),
  default courier, shop announcement line shown on the storefront.
- Onboarding checklist on the dashboard (add a product, place a test
  order, record a test return, import a sample sheet) with demo-data
  reset button ("Restore demo data").
- New routes added to sitemap.xml and nav: /track, /dashboard/returns,
  /dashboard/products, /dashboard/reports. JSON-LD untouched except
  where a new page needs it.
- Animations and reduced-motion support preserved; no new dependencies;
  zero binary images; calm sage/cream design kept (theme question from
  the user is open — do not re-theme in this build).

## 6. Data model additions (all optional fields, backfilled by normalisation)

Order: `courier` (string), `awb` (string), `returnInfo` { reason, fee,
returnedAt, receivedAt, courier, awb, note, source: "manual" | "import",
importFile }, `timeline` [{ at, event, by }], `reshipOf` (order id or
null), `flagged` (bool), `refundNote` (string).
Product: `stockQty` (number), `active` (bool).
Settings: `defaultCourier`, `announcement`.
Import: `imports` [{ at, fileName, applied, unmatched }] stored separately.

## 7. Status lifecycle (complete)

New → Awaiting confirmation → Confirmed → Packed → Shipped → Delivered.
Awaiting confirmation → Expired — not confirmed (countdown).
Shipped/Delivered → Return in transit → Returned to seller.
Returned to seller → (reship) → new linked order at Confirmed.
Any state → note/refund/flag actions do not change status.

## 8. Deliberately NOT in Phase A

No courier API integration, no WhatsApp Business API, no payment gateway
or escrow, no user accounts or backend, no cross-device sync, no SMS/email
sending, no AI fraud scoring. The trust score, risk board and savings
meter only see history stored on the same device/browser — the app must
say so in plain words on the dashboard (already true; keep it visible).
Real deployment (Phase B) needs: backend + database, seller accounts,
courier API or sheet-email ingestion, and hosted confirmation links.

## 9. Validation plan (from research, unchanged)

Week 1: interview 10 social sellers, collect 3 real courier sheets. KILL
the project direction if fewer than 5 sellers do 20+ COD orders/week and
say DM retyping costs 30+ minutes/day — then pivot to the runner-up idea
(freelancer direct-client kit). Pricing (PKR 1,500–3,000/month) is
unverified until Week 4 seller conversations.

## 10. Definition of done (Phase A)

`npm run build` passes with no errors; all 6 original routes plus the 4
new routes return 200 in preview; every feature in Section 5 works with
seed + locally created data (no dead buttons); returns recorded by hand
and by import produce identical records; the funnel, risk board, trust
score and savings meter all move when a return is recorded; README
documents the new features with demo steps; STRATEGY.md ships in the repo.
