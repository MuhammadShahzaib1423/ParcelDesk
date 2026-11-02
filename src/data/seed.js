// All data in this file is FICTIONAL demo data. No real sellers,
// customers, phone numbers or businesses are represented here.

export const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Other",
];

export const ORDER_STATUSES = [
  "New",
  "Awaiting confirmation",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Returned",
  "Expired — not confirmed",
];

export const sellers = [
  {
    slug: "noor-studio",
    name: "Noor Studio",
    tagline: "Everyday lawn & embroidered wear, stitched with care.",
    city: "Lahore",
    whatsapp: "0300-1002003",
    responseTime: "Replies within a few hours",
    rating: "4.8",
    ordersServed: "1,200+ orders served",
    accent: "from-[#D9C9A8] via-[#EDE5D2] to-[#A9B89A]",
    motif: "dress",
    about:
      "Noor Studio is a small home-run clothing label in Lahore. Every order is packed by hand and checked twice before it leaves the house.",
  },
  {
    slug: "rose-glow",
    name: "Rose Glow Cosmetics",
    tagline: "Skin-first beauty, chosen for Pakistani skin and weather.",
    city: "Rawalpindi",
    whatsapp: "0301-4005006",
    responseTime: "Replies same day",
    rating: "4.9",
    ordersServed: "900+ orders served",
    accent: "from-[#E8CFC4] via-[#F5E8DF] to-[#CBD5C0]",
    motif: "bottle",
    about:
      "Rose Glow is a small cosmetics seller in Rawalpindi. Products are sealed, expiry-checked and packed with a free sample in every parcel.",
  },
];

export const products = [
  // Noor Studio — Lahore
  { id: "p1", sellerSlug: "noor-studio", name: "Mehrab Lawn 2-Piece", category: "Lawn", price: 3450, oldPrice: 3999, stock: "In stock", badge: "Bestseller", motif: "dress", gradient: "from-[#E7DCC3] to-[#CBD5C0]", desc: "Soft printed lawn shirt with matching trouser. Breathable summer fabric, ready to wear." },
  { id: "p2", sellerSlug: "noor-studio", name: "Chandni Embroidered Kurti", category: "Kurtis", price: 2899, oldPrice: null, stock: "In stock", badge: null, motif: "dress", gradient: "from-[#D9E2CF] to-[#A9B89A]", desc: "Neckline embroidery on soft cotton. A simple daily-wear kurti in four calm shades." },
  { id: "p3", sellerSlug: "noor-studio", name: "Gulnaar 3-Piece Festive", category: "Festive", price: 6450, oldPrice: 7200, stock: "Only 3 left", badge: "Festive", motif: "dress", gradient: "from-[#EAD9B8] to-[#D3B25E]", desc: "Embroidered shirt, trouser and chiffon dupatta. Made for family dinners and small events." },
  { id: "p4", sellerSlug: "noor-studio", name: "Sada Cotton Shalwar Set", category: "Cotton", price: 2650, oldPrice: null, stock: "In stock", badge: null, motif: "dress", gradient: "from-[#EFE9DA] to-[#CBD5C0]", desc: "Plain dyed cotton set, cut loose and comfortable. Easy to wash, easy to wear." },
  { id: "p5", sellerSlug: "noor-studio", name: "Bahar Print Dupatta", category: "Dupattas", price: 950, oldPrice: 1200, stock: "In stock", badge: null, motif: "scarf", gradient: "from-[#F0E4CE] to-[#A9B89A]", desc: "Lightweight printed dupatta, 2.5 metres. Pairs with plain suits and kurtis." },
  { id: "p6", sellerSlug: "noor-studio", name: "Noor Kids Frock", category: "Kids", price: 1999, oldPrice: null, stock: "In stock", badge: "New", motif: "dress", gradient: "from-[#F3E6D8] to-[#E4E9DD]", desc: "Soft cotton frock for ages 3–6, with a comfortable lining and easy buttons." },
  { id: "p7", sellerSlug: "noor-studio", name: "Winter Khaddar Suit", category: "Khaddar", price: 3950, oldPrice: null, stock: "Low stock", badge: null, motif: "dress", gradient: "from-[#DDD3B8] to-[#87997A]", desc: "Warm mid-weight khaddar in a muted check. Stitched with a roomy, relaxed fit." },
  { id: "p8", sellerSlug: "noor-studio", name: "Pearl Lace Lawn Shirt", category: "Lawn", price: 3150, oldPrice: 3500, stock: "In stock", badge: null, motif: "dress", gradient: "from-[#EDE5D2] to-[#C9A24B]", desc: "Lawn shirt with a fine lace hem. Dress it up with a dupatta, or wear it plain." },
  // Rose Glow — Rawalpindi
  { id: "p9", sellerSlug: "rose-glow", name: "Rose Day Moisturiser", category: "Skincare", price: 1450, oldPrice: 1700, stock: "In stock", badge: "Bestseller", motif: "bottle", gradient: "from-[#F2DCD2] to-[#E4E9DD]", desc: "Light day cream with rose water. Sinks in fast, no shine — made for humid days." },
  { id: "p10", sellerSlug: "rose-glow", name: "Glow Vitamin C Serum", category: "Skincare", price: 1899, oldPrice: null, stock: "In stock", badge: null, motif: "drop", gradient: "from-[#F5E3B8] to-[#E8CFC4]", desc: "A gentle daily serum for dull skin. Use a few drops at night, under moisturiser." },
  { id: "p11", sellerSlug: "rose-glow", name: "Matte Lip Colour — Rosewood", category: "Makeup", price: 850, oldPrice: null, stock: "In stock", badge: null, motif: "lipstick", gradient: "from-[#E5B8A8] to-[#CBD5C0]", desc: "Long-wear matte lipstick in a soft rosewood shade. One swipe, no feathering." },
  { id: "p12", sellerSlug: "rose-glow", name: "Herbal Hair Oil 200ml", category: "Hair", price: 1150, oldPrice: 1350, stock: "In stock", badge: null, motif: "bottle", gradient: "from-[#DDE3C8] to-[#A9B89A]", desc: "Amla and coconut blend, slow-infused. Massage in weekly for softer, calmer hair." },
  { id: "p13", sellerSlug: "rose-glow", name: "Gentle Face Wash", category: "Skincare", price: 950, oldPrice: null, stock: "Low stock", badge: null, motif: "bottle", gradient: "from-[#E4EFE2] to-[#CBD5C0]", desc: "Low-foam cleanser for sensitive skin. Rinses clean without tightness." },
  { id: "p14", sellerSlug: "rose-glow", name: "Kohl Kajal Pencil", category: "Makeup", price: 550, oldPrice: null, stock: "In stock", badge: null, motif: "pencil", gradient: "from-[#E8DCC8] to-[#87997A]", desc: "Soft, smudge-proof kajal that glides on in one line. Sealed and safety-tested." },
  { id: "p15", sellerSlug: "rose-glow", name: "Night Repair Cream", category: "Skincare", price: 1750, oldPrice: 2100, stock: "Only 2 left", badge: "New", motif: "jar", gradient: "from-[#EFE3D0] to-[#D3B25E]", desc: "Rich overnight cream for dry skin. Wake up to softer, rested-looking skin." },
];

export const seedOrders = [
  // Demo timestamps: placedAt/confirmBy are relative to first load so the
  // confirmation countdowns and the 24-hour duplicate window behave live.
  // placedAt is null for older demo orders where only the display date matters.
  { id: "PD-1041", sellerSlug: "noor-studio", customer: "Ayesha Khan", phone: "0302-1112233", address: "House 12, Street 4, Gulberg III", city: "Lahore", items: [{ productId: "p1", name: "Mehrab Lawn 2-Piece", qty: 1, price: 3450 }], subtotal: 3450, delivery: 200, total: 3650, status: "Delivered", date: "28 Oct 2026", notes: "Leave with the guard if no answer.", confirmedAt: "Confirmed by customer", trustLabel: "Trusted" },
  { id: "PD-1042", sellerSlug: "noor-studio", customer: "Fatima Noor", phone: "0312-4455667", address: "Flat 7, Block C, Satellite Town", city: "Rawalpindi", items: [{ productId: "p3", name: "Gulnaar 3-Piece Festive", qty: 1, price: 6450 }], subtotal: 6450, delivery: 350, total: 6800, status: "Returned", date: "27 Oct 2026", notes: "", returnReason: "Customer did not answer the rider's calls.", returnCost: 350, trustLabel: "Careful" },
  { id: "PD-1043", sellerSlug: "noor-studio", customer: "Hira Siddiqui", phone: "0333-7788990", address: "House 45, PECHS Block 2", city: "Karachi", items: [{ productId: "p2", name: "Chandni Embroidered Kurti", qty: 2, price: 2899 }], subtotal: 5798, delivery: 350, total: 6148, status: "Shipped", date: "30 Oct 2026", notes: "Call before delivery.", confirmedAt: "Confirmed by customer", placedAt: Date.now() - 5 * 3600e3 },
  { id: "PD-1044", sellerSlug: "noor-studio", customer: "Mahnoor Tariq", phone: "0308-9900112", address: "Street 9, Model Town", city: "Lahore", items: [{ productId: "p5", name: "Bahar Print Dupatta", qty: 2, price: 950 }, { productId: "p8", name: "Pearl Lace Lawn Shirt", qty: 1, price: 3150 }], subtotal: 5050, delivery: 200, total: 5250, status: "Confirmed", date: "1 Nov 2026", notes: "", confirmedAt: "Confirmed by customer" },
  { id: "PD-1045", sellerSlug: "noor-studio", customer: "Sana Malik", phone: "0345-2233445", address: "House 3, Street 11, F-11", city: "Islamabad", items: [{ productId: "p4", name: "Sada Cotton Shalwar Set", qty: 1, price: 2650 }], subtotal: 2650, delivery: 350, total: 3000, status: "Awaiting confirmation", date: "2 Nov 2026", notes: "", confirmedAt: "Waiting for customer", placedAt: Date.now() - 2 * 3600e3, confirmBy: Date.now() + 25 * 60e3 },
  { id: "PD-1046", sellerSlug: "noor-studio", customer: "Zainab Ahmed", phone: "0321-6677889", address: "House 90, Johar Town", city: "Lahore", items: [{ productId: "p6", name: "Noor Kids Frock", qty: 1, price: 1999 }], subtotal: 1999, delivery: 200, total: 2199, status: "New", date: "2 Nov 2026", notes: "Gift wrap if possible.", confirmedAt: "Not sent yet" },
  { id: "PD-1047", sellerSlug: "noor-studio", customer: "Rabia Akhtar", phone: "0300-5566778", address: "House 21, Gulshan-e-Iqbal", city: "Karachi", items: [{ productId: "p1", name: "Mehrab Lawn 2-Piece", qty: 1, price: 3450 }], subtotal: 3450, delivery: 350, total: 3800, status: "Returned", date: "25 Oct 2026", notes: "", returnReason: "Customer refused the parcel at the door.", returnCost: 350 },
  { id: "PD-1048", sellerSlug: "noor-studio", customer: "Iqra Bibi", phone: "0311-3344556", address: "Street 5, Peoples Colony", city: "Faisalabad", items: [{ productId: "p7", name: "Winter Khaddar Suit", qty: 1, price: 3950 }], subtotal: 3950, delivery: 350, total: 4300, status: "Packed", date: "1 Nov 2026", notes: "", confirmedAt: "Confirmed by customer" },
  { id: "PD-1049", sellerSlug: "noor-studio", customer: "Nimra Shahid", phone: "0334-8899001", address: "House 8, DHA Phase 5", city: "Lahore", items: [{ productId: "p2", name: "Chandni Embroidered Kurti", qty: 1, price: 2899 }, { productId: "p5", name: "Bahar Print Dupatta", qty: 1, price: 950 }], subtotal: 3849, delivery: 200, total: 4049, status: "Delivered", date: "29 Oct 2026", notes: "", confirmedAt: "Confirmed by customer" },
  { id: "PD-1050", sellerSlug: "noor-studio", customer: "Alina Raza", phone: "0306-1122334", address: "House 14, Askari 10", city: "Rawalpindi", items: [{ productId: "p9", name: "Rose Day Moisturiser", qty: 1, price: 1450 }], subtotal: 1450, delivery: 350, total: 1800, status: "Returned", date: "24 Oct 2026", notes: "Ordered from the wrong shop link.", returnReason: "Customer said she ordered by mistake.", returnCost: 350 },
  { id: "PD-1051", sellerSlug: "noor-studio", customer: "Komal Yousuf", phone: "0322-9988776", address: "House 30, North Nazimabad", city: "Karachi", items: [{ productId: "p3", name: "Gulnaar 3-Piece Festive", qty: 1, price: 6450 }], subtotal: 6450, delivery: 350, total: 6800, status: "Delivered", date: "26 Oct 2026", notes: "", confirmedAt: "Confirmed by customer" },
  { id: "PD-1052", sellerSlug: "noor-studio", customer: "Shazia Perveen", phone: "0309-4433221", address: "House 5, Cantt Area", city: "Multan", items: [{ productId: "p4", name: "Sada Cotton Shalwar Set", qty: 2, price: 2650 }], subtotal: 5300, delivery: 350, total: 5650, status: "Awaiting confirmation", date: "2 Nov 2026", notes: "", confirmedAt: "Waiting for customer", placedAt: Date.now() - 1 * 3600e3, confirmBy: Date.now() + 11 * 3600e3 },
  { id: "PD-1053", sellerSlug: "noor-studio", customer: "Mehwish Iqbal", phone: "0315-7766554", address: "House 18, Street 2, G-9", city: "Islamabad", items: [{ productId: "p8", name: "Pearl Lace Lawn Shirt", qty: 1, price: 3150 }], subtotal: 3150, delivery: 350, total: 3500, status: "Confirmed", date: "2 Nov 2026", notes: "", confirmedAt: "Confirmed by customer" },
  { id: "PD-1054", sellerSlug: "noor-studio", customer: "Uzma Khalid", phone: "0331-2211009", address: "House 66, Samanabad", city: "Lahore", items: [{ productId: "p5", name: "Bahar Print Dupatta", qty: 3, price: 950 }], subtotal: 2850, delivery: 200, total: 3050, status: "New", date: "2 Nov 2026", notes: "", confirmedAt: "Not sent yet" },
  // Extra demo orders for the unique features: a trusted repeat buyer
  // (Ayesha, 2 delivered, 0 returns), a careful repeat buyer (Fatima, 1 return),
  // a duplicate pair (Hira ordered the same kurti twice within hours), and an
  // order whose confirmation window already ran out (Bilal, Peshawar).
  { id: "PD-1055", sellerSlug: "noor-studio", customer: "Ayesha Khan", phone: "0302-1112233", address: "House 12, Street 4, Gulberg III", city: "Lahore", items: [{ productId: "p5", name: "Bahar Print Dupatta", qty: 1, price: 950 }], subtotal: 950, delivery: 200, total: 1150, status: "Delivered", date: "20 Oct 2026", notes: "", confirmedAt: "Confirmed by customer", trustLabel: "Trusted", placedAt: Date.now() - 9 * 24 * 3600e3 },
  { id: "PD-1056", sellerSlug: "noor-studio", customer: "Fatima Noor", phone: "0312-4455667", address: "Flat 7, Block C, Satellite Town", city: "Rawalpindi", items: [{ productId: "p4", name: "Sada Cotton Shalwar Set", qty: 1, price: 2650 }], subtotal: 2650, delivery: 350, total: 3000, status: "Delivered", date: "18 Oct 2026", notes: "", confirmedAt: "Confirmed by customer", trustLabel: "Careful", placedAt: Date.now() - 11 * 24 * 3600e3 },
  { id: "PD-1057", sellerSlug: "noor-studio", customer: "Hira Siddiqui", phone: "0333-7788990", address: "House 45, PECHS Block 2", city: "Karachi", items: [{ productId: "p2", name: "Chandni Embroidered Kurti", qty: 1, price: 2899 }], subtotal: 2899, delivery: 350, total: 3249, status: "New", date: "2 Nov 2026", notes: "", confirmedAt: "Not sent yet", trustLabel: "New buyer", placedAt: Date.now() - 2 * 3600e3, duplicateOf: "PD-1043" },
  { id: "PD-1058", sellerSlug: "noor-studio", customer: "Bilal Ahmed", phone: "0341-9900112", address: "House 9, University Road", city: "Peshawar", items: [{ productId: "p7", name: "Winter Khaddar Suit", qty: 1, price: 3950 }], subtotal: 3950, delivery: 350, total: 4300, status: "Expired — not confirmed", date: "1 Nov 2026", notes: "", confirmedAt: "Never confirmed — time ran out", trustLabel: "New buyer", placedAt: Date.now() - 30 * 3600e3, confirmBy: Date.now() - 18 * 3600e3 },
];

export const defaultSettings = {
  shopName: "Noor Studio",
  city: "Lahore",
  whatsapp: "0300-1002003",
  sameCityDelivery: 200,
  otherCityDelivery: 350,
  confirmationExpiryHours: 12,
  returnFee: 250,
  confirmationMessage:
    "Assalam-o-Alaikum! This is Noor Studio. Please confirm your order of {total} so we can pack and ship it. Reply YES to confirm.",
};

export function formatPKR(n) {
  return "PKR " + Number(n || 0).toLocaleString("en-PK");
}
