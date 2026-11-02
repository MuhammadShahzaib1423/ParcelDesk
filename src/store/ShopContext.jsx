import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedOrders, defaultSettings, sellers } from "../data/seed";
import { getTrustForPhone, findDuplicateOrder } from "../lib/orderInsights";

const ShopContext = createContext(null);

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Backfill fields added after the first version so orders saved earlier
// still work: trust snapshot, timestamps and duplicate link.
function normalizeOrders(list) {
  const arr = Array.isArray(list) ? list : seedOrders;
  return arr.map((o) => ({
    placedAt: null,
    confirmBy: null,
    duplicateOf: null,
    ...o,
    trustLabel: o.trustLabel || getTrustForPhone(arr, o.phone).label,
  }));
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ShopProvider({ children }) {
  const [orders, setOrders] = useState(() => normalizeOrders(load("parceldesk-orders", seedOrders)));
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
            return { ...o, status: "Expired — not confirmed", confirmedAt: "Never confirmed — time ran out" };
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

  useEffect(() => {
    try { localStorage.setItem("parceldesk-orders", JSON.stringify(orders)); } catch { /* storage full */ }
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem("parceldesk-settings", JSON.stringify(settings)); } catch { /* storage full */ }
  }, [settings]);

  const seller = useMemo(() => {
    const base = sellers.find((s) => s.slug === "noor-studio");
    return { ...base, name: settings.shopName, city: settings.city, whatsapp: settings.whatsapp };
  }, [settings]);

  const getSeller = (slug) => (slug === "noor-studio" ? seller : sellers.find((s) => s.slug === slug));

  const addToCart = (productId, qty) => {
    setCart((c) => ({ ...c, [productId]: Math.max(0, (c[productId] || 0) + qty) }));
  };
  const setQty = (productId, qty) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[productId];
      else next[productId] = qty;
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
    const trust = getTrustForPhone(orders, order.phone);
    const duplicate = findDuplicateOrder(orders, order.phone, order.items, now);
    const full = {
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
    };
    setOrders((o) => [full, ...o]);
    setLastOrderId(id);
    clearCart();
    return full;
  };

  const updateOrderStatus = (id, status) => {
    setOrders((o) =>
      o.map((ord) =>
        ord.id === id
          ? { ...ord, status, ...(status === "Confirmed" ? { confirmedAt: "Confirmed by customer" } : {}) }
          : ord
      )
    );
  };

  const value = {
    orders, settings, setSettings, cart, addToCart, setQty, clearCart,
    placeOrder, updateOrderStatus, lastOrderId, seller, getSeller,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
