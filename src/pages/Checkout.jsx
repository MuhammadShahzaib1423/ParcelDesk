import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CITIES, products, formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import ProductArt from "../components/ProductArt";
import {
  getTrustForPhone,
  TRUST_BADGE_STYLES,
  trustNote,
  findDuplicateOrder,
  mostRecentOrderForPhone,
  normalizePhone,
} from "../lib/orderInsights";

const PHONE_RE = /^03\d{2}-?\d{7}$/;

export default function Checkout() {
  const { sellerSlug } = useParams();
  const { getSeller, cart, setQty, placeOrder, updateOrderStatus, settings, orders } = useShop();
  const seller = getSeller(sellerSlug);

  const [form, setForm] = useState({ name: "", phone: "", address: "", city: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [lookupMsg, setLookupMsg] = useState("");
  const [dupWarning, setDupWarning] = useState(null); // { existing, payload }

  // Buyer Trust Score, live from this shop's own order history for the number.
  const trust = useMemo(() => getTrustForPhone(orders, form.phone), [orders, form.phone]);
  const showTrust = normalizePhone(form.phone).length >= 11;

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === id);
          return p ? { ...p, qty } : null;
        })
        .filter(Boolean),
    [cart]
  );

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const isSameCity = form.city && seller && form.city === seller.city;
  const delivery = !form.city ? null : isSameCity ? settings.sameCityDelivery : settings.otherCityDelivery;
  const total = delivery === null ? null : subtotal + delivery;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
    if (k === "phone") setLookupMsg("");
  };

  // Returning-customer quick fill: reuse name/address/city from this
  // number's most recent order, stored only on this device.
  const quickFill = () => {
    const prev = mostRecentOrderForPhone(orders, form.phone);
    if (!prev) {
      setLookupMsg("No past order found for this number on this device — please fill in your details.");
      return;
    }
    setForm((f) => ({ ...f, name: prev.customer, address: prev.address, city: prev.city }));
    setErrors((e) => ({ ...e, name: "", address: "", city: "" }));
    setLookupMsg(`Filled in from your last order (${prev.id}, ${prev.date}). Check it is still correct.`);
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Please enter your full name (at least 3 letters).";
    const digits = form.phone.replace(/[\s]/g, "");
    if (!PHONE_RE.test(digits)) e.phone = "Enter a Pakistani mobile like 0301-2345678.";
    if (form.address.trim().length < 10) e.address = "Please enter your complete address (house, street and area).";
    if (!form.city) e.city = "Please choose your city.";
    if (lines.length === 0) e.cart = "Your order is empty. Add a product from the shop first.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    customer: form.name.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city,
    notes: form.notes.trim(),
    items: lines.map((l) => ({ productId: l.id, name: l.name, qty: l.qty, price: l.price })),
    subtotal,
    delivery,
    total,
  });

  const submit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    // Duplicate-order guard: same number, same product, within 24 hours.
    const duplicate = findDuplicateOrder(orders, payload.phone, payload.items, Date.now());
    if (duplicate) {
      setDupWarning({ existing: duplicate, payload });
      return;
    }
    setPlaced(placeOrder(payload));
  };

  const confirmDuplicate = () => {
    if (!dupWarning) return;
    const order = placeOrder({ ...dupWarning.payload, duplicateOf: dupWarning.existing.id });
    setDupWarning(null);
    setPlaced(order);
  };

  if (!seller) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-sage-900">Shop not found</h1>
        <Link to="/" className="mt-4 inline-block font-semibold text-sage-700 underline">Back home</Link>
      </div>
    );
  }

  // Confirmation screen after placing
  if (placed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-soft sm:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-2xl">✓</span>
          <h1 className="mt-4 font-display text-3xl font-bold text-sage-900">Order received — {placed.id}</h1>
          <p className="mt-2 leading-relaxed text-sage-700">
            Thank you, {placed.customer}. Your order is <strong>Awaiting confirmation</strong>.{" "}
            {seller.name} will only pack and ship it after you confirm — that is how failed
            cash-on-delivery parcels are avoided. Please confirm within{" "}
            <strong>{settings.confirmationExpiryHours} hours</strong> — after that the order
            expires and is not shipped.
          </p>
          <div className="mt-5 rounded-2xl bg-cream-100 p-4 text-sm leading-relaxed text-sage-700">
            <p className="font-semibold text-sage-900">What happens next (demo)</p>
            <p className="mt-1">
              In the real product, you would receive a confirmation message like this:
            </p>
            <p className="mt-2 italic">“{settings.confirmationMessage.replace("{total}", formatPKR(placed.total))}”</p>
            <p className="mt-2">Press the demo button below to stand in for that confirmation message.</p>
          </div>
          {!confirmed ? (
            <button
              onClick={() => { updateOrderStatus(placed.id, "Confirmed"); setConfirmed(true); }}
              className="btn-lift mt-5 w-full rounded-full bg-sage-700 py-3 font-semibold text-cream-50 hover:bg-sage-800"
            >
              Simulate customer confirmation
            </button>
          ) : (
            <p className="mt-5 rounded-full bg-sage-100 py-3 text-center font-semibold text-sage-800">
              ✓ Confirmed — the seller can now pack and ship your order.
            </p>
          )}
          <div className="mt-5 border-t border-cream-200 pt-4 text-sm text-sage-700">
            <p><strong>Total (cash on delivery):</strong> {formatPKR(placed.total)} — pay the rider when your parcel arrives.</p>
            <p className="mt-1"><strong>Deliver to:</strong> {placed.address}, {placed.city}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard" className="rounded-full bg-sage-700 px-5 py-2.5 font-semibold text-cream-50 hover:bg-sage-800">See it in the dashboard</Link>
            <Link to={`/shop/${seller.slug}`} className="rounded-full border border-sage-300 bg-white px-5 py-2.5 font-semibold text-sage-800">Back to the shop</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm text-sage-600"><Link to={`/shop/${seller.slug}`} className="underline">← Back to {seller.name}</Link></p>
      <h1 className="mt-2 font-display text-3xl font-bold text-sage-900">Checkout — {seller.name}</h1>
      <p className="mt-1 text-sage-700">Fill in your details once. No account, no chat messages, no repeated questions.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <form onSubmit={submit} noValidate className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
          {errors.cart && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{errors.cart}</p>}

          {dupWarning && (
            <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4" role="alert">
              <p className="font-display text-lg font-bold text-amber-900">You already ordered this — did you mean to order again?</p>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                This number placed order <strong>{dupWarning.existing.id}</strong> ({dupWarning.existing.date}) for{" "}
                {dupWarning.existing.items.map((i) => `${i.name} ×${i.qty}`).join(", ")} within the last 24 hours.
                Ordering again will create a second parcel — and a second delivery charge.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={confirmDuplicate} className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                  Yes, order again anyway
                </button>
                <Link to={`/shop/${seller.slug}`} className="rounded-full border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-900">
                  Go back to the shop
                </Link>
                <button type="button" onClick={() => setDupWarning(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-amber-900 underline">
                  Keep editing my details
                </button>
              </div>
            </div>
          )}

          <label className="block text-sm font-semibold text-sage-900" htmlFor="f-name">Full name</label>
          <input id="f-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ayesha Khan" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          {errors.name && <p className="mt-1 text-sm text-red-700">{errors.name}</p>}

          <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="f-phone">Mobile number</label>
          <input id="f-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="0301-2345678" inputMode="tel" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          {errors.phone && <p className="mt-1 text-sm text-red-700">{errors.phone}</p>}
          <p className="mt-1 text-xs text-sage-500">Pakistani mobile format: 03XX-XXXXXXX. Used only for delivery and confirmation.</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button type="button" onClick={quickFill} className="rounded-full border border-sage-300 bg-white px-3 py-1.5 text-xs font-semibold text-sage-800 hover:bg-sage-50">
              I ordered before — fill my details
            </button>
            {showTrust && (
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TRUST_BADGE_STYLES[trust.label]}`}>
                {trust.label === "Trusted" ? "✓ Trusted buyer" : trust.label === "Careful" ? "! Careful buyer" : "New buyer"}
              </span>
            )}
          </div>
          {showTrust && <p className="mt-1 text-xs leading-relaxed text-sage-600">Buyer trust: {trustNote(trust)}</p>}
          {lookupMsg && <p className="mt-1 text-xs leading-relaxed text-sage-600">{lookupMsg}</p>}

          <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="f-address">Complete address</label>
          <textarea id="f-address" value={form.address} onChange={(e) => set("address", e.target.value)} rows={3} placeholder="House, street, area — everything the rider needs to find you" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          {errors.address && <p className="mt-1 text-sm text-red-700">{errors.address}</p>}

          <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="f-city">City</label>
          <select id="f-city" value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
            <option value="">Choose your city…</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {errors.city && <p className="mt-1 text-sm text-red-700">{errors.city}</p>}

          <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="f-notes">Delivery notes (optional)</label>
          <input id="f-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Call before arriving, leave with the guard" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />

          <button type="submit" className="btn-lift mt-6 w-full rounded-full bg-sage-700 py-3 font-semibold text-cream-50 hover:bg-sage-800">
            Place order — cash on delivery
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-sage-500">
            Your order is created as “Awaiting confirmation”. The seller ships only after you confirm, so parcels are not wasted.
          </p>
        </form>

        {/* Order summary + live calculator */}
        <aside className="h-fit rounded-3xl border border-cream-200 bg-white p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="font-display text-lg font-bold text-sage-900">Your order</h2>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-sage-600">
              Nothing here yet. <Link to={`/shop/${seller.slug}`} className="font-semibold underline">Add products from the shop</Link> and they will appear here with a live total.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"><ProductArt motif={l.motif} gradient={l.gradient} className="h-14" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{l.name}</p>
                    <p className="text-xs text-sage-500">{formatPKR(l.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setQty(l.id, l.qty - 1)} className="h-7 w-7 rounded-full border border-cream-300 bg-white font-bold" aria-label={`Remove one ${l.name}`}>−</button>
                    <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                    <button type="button" onClick={() => setQty(l.id, l.qty + 1)} className="h-7 w-7 rounded-full bg-sage-700 font-bold text-cream-50" aria-label={`Add one more ${l.name}`}>+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 space-y-2 border-t border-cream-200 pt-4 text-sm">
            <p className="flex justify-between"><span className="text-sage-600">Items subtotal</span><span className="font-semibold">{formatPKR(subtotal)}</span></p>
            <p className="flex justify-between">
              <span className="text-sage-600">Delivery {form.city ? (isSameCity ? `(${seller.city} — same city)` : `(${form.city} — other city)`) : "(choose a city)"}</span>
              <span className="font-semibold">{delivery === null ? "—" : formatPKR(delivery)}</span>
            </p>
            <p className="flex justify-between border-t border-cream-200 pt-2 text-base"><span className="font-semibold text-sage-900">Total (COD)</span><span className="font-display text-lg font-bold text-sage-900">{total === null ? "—" : formatPKR(total)}</span></p>
          </div>
          <p className="mt-3 rounded-2xl bg-sage-50 px-3 py-2.5 text-xs leading-relaxed text-sage-700">
            COD handling note: you pay {total === null ? "the total above" : formatPKR(total)} in cash to the rider on delivery. No advance payment is taken on this demo.
          </p>
        </aside>
      </div>
    </div>
  );
}
