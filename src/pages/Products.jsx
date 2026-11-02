// Seller product management: add, edit, delete products and control stock.
// Changes show on the storefront immediately and persist on this device.
// Out-of-stock products cannot be added to a customer's order.
import { useState } from "react";
import { Link } from "react-router-dom";
import { formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import { DashTabs } from "../components/Layout";
import ProductArt from "../components/ProductArt";
import { stockLabel } from "../lib/orderInsights";

const MOTIFS = ["dress", "scarf", "bottle", "drop", "lipstick", "pencil", "jar"];
const GRADIENTS = [
  "from-[#E7DCC3] to-[#CBD5C0]",
  "from-[#D9E2CF] to-[#A9B89A]",
  "from-[#F2DCD2] to-[#E4E9DD]",
  "from-[#F5E3B8] to-[#E8CFC4]",
  "from-[#EAD9B8] to-[#D3B25E]",
];

const EMPTY = { name: "", category: "", price: "", oldPrice: "", stockQty: 20, badge: "", motif: "dress", gradient: GRADIENTS[0], desc: "" };

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useShop();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      oldPrice: p.oldPrice ? String(p.oldPrice) : "",
      stockQty: p.stockQty ?? 20,
      badge: p.badge || "",
      motif: p.motif,
      gradient: p.gradient,
      desc: p.desc || "",
    });
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = (e) => {
    e.preventDefault();
    if (form.name.trim().length < 3) {
      setError("Give the product a name (at least 3 letters).");
      return;
    }
    if (!form.category.trim()) {
      setError("Add a category, e.g. Lawn, Skincare or Dupattas.");
      return;
    }
    if (!(Number(form.price) > 0)) {
      setError("Enter a selling price greater than 0.");
      return;
    }
    const data = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      oldPrice: form.oldPrice ? Number(form.oldPrice) : null,
      stockQty: Math.max(0, Math.floor(Number(form.stockQty) || 0)),
      badge: form.badge.trim() || null,
      motif: form.motif,
      gradient: form.gradient,
      desc: form.desc.trim(),
    };
    if (editingId) {
      updateProduct(editingId, data);
      setNotice(`✓ Updated “${data.name}” — the shop page already shows the new details.`);
    } else {
      const created = addProduct(data);
      setNotice(`✓ Added “${created.name}” to your shop. Customers can order it straight away.`);
    }
    setEditingId(null);
    setForm(EMPTY);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-sage-600">Seller dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-sage-900">Products</h1>
      <p className="mt-1 max-w-2xl leading-relaxed text-sage-700">
        Everything customers can order. Stock quantities decide the label on the shop page —
        set a product to 0 and customers cannot add it to an order at all.
      </p>
      <div className="mt-4"><DashTabs /></div>

      {/* Add / edit form */}
      <form onSubmit={submit} className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-sage-900">{editingId ? "Edit product" : "Add a product"}</h2>
        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">{error}</p>}
        {notice && <p className="mt-3 rounded-2xl bg-sage-100 px-4 py-2.5 text-sm font-semibold text-sage-800">{notice}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-name">Product name</label>
            <input id="pr-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Mehrab Lawn 2-Piece" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-cat">Category</label>
            <input id="pr-cat" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Lawn" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-price">Selling price (PKR)</label>
            <input id="pr-price" type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-old">Compare-at price (PKR, optional)</label>
            <input id="pr-old" type="number" min="0" value={form.oldPrice} onChange={(e) => set("oldPrice", e.target.value)} placeholder="Shown crossed out" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-stock">Stock quantity</label>
            <input id="pr-stock" type="number" min="0" value={form.stockQty} onChange={(e) => set("stockQty", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
            <p className="mt-1 text-xs text-sage-500">0 = out of stock (cannot be ordered). 1–3 = “Only N left”. 4–5 = “Low stock”.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-badge">Badge (optional)</label>
            <input id="pr-badge" value={form.badge} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Bestseller, New" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-motif">Picture style</label>
            <select id="pr-motif" value={form.motif} onChange={(e) => set("motif", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
              {MOTIFS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-900" htmlFor="pr-grad">Colour wash</label>
            <select id="pr-grad" value={form.gradient} onChange={(e) => set("gradient", e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
              {GRADIENTS.map((g, i) => <option key={g} value={g}>Wash {i + 1}</option>)}
            </select>
          </div>
        </div>
        <label className="mt-4 block text-sm font-semibold text-sage-900" htmlFor="pr-desc">Short description</label>
        <textarea id="pr-desc" value={form.desc} onChange={(e) => set("desc", e.target.value)} rows={2} placeholder="One or two honest lines about the product." className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="btn-lift rounded-full bg-sage-700 px-5 py-2.5 font-semibold text-cream-50 hover:bg-sage-800">
            {editingId ? "Save changes" : "Add product to my shop"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="rounded-full border border-sage-300 bg-white px-5 py-2.5 font-semibold text-sage-800">Cancel editing</button>
          )}
        </div>
      </form>

      {/* Catalogue table */}
      <div className="mt-6 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
        <h2 className="font-display text-lg font-bold text-sage-900">Your catalogue ({products.length} products)</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-sage-500">
                <th className="pb-2 pr-3">Product</th><th className="pb-2 pr-3">Category</th><th className="pb-2 pr-3">Price</th><th className="pb-2 pr-3">Stock</th><th className="pb-2 pr-3">On shop?</th><th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-cream-100">
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-3">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl"><ProductArt motif={p.motif} gradient={p.gradient} className="h-11" /></span>
                      <span>
                        <span className="block font-semibold text-sage-900">{p.name}</span>
                        <span className="block text-xs text-sage-500">{p.badge || "No badge"}</span>
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">{p.category}</td>
                  <td className="py-2.5 pr-3 font-semibold">
                    {formatPKR(p.price)}
                    {p.oldPrice && <span className="ml-1 text-xs font-normal text-sage-500 line-through">{formatPKR(p.oldPrice)}</span>}
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="0"
                      value={p.stockQty ?? 0}
                      onChange={(e) => updateProduct(p.id, { stockQty: Math.max(0, Math.floor(Number(e.target.value) || 0)) })}
                      className="w-20 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-center"
                      aria-label={`Stock quantity for ${p.name}`}
                    />
                    <span className="ml-2 text-xs text-sage-600">{stockLabel(p)}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <button
                      onClick={() => updateProduct(p.id, { active: !p.active })}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${p.active ? "bg-sage-100 text-sage-800" : "bg-stone-200 text-stone-700"}`}
                    >
                      {p.active ? "Showing" : "Hidden"}
                    </button>
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} className="rounded-full border border-sage-300 bg-white px-3 py-1.5 text-xs font-semibold text-sage-800">Edit</button>
                      {confirmDelete === p.id ? (
                        <>
                          <button onClick={() => { deleteProduct(p.id); setConfirmDelete(null); setNotice(`Deleted “${p.name}”. Past orders are untouched.`); }} className="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Confirm delete</button>
                          <button onClick={() => setConfirmDelete(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold underline">Keep</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(p.id)} className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-sage-600">
          Hidden products stay in your catalogue but customers cannot see or order them. Deleting a
          product never changes past orders — they keep the product name and price as sold.{" "}
          <Link to="/shop/noor-studio" className="font-semibold underline">See the shop page →</Link>
        </p>
      </div>
    </div>
  );
}
