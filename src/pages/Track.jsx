// Public Track Order page: a customer enters their mobile number and order
// ID and sees the plain-words journey of their own parcel. Looks up only
// the orders stored in this browser (demo scope) — a wrong combination
// shows a helpful no-match message and no other customer's data.
import { useState } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../store/ShopContext";
import { normalizePhone } from "../lib/orderInsights";
import OrderTimeline from "../components/OrderTimeline";
import { StatusBadge } from "../components/ProductArt";
import { formatPKR } from "../data/seed";

export default function Track() {
  const { orders } = useShop();
  const [phone, setPhone] = useState("");
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);
  const [found, setFound] = useState(null);

  const lookup = (e) => {
    e.preventDefault();
    const id = orderId.trim().toUpperCase();
    const idNorm = id.startsWith("PD-") ? id : `PD-${id}`;
    const target = normalizePhone(phone);
    const match =
      orders.find((o) => o.id.toUpperCase() === idNorm && normalizePhone(o.phone) === target) || null;
    setFound(match);
    setSearched(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-sage-600">Track your parcel</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-sage-900">Where is my order?</h1>
      <p className="mt-1 leading-relaxed text-sage-700">
        Enter the mobile number you ordered with and your order ID (for example, PD-1043).
        You will see exactly where your parcel is — in plain words, no courier codes.
      </p>

      <form onSubmit={lookup} className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
        <label className="block text-sm font-semibold text-sage-900" htmlFor="t-phone">Mobile number</label>
        <input
          id="t-phone"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setSearched(false); }}
          placeholder="0301-2345678"
          inputMode="tel"
          className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5"
        />
        <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="t-id">Order ID</label>
        <input
          id="t-id"
          value={orderId}
          onChange={(e) => { setOrderId(e.target.value); setSearched(false); }}
          placeholder="PD-1043"
          className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5"
        />
        <button type="submit" className="btn-lift mt-5 w-full rounded-full bg-sage-700 py-3 font-semibold text-cream-50 hover:bg-sage-800">
          Track my order
        </button>
      </form>

      {searched && !found && (
        <div className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5" role="alert">
          <p className="font-display text-lg font-bold text-amber-900">We could not find that order.</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Please check the order ID and the mobile number you ordered with — the number must match
            the one on the order. If you ordered on a different phone or browser, this demo only
            sees orders stored on this device. The seller can also look the order up from their
            dashboard.
          </p>
        </div>
      )}

      {searched && found && (
        <div className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-sage-900">Order {found.id}</h2>
              <p className="text-sm text-sage-700">
                {found.customer} · {found.city} · {found.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
              </p>
              <p className="text-sm text-sage-700">Total (cash on delivery): <strong>{formatPKR(found.total)}</strong></p>
              {(found.courier || found.awb) && (
                <p className="text-sm text-sage-700">
                  Courier: <strong>{found.courier || "—"}</strong> · Tracking number: <strong>{found.awb || "—"}</strong>
                </p>
              )}
              {found.reshipOf && (
                <p className="text-sm text-sage-700">This is a reshipment of order {found.reshipOf}.</p>
              )}
            </div>
            <StatusBadge status={found.status} />
          </div>
          <div className="mt-6">
            <OrderTimeline order={found} />
          </div>
          <p className="mt-6 text-sm text-sage-600">
            Questions? Message the seller on the number shown on their shop page, quoting order {found.id}.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-sage-600">
        New here? <Link to="/shop/noor-studio" className="font-semibold underline">Visit the demo shop</Link> and place an order — then track it here.
      </p>
    </div>
  );
}
