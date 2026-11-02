import { Link } from "react-router-dom";

export default function Pricing() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-sage-900">Simple, honest pricing</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-sage-700">
        Start free. Pay only when your shop is busy enough to need it. Prices below are the plan
        being tested — they are not confirmed market pricing yet.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-sage-900">Starter</h2>
          <p className="mt-2 font-display text-4xl font-bold text-sage-900">Free</p>
          <p className="text-sm text-sage-500">Up to 30 orders a month</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-sage-700">
            <li>✓ One ordering link for your bio</li>
            <li>✓ Product catalogue and order form</li>
            <li>✓ Customer confirmation before shipping</li>
            <li>✓ Order list and basic stats</li>
          </ul>
          <p className="mt-4 text-sm text-sage-600">For sellers just starting out.</p>
        </div>

        <div className="rounded-3xl border-2 border-sage-600 bg-white p-6 shadow-soft">
          <p className="inline-block rounded-full bg-sage-700 px-2.5 py-1 text-xs font-bold text-cream-50">MOST POPULAR PLAN</p>
          <h2 className="mt-2 font-display text-xl font-bold text-sage-900">Growing Seller</h2>
          <p className="mt-2 font-display text-4xl font-bold text-sage-900">PKR 1,500<span className="text-base font-normal text-sage-500"> / month</span></p>
          <p className="text-sm text-sage-500">Unlimited orders</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-sage-700">
            <li>✓ Everything in Starter</li>
            <li>✓ RTO / returns log and funnel view</li>
            <li>✓ Courier sheet (CSV) download</li>
            <li>✓ Delivery charges you control</li>
            <li>✓ Confirmation message you write</li>
          </ul>
          <p className="mt-4 text-sm text-sage-600">For sellers shipping every day.</p>
        </div>

        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
          <h2 className="font-display text-xl font-bold text-sage-900">Busy Shop</h2>
          <p className="mt-2 font-display text-4xl font-bold text-sage-900">PKR 3,000<span className="text-base font-normal text-sage-500"> / month</span></p>
          <p className="text-sm text-sage-500">Unlimited orders, more hands</p>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-sage-700">
            <li>✓ Everything in Growing Seller</li>
            <li>✓ Multiple staff logins</li>
            <li>✓ Priority help when stuck</li>
            <li>✓ Early access to new features</li>
          </ul>
          <p className="mt-4 text-sm text-sage-600">For teams packing together.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl bg-sage-100 p-6">
        <h2 className="font-display text-lg font-bold text-sage-900">An honest note about these prices</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-sage-700">
          The PKR 1,500–3,000 monthly range is <strong>to be tested with real sellers</strong>. It is
          not confirmed market pricing, and no seller has been charged anything. Before charging,
          the plan is to talk to real sellers, learn what they already pay for courier and packaging,
          and set a price that pays for itself in avoided returns. If the numbers do not work for
          sellers, the price changes — the promise is simple tools at a fair price, not a guess.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/shop/noor-studio" className="btn-lift rounded-full bg-sage-700 px-6 py-3 font-semibold text-cream-50 hover:bg-sage-800">Try the demo shop free</Link>
        <Link to="/dashboard" className="rounded-full border border-sage-300 bg-white px-6 py-3 font-semibold text-sage-800">See what sellers see</Link>
      </div>
    </div>
  );
}
