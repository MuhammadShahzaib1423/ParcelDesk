// Weekly reports & reminders: what happened in the last 7 days versus the
// 7 days before, what needs attention today, a printable weekly report,
// and a full-data CSV export. All computed from orders stored on this device.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import { DashTabs } from "../components/Layout";
import {
  cityReturnRisk,
  formatCountdown,
  isCompletedReturn,
  normalizePhone,
  orderTime,
  topReturnReason,
  totalReturnFees,
} from "../lib/orderInsights";
import { downloadCSVFile, toCSV } from "../lib/csv";

const DAY = 86400000;

function summarize(list, returnFee) {
  const total = list.length;
  const confirmed = list.filter((o) => ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)).length;
  const delivered = list.filter((o) => o.status === "Delivered").length;
  const returned = list.filter((o) => isCompletedReturn(o));
  const fees = totalReturnFees(list);
  const top = topReturnReason(list);
  const risks = cityReturnRisk(list);
  return {
    total,
    confirmationRate: total ? Math.round((confirmed / total) * 100) : 0,
    deliveredRate: total ? Math.round((delivered / total) * 100) : 0,
    returnRate: total ? Math.round((returned.length / total) * 100) : 0,
    returnedCount: returned.length,
    fees,
    topReason: top?.reason || "—",
    riskiest: risks.find((r) => r.rate > 0)?.city || "—",
    saved: list.filter((o) => o.status === "Delivered" && o.confirmedAt === "Confirmed by customer").length * Math.max(0, Number(returnFee) || 0),
  };
}

function deltaText(now, prev, suffix = "") {
  if (prev === 0 && now === 0) return "No change";
  if (prev === 0) return `+${now}${suffix} (none before)`;
  const d = now - prev;
  if (d === 0) return "No change";
  return `${d > 0 ? "+" : ""}${d}${suffix} vs previous week`;
}

export default function Reports() {
  const { orders, settings, flaggedPhones } = useShop();

  const now = Date.now();
  const { current, previous } = useMemo(() => {
    const cur = orders.filter((o) => {
      const t = orderTime(o);
      return t > 0 && t > now - 7 * DAY;
    });
    const prev = orders.filter((o) => {
      const t = orderTime(o);
      return t > 0 && t <= now - 7 * DAY && t > now - 14 * DAY;
    });
    return { current: cur, previous: prev };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const cur = useMemo(() => summarize(current, settings.returnFee), [current, settings.returnFee]);
  const prev = useMemo(() => summarize(previous, settings.returnFee), [previous, settings.returnFee]);

  const reminders = useMemo(() => {
    const list = [];
    orders.forEach((o) => {
      if (o.status === "Awaiting confirmation" && o.confirmBy) {
        const left = o.confirmBy - now;
        if (left > 0 && left < 2 * 3600e3) {
          list.push({ kind: "expiry", text: `${o.id} (${o.customer}) expires in ${formatCountdown(left)} — confirm or let it lapse.`, id: o.id });
        }
      }
      if (o.status === "Return in transit" && o.returnInfo?.returnedAt && now - o.returnInfo.returnedAt > 5 * DAY) {
        const days = Math.floor((now - o.returnInfo.returnedAt) / DAY);
        list.push({ kind: "transit", text: `${o.id} has been in transit back for ${days} days — chase ${o.returnInfo.courier || "the courier"} (${o.returnInfo.awb || "no tracking number"}).`, id: o.id });
      }
      if (["New", "Awaiting confirmation"].includes(o.status) && flaggedPhones.some((p) => normalizePhone(p) === normalizePhone(o.phone))) {
        list.push({ kind: "flagged", text: `${o.id} is a new order from flagged number ${o.phone} (${o.customer}) — confirm carefully before shipping.`, id: o.id });
      }
    });
    return list;
  }, [orders, flaggedPhones, now]);

  const exportAll = () => {
    const rows = [
      ["Order ID", "Customer name", "Phone", "Address", "City", "Items", "Total (PKR)", "Status", "Courier", "Tracking number", "Return reason", "Return fee (PKR)", "Return source", "Reship of", "Date"],
      ...orders.map((o) => [
        o.id, o.customer, o.phone, o.address, o.city,
        o.items.map((i) => `${i.name} x${i.qty}`).join("; "),
        o.total, o.status, o.courier || "", o.awb || "",
        o.returnInfo?.reason || o.returnReason || "",
        o.returnInfo?.fee ?? o.returnCost ?? "",
        o.returnInfo?.source || "",
        o.reshipOf || "", o.date,
      ]),
    ];
    downloadCSVFile("parceldesk-full-export.csv", toCSV(rows));
  };

  const printReport = () => window.print();

  const cards = [
    { label: "Orders", now: cur.total, prev: prev.total, text: deltaText(cur.total, prev.total) },
    { label: "Confirmation rate", now: `${cur.confirmationRate}%`, prev: `${prev.confirmationRate}%`, text: deltaText(cur.confirmationRate, prev.confirmationRate, " pts") },
    { label: "Delivered rate", now: `${cur.deliveredRate}%`, prev: `${prev.deliveredRate}%`, text: deltaText(cur.deliveredRate, prev.deliveredRate, " pts") },
    { label: "Return rate", now: `${cur.returnRate}%`, prev: `${prev.returnRate}%`, text: deltaText(cur.returnRate, prev.returnRate, " pts") },
    { label: "Return fees", now: formatPKR(cur.fees), prev: formatPKR(prev.fees), text: deltaText(cur.fees, prev.fees, " PKR") },
    { label: "Top return reason", now: cur.topReason, prev: prev.topReason, text: cur.topReason === prev.topReason ? "Same as previous week" : "Changed since previous week" },
    { label: "Riskiest city", now: cur.riskiest, prev: prev.riskiest, text: cur.riskiest === prev.riskiest ? "Same as previous week" : "Changed since previous week" },
    { label: "Saved by confirmations", now: formatPKR(cur.saved), prev: formatPKR(prev.saved), text: deltaText(cur.saved, prev.saved, " PKR") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-sage-600">Seller dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-sage-900">Weekly report &amp; reminders</h1>
      <p className="mt-1 max-w-3xl leading-relaxed text-sage-700">
        The last 7 days against the 7 days before — from the orders stored on this device only.
        Orders without a usable date are left out of the weekly windows.
      </p>
      <div className="mt-4 print:hidden"><DashTabs /></div>

      {/* Reminders */}
      <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-amber-900">Needs attention today ({reminders.length})</h2>
        {reminders.length === 0 ? (
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Nothing urgent. No orders are about to expire, no returns have been stuck in transit over
            5 days, and no flagged numbers have new orders.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-amber-900">
            {reminders.map((r, i) => (
              <li key={`${r.id}-${i}`}>• {r.text}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Weekly summary — this block is what prints */}
      <div id="weekly-report" className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-sage-900">
          Last 7 days vs previous 7 days
        </h2>
        <p className="text-sm text-sage-600">
          {current.length} orders in the last 7 days · {previous.length} in the 7 days before.
          Prepared {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {settings.shopName} · Demo data — fictional orders.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-cream-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage-500">{c.label}</p>
              <p className="mt-1 font-display text-xl font-bold text-sage-900">{c.now}</p>
              <p className="text-xs text-sage-500">Before: {c.prev} · {c.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-sage-700">
          Plain-words summary: {cur.total} orders arrived in the last 7 days. {cur.returnedCount} parcel
          {cur.returnedCount === 1 ? " came" : "s came"} back, costing {formatPKR(cur.fees)} in return fees.
          {cur.topReason !== "—" ? ` The most common reason was “${cur.topReason}”.` : ""}
          {cur.riskiest !== "—" ? ` The riskiest city was ${cur.riskiest}.` : ""}
          {" "}Confirmations saved an estimated {formatPKR(cur.saved)} in avoided return trips.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <button onClick={printReport} className="btn-lift rounded-full bg-sage-700 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-sage-800">
          Print weekly report
        </button>
        <button onClick={exportAll} className="rounded-full border border-sage-300 bg-white px-5 py-2.5 text-sm font-semibold text-sage-800">
          Download full data (CSV — orders + returns)
        </button>
        <Link to="/dashboard/returns" className="rounded-full border border-sage-300 bg-white px-5 py-2.5 text-sm font-semibold text-sage-800">
          Open returns &amp; imports
        </Link>
      </div>
      <p className="mt-3 text-xs text-sage-500 print:hidden">
        Printing uses your browser&apos;s print dialog. The printed report contains only the weekly
        summary above.
      </p>
    </div>
  );
}
