// Pure helpers for ParcelDesk's unique features. Everything here is computed
// from the orders already stored on this device (localStorage) — nothing is
// sent anywhere, and no buyer data leaves the browser.

export function normalizePhone(phone) {
  return String(phone || "").replace(/[\s-]/g, "");
}

// Buyer Trust Score: built only from this shop's own past orders for the number.
// "Trusted" = 2+ delivered and 0 returns. "Careful" = 1+ returns.
// Anything else (including no history) = "New buyer".
export function getTrustForPhone(orders, phone) {
  const target = normalizePhone(phone);
  const mine = (orders || []).filter((o) => normalizePhone(o.phone) === target);
  const delivered = mine.filter((o) => o.status === "Delivered").length;
  const returned = mine.filter((o) => o.status === "Returned").length;
  let label = "New buyer";
  if (returned >= 1) label = "Careful";
  else if (delivered >= 2) label = "Trusted";
  return { label, delivered, returned, total: mine.length };
}

export const TRUST_BADGE_STYLES = {
  Trusted: "bg-emerald-100 text-emerald-800",
  Careful: "bg-amber-100 text-amber-800",
  "New buyer": "bg-sky-100 text-sky-800",
};

export function trustNote(trust) {
  if (trust.total === 0)
    return "No past orders with this number in this shop's history on this device.";
  if (trust.label === "Trusted")
    return `${trust.delivered} past orders delivered, no returns. A reliable buyer.`;
  if (trust.label === "Careful")
    return `${trust.returned} past order${trust.returned > 1 ? "s were" : " was"} returned — confirm carefully before shipping.`;
  return `${trust.total} past order${trust.total > 1 ? "s" : ""} on record, none delivered yet.`;
}

// Duplicate-order guard: same phone, at least one shared product, and an
// earlier order placed within the last 24 hours.
export function findDuplicateOrder(orders, phone, items, now = Date.now()) {
  const target = normalizePhone(phone);
  if (!target || !items || items.length === 0) return null;
  const ids = new Set(items.map((i) => i.productId));
  const DAY = 24 * 3600e3;
  const candidates = (orders || []).filter((o) => {
    if (normalizePhone(o.phone) !== target) return false;
    if (o.placedAt == null) return false;
    if (o.placedAt > now || now - o.placedAt > DAY) return false;
    return (o.items || []).some((i) => ids.has(i.productId));
  });
  candidates.sort((a, b) => b.placedAt - a.placedAt);
  return candidates[0] || null;
}

// For the dashboard: returns the earlier order this order may duplicate, if any.
// Prefers the stored duplicateOf link, then recomputes from order history.
export function isDuplicateOrder(order, orders) {
  if (!order) return null;
  if (order.duplicateOf) {
    const linked = (orders || []).find((o) => o.id === order.duplicateOf);
    if (linked) return linked;
    return { id: order.duplicateOf };
  }
  if (order.placedAt == null) return null;
  const DAY = 24 * 3600e3;
  const target = normalizePhone(order.phone);
  const ids = new Set((order.items || []).map((i) => i.productId));
  const earlier = (orders || []).filter(
    (o) =>
      o.id !== order.id &&
      normalizePhone(o.phone) === target &&
      o.placedAt != null &&
      o.placedAt < order.placedAt &&
      order.placedAt - o.placedAt <= DAY &&
      (o.items || []).some((i) => ids.has(i.productId))
  );
  earlier.sort((a, b) => b.placedAt - a.placedAt);
  return earlier[0] || null;
}

// City RTO risk board: return rate per city from completed orders only
// (Delivered + Returned). Ranked riskiest first.
export function cityReturnRisk(orders) {
  const byCity = {};
  (orders || []).forEach((o) => {
    if (o.status !== "Delivered" && o.status !== "Returned") return;
    const c = byCity[o.city] || { city: o.city, delivered: 0, returned: 0 };
    if (o.status === "Delivered") c.delivered += 1;
    else c.returned += 1;
    byCity[o.city] = c;
  });
  return Object.values(byCity)
    .map((c) => ({
      ...c,
      total: c.delivered + c.returned,
      rate: c.delivered + c.returned ? c.returned / (c.delivered + c.returned) : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.returned - a.returned);
}

// Money saved by confirmations: every delivered order that was confirmed
// first avoided one courier return trip, charged at the seller's return fee.
export function computeSavings(orders, returnFee) {
  const fee = Math.max(0, Number(returnFee) || 0);
  const saved = (orders || []).filter(
    (o) => o.status === "Delivered" && o.confirmedAt === "Confirmed by customer"
  );
  return { count: saved.length, amount: saved.length * fee, fee };
}

// "11h 24m 05s" / "42m 05s" / "2d 3h" countdown text.
export function formatCountdown(ms) {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(sec).padStart(2, "0")}s`;
  return `${m}m ${String(sec).padStart(2, "0")}s`;
}

// Returning-customer quick fill: the most recent order for a phone number.
export function mostRecentOrderForPhone(orders, phone) {
  const target = normalizePhone(phone);
  const mine = (orders || []).filter((o) => normalizePhone(o.phone) === target);
  if (mine.length === 0) return null;
  return [...mine].sort((a, b) => (b.placedAt || 0) - (a.placedAt || 0))[0];
}
