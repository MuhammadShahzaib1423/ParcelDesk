import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import ProductArt from "../components/ProductArt";
import { TiltCard } from "../components/motion";
import { stockLabel } from "../lib/orderInsights";

export default function Shop() {
  const { sellerSlug } = useParams();
  const { getSeller, cart, addToCart, setQty, productsFor, products, settings } = useShop();
  const navigate = useNavigate();
  const seller = getSeller(sellerSlug);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");

  if (!seller) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-sage-900">Shop not found</h1>
        <p className="mt-2 text-sage-700">This demo only has two fictional shops.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-sage-700 underline">Back home</Link>
      </div>
    );
  }

  const all = productsFor(seller.slug);
  const categories = ["All", ...new Set(all.map((p) => p.category))];

  const shown = useMemo(() => {
    let list = all.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [all, category, query, sort]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((x) => x.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Seller header */}
      <section className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
        <div className={`h-28 bg-gradient-to-r ${seller.accent} sm:h-32`} />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div className="-mt-8 flex items-end gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-800 font-display text-2xl font-bold text-cream-50 ring-4 ring-white">
              {seller.name.charAt(0)}
            </span>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-bold text-sage-900 sm:text-3xl">{seller.name}</h1>
              <p className="text-sage-700">{seller.tagline}</p>
            </div>
          </div>
          <a
            href="#order"
            onClick={(e) => e.preventDefault()}
            title="Demo only — this button does not message anyone"
            className="rounded-full bg-[#4C7A4F] px-5 py-2.5 text-center text-sm font-semibold text-white"
          >
            WhatsApp: {seller.whatsapp} (demo)
          </a>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-cream-200 px-5 py-3 text-sm text-sage-700 sm:px-7">
          <span>📍 {seller.city}, Pakistan</span>
          <span>★ {seller.rating} rating</span>
          <span>{seller.ordersServed}</span>
          <span>{seller.responseTime}</span>
        </div>
        <p className="border-t border-cream-200 px-5 py-3 text-sm leading-relaxed text-sage-600 sm:px-7">{seller.about}</p>
      </section>

      {/* Shop announcement from settings */}
      {settings.announcement && (
        <p className="mt-4 rounded-2xl bg-gold-400/25 px-4 py-3 text-center text-sm font-medium text-sage-900" role="status">
          📢 {settings.announcement}
        </p>
      )}

      {/* Controls */}
      <div id="order" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="flex-1 rounded-full border border-cream-300 bg-white px-4 py-2.5 text-sm"
          aria-label="Search products"
        />
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-cream-300 bg-white px-3 py-2.5 text-sm" aria-label="Filter by category">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-cream-300 bg-white px-3 py-2.5 text-sm" aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>

      {/* Catalogue */}
      {shown.length === 0 ? (
        <p className="mt-10 rounded-3xl bg-white p-8 text-center text-sage-700 shadow-card">No products match your search. Try a different word or category.</p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => {
            const qty = cart[p.id] || 0;
            return (
              <TiltCard key={p.id} max={6} className="h-full">
              <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: Math.min(i * 0.05, 0.3) }} className="flex h-full flex-col overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
                <div className="relative">
                  <ProductArt motif={p.motif} gradient={p.gradient} />
                  {p.badge && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-sage-800">{p.badge}</span>}
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-sage-700">{stockLabel(p)}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold leading-snug text-sage-900">{p.name}</h2>
                    <span className="text-xs font-medium uppercase tracking-wide text-sage-500">{p.category}</span>
                  </div>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-sage-600">{p.desc}</p>
                  <p className="mt-3">
                    <span className="font-display text-xl font-bold text-sage-900">{formatPKR(p.price)}</span>
                    {p.oldPrice && <span className="ml-2 text-sm text-sage-500 line-through">{formatPKR(p.oldPrice)}</span>}
                  </p>
                  {p.stockQty <= 0 ? (
                    <button disabled className="mt-3 w-full cursor-not-allowed rounded-full bg-cream-200 py-2.5 font-semibold text-sage-500">
                      Out of stock
                    </button>
                  ) : qty === 0 ? (
                    <button onClick={() => addToCart(p.id, 1)} className="btn-lift mt-3 w-full rounded-full bg-sage-700 py-2.5 font-semibold text-cream-50 transition hover:bg-sage-800">
                      Add to order
                    </button>
                  ) : (
                    <div className="mt-3 flex items-center justify-between rounded-full border border-sage-300 bg-sage-50 px-2 py-1.5">
                      <button onClick={() => setQty(p.id, qty - 1)} className="h-8 w-8 rounded-full bg-white font-bold text-sage-800 shadow-sm" aria-label={`Remove one ${p.name}`}>−</button>
                      <span className="font-semibold text-sage-900">{qty} in your order</span>
                      <button onClick={() => setQty(p.id, qty + 1)} className="h-8 w-8 rounded-full bg-sage-700 font-bold text-cream-50" aria-label={`Add one more ${p.name}`}>+</button>
                    </div>
                  )}
                </div>
              </motion.article>
              </TiltCard>
            );
          })}
        </div>
      )}

      {/* Sticky order summary */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm sm:text-base"><span className="font-bold text-sage-900">{cartCount} item{cartCount > 1 ? "s" : ""}</span> <span className="text-sage-600">· {formatPKR(cartTotal)} + delivery</span></p>
            <button onClick={() => navigate(`/shop/${seller.slug}/checkout`)} className="btn-lift rounded-full bg-sage-700 px-5 py-2.5 font-semibold text-cream-50 shadow-soft hover:bg-sage-800 sm:px-7">
              Review order →
            </button>
          </div>
        </div>
      )}
      {cartCount > 0 && <div className="h-16" />}
    </div>
  );
}
