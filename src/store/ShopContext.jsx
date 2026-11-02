import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedOrders, defaultSettings, sellers, products as seedProducts } from "../data/seed";
import {
  getTrustForPhone,
  findDuplicateOrder,
  normalizePhone,
  stockQtyFromLabel,
} from "../lib/orderInsights";

const ShopContext = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function stamp(order, event, by = "Seller") {
  const timeline = [...(order.timeline || []), { at: Date.now(), event, by }];
  return { ...order, timeline };
}

// Backfill fields added after the first version so orders saved earlier
// still work. Legacy "Returned" orders become "Returned to seller" with a
// return record built from their old reason/cost fields, and shipped+
// orders gain a demo courier + tracking number so the import demo matches.
function normalizeOrders(list, flaggedPhones = []) {
  const arr = Array.isArray(list) ? list : seedOrders;
  return arr.map((o) => {
    const base = {
      courier: "",
      awb: "",
      returnInfo: null,
      timeline: [],
      reshipOf: null,
      flagged: false,
      refundNote: "",
      sellerNotes: [],
      resentCount: 0,
      placedAt: null,
      confirmBy: null,
      duplicateOf: null,
      ...o,
    };
    const num = String(o.id || "").replace("PD-", "");
    if (!base.courier && ["Packed", "Shipped", "Delivered", "Return in transit", "Returned to seller", "Returned"].includes(base.status)) {
      base.courier = "TCS";
    }
    if (!base.awb && ["Packed", "Shipped", "Delivered", "Return in transit", "Returned to seller", "Returned"].includes(base.status)) {
      base.awb = `AWB-${num}`;
    }
    if (base.status === "Returned") {
      const day = Date.parse(o.date || "") || Date.now();
      base.status = "Returned to seller";
      base.returnInfo = base.returnInfo || {
        reason: o.returnReason || "Not stated",
        fee: o.returnCost ?? o.delivery ?? 0,
        returnedAt: day + 2 * 86400000,
        receivedAt: day + 5 * 86400000,
        courier: base.courier || "TCS",
        awb: base.awb || `AWB-${num}`,
        note: "",
        source: "manual",
        importFile: "",
      };
    }
    if (base.timeline.length === 0) {
      const at = base.placedAt || Date.parse(o.date || "") || Date.now();
      base.timeline = [{ at, event: "Order placed", by: "Customer" }];
      if (base.returnInfo) {
        base.timeline.push({
          at: base.returnInfo.returnedAt || at,
          event: `Return recorded — ${base.returnInfo.reason}`,
          by: "Seller",
        });
      }
    }
    // Trust snapshot is always recomputed live from order history, so a
    // return recorded later moves the badge on every order for that number.
    base.trustLabel = getTrustForPhone(arr, o.phone, flaggedPhones).label;
    return base;
  });
}

function normalizeProducts(list) {
  const arr = Array.isArray(list) ? list : seedProducts;
  return arr.map((p) => ({
    stockQty: stockQtyFromLabel(p.stock),
    active: true,
    isCustom: false,
    ...p,
    stockQty: p.stockQty ?? stockQtyFromLabel(p.stock),
    active: p.active ?? true,
    isCustom: p.isCustom ?? false,
  }));
}

export function ShopProvider({ children }) {
  const [flaggedPhones, setFlaggedPhones] = useState(() => load("parceldesk-flagged-phones", []));
  const [orders, setOrders] = useState(() => normalizeOrders(load("parceldesk-orders", seedOrders), load("parceldesk-flagged-phones", [])));
  const [products, setProducts] = useState(() => normalizeProducts(load("parceldesk-products", seedProducts)));
  const [imports, setImports] = useState(() => load("parceldesk-imports", []));
  const [onboarding, setOnboarding] = useState(() =>
    ({ productAdded: false, orderPlaced: false, returnRecorded: false, sampleImported: false, ...load("parceldesk-onboarding", {}) })
  );
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...load("parceldesk-settings", {}) }));
  const [cart, setCart] = useState({}); // { productId: qty }
  const [lastOrderId, setLastOrderId] = useState(null);

  // Confirmation countdown: unconfirmed orders whose seller-set window has
  // run out move to "Expired — not confirmed" automatically.
  useEffect(() => {
    const expireOverdue = () => {
      const now = Date.now();
      setOrders((prev) => {
        let changed = false;
        const next = prev.map((o) => {
          if (o.status === "Awaiting confirmation" && o.confirmBy && o.confirmBy <= now) {
            changed = true;
            return stamp(
              { ...o, status: "Expired — not confirmed", confirmedAt: "Never confirmed — time ran out" },
              "Confirmation window ran out — order expired",
              "System"
            );
          }
          return o;
        });
        return changed ? next : prev;
      });
    };
    expireOverdue();
    const timer = setInterval(expireOverdue, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { save("parceldesk-orders", orders); }, [orders]);
  useEffect(() => { save("parceldesk-products", products); }, [products]);
  useEffect(() => { save("parceldesk-imports", imports); }, [imports]);
  useEffect(() => { save("parceldesk-flagged-phones", flaggedPhones); }, [flaggedPhones]);
  useEffect(() => { save("parceldesk-onboarding", onboarding); }, [onboarding]);
  useEffect(() => { save("parceldesk-settings", settings); }, [settings]);

  const seller = useMemo(() => {
    const base = sellers.find((s) => s.slug === "noor-studio");
    return { ...base, name: settings.shopName, city: settings.city, whatsapp: settings.whatsapp };
  }, [settings]);

  const getSeller = (slug) => (slug === "noor-studio" ? seller : sellers.find((s) => s.slug === slug));
  const productsFor = (slug) => products.filter((p) => p.sellerSlug === slug && p.active);
  const getProduct = (id) => products.find((p) => p.id === id);

  const markOnboarding = (key) =>
    setOnboarding((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const addToCart = (productId, qty) => {
    const p = products.find((x) => x.id === productId);
    if (!p || !p.active || (p.stockQty ?? 0) <= 0) return;
    setCart((c) => {
      const next = Math.max(0, (c[productId] || 0) + qty);
      return { ...c, [productId]: Math.min(next, p.stockQty) };
    });
  };
  const setQty = (productId, qty) => {
    const p = products.find((x) => x.id === productId);
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = p ? Math.min(qty, Math.max(1, p.stockQty)) : qty;
      return next;
    });
  };
  const clearCart = () => setCart({});

  const placeOrder = (order) => {
    const maxNum = orders.reduce((m, o) => {
      const n = parseInt(String(o.id).replace("PD-", ""), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 1054);
    const id = "PD-" + (maxNum + 1);
    const now = Date.now();
    const expiryHours = Math.min(72, Math.max(1, Number(settings.confirmationExpiryHours) || 12));
    const trust = getTrustForPhone(orders, order.phone, flaggedPhones);
    const duplicate = findDuplicateOrder(orders, order.phone, order.items, now);
    const full = stamp(
      {
        ...order,
        id,
        sellerSlug: "noor-studio",
        status: "Awaiting confirmation",
        date: todayLabel(),
        confirmedAt: "Waiting for customer",
        trustLabel: trust.label,
        placedAt: now,
        confirmBy: now + expiryHours * 3600e3,
        duplicateOf: order.duplicateOf || (duplicate ? duplicate.id : null),
        courier: "",
        awb: "",
        returnInfo: null,
        reshipOf: order.reshipOf || null,
        flagged: false,
        refundNote: "",
        sellerNotes: [],
        resentCount: 0,
      },
      "Order placed",
      "Customer"
    );
    setOrders((o) => [full, ...o]);
    setLastOrderId(id);
    clearCart();
    markOnboarding("orderPlaced");
    return full;
  };

  // Every status change stamps the order timeline. Moving to
  // "Returned to seller" with a return record stamps the received date.
  const updateOrderStatus = (id, status, by = "Seller") => {
    setOrders((o) =>
      o.map((ord) => {
        if (ord.id !== id) return ord;
        let next = { ...ord, status, ...(status === "Confirmed" ? { confirmedAt: "Confirmed by customer" } : {}) };
        if (status === "Returned to seller" && next.returnInfo && !next.returnInfo.receivedAt) {
          next = { ...next, returnInfo: { ...next.returnInfo, receivedAt: Date.now() } };
        }
        return stamp(next, `Status changed to ${status}`, by);
      })
    );
  };

  const setCourierInfo = (id, { courier, awb }) => {
    setOrders((o) =>
      o.map((ord) => {
        if (ord.id !== id) return ord;
        if (ord.courier === courier && ord.awb === awb) return ord;
        return stamp({ ...ord, courier, awb }, `Courier details updated — ${courier} ${awb}`, "Seller");
      })
    );
  };

  // The core of the returns flow: a return is recorded with courier, AWB,
  // reason, fee and date. The parcel is "Return in transit" until the
  // seller marks it received (or records it as already back).
  const recordReturn = (id, { courier, awb, reason, fee, note, returnDate, alreadyBack }) => {
    const returnedAt = returnDate ? new Date(`${returnDate}T12:00:00`).getTime() : Date.now();
    let result = null;
    setOrders((o) =>
      o.map((ord) => {
        if (ord.id !== id) return ord;
        const returnInfo = {
          reason,
          fee: Number(fee) || 0,
          returnedAt,
          receivedAt: alreadyBack ? returnedAt : null,
          courier,
          awb,
          note: note || "",
          source: "manual",
          importFile: "",
        };
        result = { ...ord, status: alreadyBack ? "Returned to seller" : "Return in transit", courier, awb, returnInfo };
        result = stamp(result, `Return recorded — ${reason} (${courier} ${awb}, ${Number(fee) || 0} fee)`, "Seller");
        if (alreadyBack) result = stamp(result, "Parcel received back from courier", "Seller");
        return result;
      })
    );
    markOnboarding("returnRecorded");
    return result;
  };

  const markReturnReceived = (id) => {
    setOrders((o) =>
      o.map((ord) => {
        if (ord.id !== id || !ord.returnInfo) return ord;
        const next = {
          ...ord,
          status: "Returned to seller",
          returnInfo: { ...ord.returnInfo, receivedAt: Date.now() },
        };
        return stamp(next, "Parcel received back from courier", "Seller");
      })
    );
  };

  const reshipOrder = (id) => {
    const original = orders.find((o) => o.id === id);
    if (!original || original.status !== "Returned to seller") return null;
    const now = Date.now();
    const maxNum = orders.reduce((m, o) => {
      const n = parseInt(String(o.id).replace("PD-", ""), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 1054);
    const newId = "PD-" + (maxNum + 1);
    const copy = stamp(
      {
        customer: original.customer,
        phone: original.phone,
        address: original.address,
        city: original.city,
        notes: original.notes,
        items: original.items,
        subtotal: original.subtotal,
        delivery: original.delivery,
        total: original.total,
        id: newId,
        sellerSlug: original.sellerSlug,
        status: "Confirmed",
        date: todayLabel(),
        confirmedAt: "Confirmed by customer",
        trustLabel: getTrustForPhone(orders, original.phone, flaggedPhones).label,
        placedAt: now,
        confirmBy: null,
        duplicateOf: null,
        courier: "",
        awb: "",
        returnInfo: null,
        reshipOf: original.id,
        flagged: false,
        refundNote: "",
        sellerNotes: [],
        resentCount: 0,
      },
      `Reship of ${original.id} created`,
      "Seller"
    );
    setOrders((o) => [
      copy,
      ...o.map((ord) => (ord.id === id ? stamp(ord, `Reshipped as ${newId}`, "Seller") : ord)),
    ]);
    return copy;
  };

  const resendConfirmation = (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status !== "Awaiting confirmation" || (order.resentCount || 0) >= 1) return false;
    const expiryHours = Math.min(72, Math.max(1, Number(settings.confirmationExpiryHours) || 12));
    setOrders((o) =>
      o.map((ord) =>
        ord.id === id
          ? stamp(
              { ...ord, confirmBy: Date.now() + expiryHours * 3600e3, resentCount: (ord.resentCount || 0) + 1 },
              `Confirmation message resent — new ${expiryHours}h window`,
              "Seller"
            )
          : ord
      )
    );
    return true;
  };

  const toggleFlagPhone = (phone) => {
    const target = normalizePhone(phone);
    setFlaggedPhones((prev) => {
      const exists = prev.some((p) => normalizePhone(p) === target);
      return exists ? prev.filter((p) => normalizePhone(p) !== target) : [...prev, phone];
    });
  };

  const isPhoneFlagged = (phone) => flaggedPhones.some((p) => normalizePhone(p) === normalizePhone(phone));

  const addOrderNote = (id, text, kind = "note") => {
    const clean = String(text || "").trim();
    if (!clean) return;
    setOrders((o) =>
      o.map((ord) => {
        if (ord.id !== id) return ord;
        const entry = { at: Date.now(), text: clean, kind };
        const next = {
          ...ord,
          sellerNotes: [...(ord.sellerNotes || []), entry],
          ...(kind === "refund" ? { refundNote: clean } : {}),
        };
        return stamp(next, kind === "refund" ? `Refund recorded: ${clean}` : `Note: ${clean}`, "Seller");
      })
    );
  };

  // Apply approved courier-sheet rows. Each applied row writes exactly what
  // a hand recording would write, and stamps the order with import source.
  const applyImport = ({ fileName, applied, unmatched }) => {
    const now = Date.now();
    setOrders((prev) =>
      prev.map((ord) => {
        const row = applied.find((r) => r.orderId === ord.id);
        if (!row) return ord;
        let next = { ...ord };
        if (row.courier) next.courier = row.courier;
        if (row.awb) next.awb = row.awb;
        if (row.targetStatus) {
          next.status = row.targetStatus;
          if (row.targetStatus === "Delivered") next.confirmedAt = "Confirmed by customer";
        }
        if (row.isReturn) {
          const returnedAt = row.date ? new Date(`${row.date}T12:00:00`).getTime() : now;
          next.returnInfo = {
            reason: row.reason || "Not stated",
            fee: (row.fee ?? Number(settings.returnFee)) || 0,
            returnedAt,
            receivedAt: row.targetStatus === "Returned to seller" ? returnedAt : next.returnInfo?.receivedAt || null,
            courier: next.courier,
            awb: next.awb,
            note: row.reason || "",
            source: "import",
            importFile: fileName,
          };
          next = stamp(next, `Return recorded from courier sheet (${fileName}) — ${next.returnInfo.reason}`, "System");
        } else if (row.targetStatus) {
          next = stamp(next, `Updated by courier sheet import (${fileName}) — ${row.rawStatus || row.targetStatus}`, "System");
        }
        return next;
      })
    );
    setImports((prev) => [
      { at: now, fileName, applied: applied.length, unmatched: unmatched || 0 },
      ...prev,
    ]);
    if (applied.length > 0) {
      markOnboarding("sampleImported");
      markOnboarding("returnRecorded");
    }
  };

  const addProduct = (data) => {
    const id = `p-custom-${Date.now()}`;
    const product = {
      id,
      sellerSlug: "noor-studio",
      name: data.name,
      category: data.category,
      price: Number(data.price) || 0,
      oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
      stock: "",
      stockQty: Math.max(0, Number(data.stockQty) || 0),
      badge: data.badge || null,
      motif: data.motif || "dress",
      gradient: data.gradient || "from-[#E7DCC3] to-[#CBD5C0]",
      desc: data.desc || "",
      active: true,
      isCustom: true,
    };
    setProducts((prev) => [...prev, product]);
    markOnboarding("productAdded");
    return product;
  };

  const updateProduct = (id, patch) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  };

  const resetDemoData = () => {
    ["parceldesk-orders", "parceldesk-products", "parceldesk-imports", "parceldesk-flagged-phones", "parceldesk-onboarding", "parceldesk-settings"].forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
    setFlaggedPhones([]);
    setOrders(normalizeOrders(seedOrders, []));
    setProducts(normalizeProducts(seedProducts));
    setImports([]);
    setOnboarding({ productAdded: false, orderPlaced: false, returnRecorded: false, sampleImported: false });
    setSettings({ ...defaultSettings });
    setCart({});
    setLastOrderId(null);
  };

  const value = {
    orders, products, productsFor, getProduct, imports, flaggedPhones,
    onboarding, markOnboarding, settings, setSettings, cart,
    addToCart, setQty, clearCart,
    placeOrder, updateOrderStatus, setCourierInfo, recordReturn,
    markReturnReceived, reshipOrder, resendConfirmation, toggleFlagPhone,
    isPhoneFlagged, addOrderNote, applyImport,
    addProduct, updateProduct, deleteProduct, resetDemoData,
    lastOrderId, seller, getSeller,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
