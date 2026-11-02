import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ORDER_STATUSES, formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import { StatusBadge } from "../components/ProductArt";
import { AnimatedCounter, Reveal } from "../components/motion";
import {
  TRUST_BADGE_STYLES,
  cityReturnRisk,
  computeSavings,
  formatCountdown,
  getTrustForPhone,
  isDuplicateOrder,
} from "../lib/orderInsights";

const NEXT = {
  New: "Awaiting confirmation",
  "Awaiting confirmation": "Confirmed",
  Confirmed: "Packed",
  Packed: "Shipped",
  Shipped: "Delivered",
};

const FUNNEL = ["Placed", "Confirmed", "Shipped", "Delivered", "Returned", "Expired"];

// Live countdown to an order's confirmation deadline. Ticks every second
// (every 30s for users who prefer reduced motion).
function ConfirmCountdown({ confirmBy }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!confirmBy) return undefined;
    const timer = setInterval(() => setNow(Date.now()), reduce ? 30000 : 1000);
    return () => clearInterval(timer);
  }, [confirmBy, reduce]);
  if (!confirmBy) return <span className="text-xs text-sage-500">No expiry set</span>;
  const left = confirmBy - now;
  if (left <= 0) return <span className="text-xs font-semibold text-red-700">Time is up — expiring…</span>;
  return <span className="text-xs font-semibold text-amber-800">Expires in {formatCountdown(left)}</span>;
}

function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const { orders, updateOrderStatus, seller, settings } = useShop();
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const reduceMotion = useReducedMotion();
  const funnelMax = Math.max(1, orders.length);

  // Per-order trust snapshot (stored on the order) with a live fallback, and
  // duplicate flags recomputed from order history.
  const trustById = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      map[o.id] = o.trustLabel || getTrustForPhone(orders, o.phone).label;
    });
    return map;
  }, [orders]);
  const duplicateById = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const dup = isDuplicateOrder(o, orders);
      if (dup) map[o.id] = dup;
    });
    return map;
  }, [orders]);

  const savings = useMemo(() => computeSavings(orders, settings.returnFee), [orders, settings.returnFee]);
  const risks = useMemo(() => cityReturnRisk(orders), [orders]);
  const riskiest = risks.find((r) => r.rate > 0) || null;

  const stats = useMemo(() => {
    const total = orders.length;
    const confirmedLike = orders.filter((o) => ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const returned = orders.filter((o) => o.status === "Returned");
    const revenueAtRisk = returned.reduce((s, o) => s + o.total, 0);
    const returnCost = returned.reduce((s, o) => s + (o.returnCost || o.delivery || 0), 0);
    return {
      total,
      confirmationRate: total ? Math.round((confirmedLike / total) * 100) : 0,
      deliveredRate: total ? Math.round((delivered / total) * 100) : 0,
      returnedCount: returned.length,
      revenueAtRisk,
      returnCost,
    };
  }, [orders]);

  const funnel = useMemo(() => {
    const placed = orders.length;
    const confirmed = orders.filter((o) => ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)).length;
    const shipped = orders.filter((o) => ["Shipped", "Delivered"].includes(o.status)).length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const returned = orders.filter((o) => o.status === "Returned").length;
    const expired = orders.filter((o) => o.status === "Expired — not confirmed").length;
    return [
      { stage: "Placed", count: placed },
      { stage: "Confirmed", count: confirmed },
      { stage: "Shipped", count: shipped },
      { stage: "Delivered", count: delivered },
      { stage: "Returned", count: returned },
      { stage: "Expired", count: expired },
    ];
  }, [orders]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (statusFilter === "All" || o.status === statusFilter) &&
          (o.customer.toLowerCase().includes(search.toLowerCase()) ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.city.toLowerCase().includes(search.toLowerCase()))
      ),
    [orders, statusFilter, search]
  );

  const selected = orders.find((o) => o.id === selectedId) || null;
  const returnedOrders = orders.filter((o) => o.status === "Returned");

  const exportCSV = () => {
    const rows = [
      ["Order ID", "Customer name", "Phone", "Trust score", "Address", "City", "Items", "Total (PKR)", "Status"],
      ...filtered.map((o) => [
        o.id, o.customer, o.phone, trustById[o.id] || "", o.address, o.city,
        o.items.map((i) => `${i.name} x${i.qty}`).join("; "),
        o.total, o.status,
      ]),
    ];
    downloadCSV("parceldesk-courier-sheet.csv", rows);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sage-600">Seller dashboard · demo account, no login needed</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-sage-900">{seller.name} — order desk</h1>
          <p className="mt-1 text-sage-700">{seller.city} · {seller.whatsapp} · All data fictional.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/settings" className="rounded-full border border-sage-300 bg-white px-4 py-2.5 text-sm font-semibold text-sage-800">Shop settings</Link>
          <button onClick={exportCSV} className="btn-lift rounded-full bg-sage-700 px-4 py-2.5 text-sm font-semibold text-cream-50 hover:bg-sage-800">
            Download courier sheet (CSV)
          </button>
        </div>
      </div>

      {/* Stats — animated counters */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total orders", value: stats.total, format: (n) => String(Math.round(n)), note: "All time (demo)" },
          { label: "Confirmation rate", value: stats.confirmationRate, format: (n) => `${Math.round(n)}%`, note: "Reached Confirmed or beyond" },
          { label: "Delivered rate", value: stats.deliveredRate, format: (n) => `${Math.round(n)}%`, note: "Of all orders" },
          { label: "Returned / RTO parcels", value: stats.returnedCount, format: (n) => String(Math.round(n)), note: `Return cost ${formatPKR(stats.returnCost)}` },
          { label: "Revenue at risk", value: stats.revenueAtRisk, format: (n) => formatPKR(Math.round(n)), note: "Value of returned orders" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-500">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-sage-900">
              <AnimatedCounter value={s.value} format={s.format} />
            </p>
            <p className="text-xs text-sage-500">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Money saved by confirmations — running estimate */}
      <Reveal className="mt-6">
        <div className="rounded-3xl border border-sage-200 bg-sage-700 p-5 text-cream-50 shadow-card sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-200">Money saved by confirmations</p>
              <p className="mt-1 font-display text-4xl font-bold">
                <AnimatedCounter value={savings.amount} format={(n) => formatPKR(Math.round(n))} />
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-cream-100">
                {savings.count} confirmed order{savings.count === 1 ? " was" : "s were"} delivered. Each one avoided
                a courier return trip charged at {formatPKR(savings.fee)} — so confirmation has already paid for
                itself {savings.count === 0 ? "0 times" : `${savings.count} time${savings.count === 1 ? "" : "s"}`}.
              </p>
            </div>
            <Link to="/dashboard/settings" className="rounded-full border border-cream-200 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-sage-600">
              Change the return fee
            </Link>
          </div>
          <p className="mt-3 text-xs text-cream-200">
            Estimate only: counts delivered orders that were confirmed first. It updates itself as orders change.
          </p>
        </div>
      </Reveal>

      {/* Funnel */}
      <div className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-sage-900">Order funnel</h2>
        <p className="text-sm text-sage-600">Where orders stand, from placed to delivered — or returned.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          {funnel.map((f, i) => (
            <div key={f.stage} className="flex flex-1 items-center gap-2">
              <div className="flex-1 rounded-2xl bg-sage-50 px-3 py-3 text-center">
                <p className="font-display text-xl font-bold text-sage-900">{f.count}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-sage-600">{f.stage}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sage-100">
                  <motion.div
                    className={`h-full rounded-full ${f.stage === "Returned" ? "bg-red-400" : f.stage === "Expired" ? "bg-stone-400" : "bg-sage-500"}`}
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={{ width: `${Math.round((f.count / funnelMax) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: i * 0.08 }}
                  />
                </div>
              </div>
              {i < FUNNEL.length - 1 && <span className="hidden text-sage-400 sm:block">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* RTO log */}
      <div className="mt-6 rounded-3xl border border-red-100 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-sage-900">RTO / returns log</h2>
        <p className="text-sm text-sage-600">Every parcel that came back, and why — so the pattern is visible, not a surprise.</p>
        {returnedOrders.length === 0 ? (
          <p className="mt-3 text-sm text-sage-600">No returned parcels. Good news — confirmation is doing its job.</p>
        ) : (
          <ul className="mt-3 divide-y divide-cream-200">
            {returnedOrders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span><strong>{o.id}</strong> · {o.customer} · {o.city} · {o.items.map((i) => i.name).join(", ")}</span>
                <span className="text-sage-700">{o.returnReason || "No reason recorded."} <span className="font-semibold text-red-700">({formatPKR(o.returnCost || o.delivery || 0)} return cost)</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* City RTO risk board — computed live from completed orders */}
      <div className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-sage-900">City return-risk board</h2>
        <p className="text-sm text-sage-600">
          Which cities send parcels back most often — return rate from orders that were delivered or returned.
          Updates itself as orders change.
        </p>
        {risks.length === 0 ? (
          <p className="mt-3 text-sm text-sage-600">Not enough delivered or returned orders yet to rank cities.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {risks.map((r) => (
              <div key={r.city} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-sm font-semibold text-sage-900">{r.city}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                  <motion.div
                    className={`h-full rounded-full ${r.rate > 0.5 ? "bg-red-400" : r.rate > 0 ? "bg-amber-400" : "bg-sage-500"}`}
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={{ width: `${Math.round(r.rate * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <span className="w-40 shrink-0 text-right text-xs text-sage-600">
                  {r.returned} returned of {r.total} completed · {Math.round(r.rate * 100)}% return rate
                </span>
              </div>
            ))}
          </div>
        )}
        {riskiest && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900">
            <strong>Riskiest city: {riskiest.city} ({Math.round(riskiest.rate * 100)}% returns).</strong>{" "}
            Ask buyers in {riskiest.city} to confirm twice before shipping, and call before dispatch — a second
            confirmation costs a minute and saves a return trip.
          </p>
        )}
      </div>

      {/* Orders table */}
      <div className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-bold text-sage-900">Orders</h2>
          <div className="flex gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, order ID or city…" className="w-full rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm sm:w-64" aria-label="Search orders" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-cream-300 bg-cream-50 px-3 py-2 text-sm" aria-label="Filter by status">
              <option>All</option>
              {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-cream-100 px-4 py-6 text-center text-sm text-sage-700">
            No orders match. Try a different search, or place a demo order from the shop — it will appear here instantly.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-sage-500">
                  <th className="pb-2 pr-3">Order</th><th className="pb-2 pr-3">Customer</th><th className="pb-2 pr-3">City</th><th className="pb-2 pr-3">Items</th><th className="pb-2 pr-3">Total</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((o) => (
                    <motion.tr
                      key={o.id}
                      layout
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setSelectedId(o.id)}
                      className="cursor-pointer border-b border-cream-100 hover:bg-cream-50"
                    >
                      <td className="py-2.5 pr-3 font-semibold text-sage-900">{o.id}</td>
                      <td className="py-2.5 pr-3">
                        {o.customer}
                        <span className="block text-xs text-sage-500">{o.phone}</span>
                        <span className="mt-1 flex flex-wrap gap-1">
                          <span className={`inline-block rounded-full px-2 py-px text-[11px] font-semibold ${TRUST_BADGE_STYLES[trustById[o.id]] || TRUST_BADGE_STYLES["New buyer"]}`}>
                            {trustById[o.id]}
                          </span>
                          {duplicateById[o.id] && (
                            <span className="inline-block rounded-full bg-violet-100 px-2 py-px text-[11px] font-semibold text-violet-800" title={`Possible duplicate of ${duplicateById[o.id].id}`}>
                              Possible duplicate
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">{o.city}</td>
                      <td className="py-2.5 pr-3">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
                      <td className="py-2.5 pr-3 font-semibold">{formatPKR(o.total)}</td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={o.status} />
                        {o.status === "Awaiting confirmation" && (
                          <span className="mt-1 block"><ConfirmCountdown confirmBy={o.confirmBy} /></span>
                        )}
                      </td>
                      <td className="py-2.5">{o.date}</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-sage-500">Click any order to see its detail and move it to the next step.</p>
      </div>

      {/* Order detail — animated in/out, re-animates when a different order is picked */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={selected.id + selected.status}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-6 rounded-3xl border border-sage-200 bg-sage-50 p-5 shadow-card"
          >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-sage-900">Order {selected.id}</h2>
              <p className="text-sm text-sage-700">{selected.customer} · {selected.phone}</p>
              <p className="text-sm text-sage-700">{selected.address}, {selected.city}</p>
              {selected.notes && <p className="text-sm text-sage-700">Notes: {selected.notes}</p>}
              <p className="mt-1 text-sm text-sage-700">Confirmation: {selected.confirmedAt}</p>
              {selected.status === "Awaiting confirmation" && (
                <p className="mt-1 text-sm"><ConfirmCountdown confirmBy={selected.confirmBy} /></p>
              )}
              <p className="mt-1 text-sm text-sage-700">
                Buyer trust:{" "}
                <span className={`inline-block rounded-full px-2 py-px text-[11px] font-semibold ${TRUST_BADGE_STYLES[trustById[selected.id]] || TRUST_BADGE_STYLES["New buyer"]}`}>
                  {trustById[selected.id]}
                </span>
              </p>
              {duplicateById[selected.id] && (
                <p className="mt-1 text-sm text-violet-800">
                  Possible duplicate of order {duplicateById[selected.id].id} — same phone number and product within 24 hours. Check with the customer before shipping two parcels.
                </p>
              )}
              {selected.returnReason && <p className="mt-1 text-sm text-red-700">Return reason: {selected.returnReason}</p>}
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {selected.items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-3"><span>{i.name} × {i.qty}</span><span className="font-semibold">{formatPKR(i.price * i.qty)}</span></li>
            ))}
            <li className="flex justify-between gap-3 border-t border-sage-200 pt-1"><span>Delivery</span><span>{formatPKR(selected.delivery)}</span></li>
            <li className="flex justify-between gap-3 font-bold"><span>Total</span><span>{formatPKR(selected.total)}</span></li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {NEXT[selected.status] && (
              <button onClick={() => updateOrderStatus(selected.id, NEXT[selected.status])} className="rounded-full bg-sage-700 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-sage-800">
                Move to: {NEXT[selected.status]}
              </button>
            )}
            {selected.status !== "Returned" && selected.status !== "Delivered" && selected.status !== "Expired — not confirmed" && (
              <button onClick={() => updateOrderStatus(selected.id, "Returned")} className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700">
                Mark as returned
              </button>
            )}
            <button onClick={() => setSelectedId(null)} className="rounded-full border border-sage-300 bg-white px-4 py-2 text-sm font-semibold text-sage-800">Close detail</button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
