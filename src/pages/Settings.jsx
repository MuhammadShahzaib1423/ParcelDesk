import { useState } from "react";
import { Link } from "react-router-dom";
import { CITIES } from "../data/seed";
import { useShop } from "../store/ShopContext";

export default function Settings() {
  const { settings, setSettings } = useShop();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    setSettings({
      ...form,
      sameCityDelivery: Math.max(0, Number(form.sameCityDelivery) || 0),
      otherCityDelivery: Math.max(0, Number(form.otherCityDelivery) || 0),
      confirmationExpiryHours: Math.min(72, Math.max(1, Number(form.confirmationExpiryHours) || 12)),
      returnFee: Math.max(0, Number(form.returnFee) || 0),
    });
    setSaved(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p className="text-sm text-sage-600"><Link to="/dashboard" className="underline">← Back to dashboard</Link></p>
      <h1 className="mt-2 font-display text-3xl font-bold text-sage-900">Shop settings</h1>
      <p className="mt-1 text-sage-700">
        These settings power the demo shop (Noor Studio) — its header, its delivery calculator,
        the confirmation message customers receive, the confirmation window, and the return fee
        used by the dashboard savings meter. Saving updates the storefront straight away.
      </p>

      <form onSubmit={save} className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
        <label className="block text-sm font-semibold text-sage-900" htmlFor="s-name">Shop name</label>
        <input id="s-name" value={form.shopName} onChange={(e) => set("shopName", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />

        <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="s-city">Shop city</label>
        <select id="s-city" value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
          {CITIES.filter((c) => c !== "Other").map((c) => <option key={c}>{c}</option>)}
        </select>
        <p className="mt-1 text-xs text-sage-500">Orders to this city use the same-city delivery charge.</p>

        <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="s-wa">WhatsApp number</label>
        <input id="s-wa" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="0300-1234567" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        <p className="mt-1 text-xs text-sage-500">Shown on the shop page. Demo only — nobody is actually contacted.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="s-same">Delivery — same city (PKR)</label>
            <input id="s-same" type="number" min="0" value={form.sameCityDelivery} onChange={(e) => set("sameCityDelivery", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="s-other">Delivery — other cities (PKR)</label>
            <input id="s-other" type="number" min="0" value={form.otherCityDelivery} onChange={(e) => set("otherCityDelivery", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="s-expiry">Confirmation window (hours)</label>
            <input id="s-expiry" type="number" min="1" max="72" value={form.confirmationExpiryHours} onChange={(e) => set("confirmationExpiryHours", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
            <p className="mt-1 text-xs text-sage-500">Unconfirmed orders expire automatically after this long. Applies to new orders.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="s-fee">Courier return fee (PKR)</label>
            <input id="s-fee" type="number" min="0" value={form.returnFee} onChange={(e) => set("returnFee", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
            <p className="mt-1 text-xs text-sage-500">What one returned parcel costs you. Powers the dashboard savings meter.</p>
          </div>
        </div>

        <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="s-msg">Confirmation message</label>
        <textarea id="s-msg" value={form.confirmationMessage} onChange={(e) => set("confirmationMessage", e.target.value)} rows={4} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        <p className="mt-1 text-xs text-sage-500">Use {"{total}"} where the order total should appear. This is the message a customer would receive before shipping.</p>

        <button type="submit" className="mt-6 w-full rounded-full bg-sage-700 py-3 font-semibold text-cream-50 hover:bg-sage-800">Save settings</button>
        {saved && (
          <p className="mt-3 rounded-2xl bg-sage-100 px-4 py-3 text-center text-sm font-semibold text-sage-800">
            ✓ Saved. The shop page, checkout calculator and confirmation message now use these settings.
          </p>
        )}
      </form>
    </div>
  );
}
