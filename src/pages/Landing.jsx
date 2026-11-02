import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { sellers, formatPKR } from "../data/seed";
import { Reveal, TiltCard } from "../components/motion";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]" style={{ perspective: 1100 }}>
      <TiltCard max={6} className="relative">
        <div
          className="rounded-[2.6rem] border-[10px] border-sage-900 bg-white shadow-soft"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="overflow-hidden rounded-[2rem]">
            <div className="flex justify-center bg-sage-900 pb-1 pt-2">
              <span className="h-4 w-24 rounded-full bg-sage-900 ring-1 ring-white/20" aria-hidden="true" />
            </div>
            <div className="bg-gradient-to-br from-[#E7DCC3] to-[#CBD5C0] px-4 pb-3 pt-2">
              <p className="font-display text-lg font-bold text-sage-900">Noor Studio</p>
              <p className="text-xs text-sage-700">Lahore · ★ 4.8 · 1,200+ orders</p>
            </div>
            <div className="space-y-2.5 bg-cream-50 px-4 py-4">
              {[
                { name: "Mehrab Lawn 2-Piece", price: 3450 },
                { name: "Chandni Embroidered Kurti", price: 2899 },
                { name: "Bahar Print Dupatta", price: 950 },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-sage-500">{formatPKR(p.price)}</p>
                  </div>
                  <span className="rounded-full bg-sage-700 px-3 py-1 text-xs font-semibold text-cream-50">Add</span>
                </div>
              ))}
              <div className="rounded-2xl bg-sage-900 px-3 py-2.5 text-center text-sm font-semibold text-cream-50">
                Place order — cash on delivery
              </div>
              <p className="text-center text-[11px] leading-relaxed text-sage-500">
                The seller ships only after you confirm.
              </p>
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Floating cards — slow float animation, transform only */}
      <div className="animate-float absolute -left-8 top-16 z-10 hidden rounded-2xl border border-cream-200 bg-white px-3.5 py-2.5 shadow-soft sm:block" aria-hidden="true">
        <p className="text-xs font-bold text-sage-900">✓ Order confirmed</p>
        <p className="text-[11px] text-sage-500">Mahnoor T. · PKR 6,800</p>
      </div>
      <div className="animate-float-slow absolute -right-6 bottom-10 z-10 hidden rounded-2xl border border-cream-200 bg-white px-3.5 py-2.5 shadow-soft sm:block" aria-hidden="true">
        <p className="text-xs font-bold text-sage-900">RTO saved · PKR 350</p>
        <p className="text-[11px] text-sage-500">Unconfirmed order never shipped</p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div>
      {/* Hero with parallax layered shapes (pure CSS, transform only) */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="animate-drift absolute -left-20 top-10 h-72 w-72 rounded-full bg-sage-200/50 blur-2xl" />
          <div className="animate-drift-rev absolute -right-16 top-56 h-80 w-80 rounded-full bg-gold-400/20 blur-2xl" />
          <div className="animate-drift absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cream-300/60 blur-2xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <motion.div {...fadeUp}>
            <p className="inline-block rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sage-700">
              For Instagram, TikTok &amp; WhatsApp sellers in Pakistan
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.12] text-sage-900 sm:text-5xl">
              One ordering link. No more DM chaos. Fewer parcels coming back.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-sage-700">
              Small sellers take orders in chat messages, write details down by hand, and ship
              parcels that never get collected. ParcelDesk replaces the chat with one simple
              ordering page — and the parcel only ships after the customer confirms.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop/noor-studio" className="btn-lift rounded-full bg-sage-700 px-6 py-3 font-semibold text-cream-50 shadow-soft hover:bg-sage-800">
                Try the demo shop
              </Link>
              <Link to="/dashboard" className="btn-lift rounded-full border border-sage-300 bg-white px-6 py-3 font-semibold text-sage-800 hover:bg-sage-50">
                See the seller dashboard
              </Link>
            </div>
            <p className="mt-5 text-sm text-sage-600">
              No sign-up needed for this demo. Every seller, product and order here is fictional.
              Move your mouse over the phone — it tilts with you.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.12 }}>
            <PhoneMockup />
          </motion.div>
        </div>
      </section>

      {/* The honest stat */}
      <section className="border-y border-cream-200 bg-sage-900">
        <Reveal className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <p className="font-display text-2xl font-bold leading-snug text-cream-50 sm:text-3xl">
            “In one large Pakistani retailer&apos;s ~170,000 orders (June 2025–May 2026), 94.5%
            were cash on delivery and COD orders were cancelled 37.3% of the time, versus 2.8%
            for prepaid orders.”
          </p>
          <p className="mt-3 text-sm text-cream-200">Source: OrderNation study of a single large retailer — not a national average. COD is how Pakistan shops online, and unconfirmed COD orders are where sellers lose money.</p>
        </Reveal>
      </section>

      {/* The problem — staggered reveals */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-sage-900">The problem, in plain words</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { title: "Orders lost in chats", body: "A customer says “I want this one” in a DM. The seller asks for name, address and phone. The chat scrolls away, details get mixed up, and orders are written down by hand." },
            { title: "Parcels come back", body: "With cash on delivery, the rider arrives and nobody answers, or the customer has changed their mind. The seller pays the return cost — and the stock comes back unsold." },
            { title: "No record to learn from", body: "Without a list of orders, a seller cannot see which cities return the most parcels, which customers never confirm, or how much money returns are eating." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.1}>
              <article className="h-full rounded-3xl border border-cream-200 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-sage-900">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-sage-700">{c.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works — staggered reveals */}
      <section className="bg-cream-100">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-sage-900">How it works — 3 steps</h2>
          </Reveal>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { n: "1", title: "Seller shares one link", body: "The seller puts their ParcelDesk link in their Instagram or TikTok bio and in their WhatsApp status. One link for the whole shop." },
              { n: "2", title: "Customer orders in a form", body: "The customer picks products, enters name, mobile and address, and sees the full total including delivery — no bargaining in DMs, no missing details." },
              { n: "3", title: "Customer confirms, then it ships", body: "Before packing, the customer confirms the order. No confirmation, no parcel. Fewer failed deliveries, fewer return costs, happier riders." },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.12}>
                <li className="h-full rounded-3xl bg-white p-6 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 font-display text-lg font-bold text-white">{s.n}</span>
                  <h3 className="mt-3 font-display text-lg font-bold text-sage-900">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-sage-700">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Who it is for + demo sellers */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-bold text-sage-900">Who it is for</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-sage-700">
            Home-run clothing labels, cosmetics sellers, jewellery makers, bakers and gift shops —
            anyone in Pakistan who sells through social media and ships cash on delivery. If your
            shop lives in your DMs, this is your order desk.
          </p>
        </Reveal>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sellers.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.1}>
              <Link to={`/shop/${s.slug}`} className="group block rounded-3xl border border-cream-200 bg-white p-6 shadow-card transition hover:shadow-soft">
                <div className={`h-24 rounded-2xl bg-gradient-to-br ${s.accent}`} />
                <h3 className="mt-4 font-display text-xl font-bold text-sage-900 group-hover:underline">{s.name}</h3>
                <p className="mt-1 text-sage-700">{s.tagline}</p>
                <p className="mt-2 text-sm font-medium text-sage-600">{s.city} · {s.ordersServed} · ★ {s.rating}</p>
                <span className="mt-3 inline-block font-semibold text-sage-700 group-hover:text-sage-900">Visit the demo shop →</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1}>
          <div className="mt-10 flex flex-wrap items-center gap-3 rounded-3xl bg-sage-100 p-6">
            <p className="flex-1 font-display text-lg font-bold text-sage-900">Ready to see it end to end? Place a demo order, then watch it land in the dashboard.</p>
            <Link to="/shop/noor-studio" className="btn-lift rounded-full bg-sage-700 px-6 py-3 font-semibold text-cream-50 hover:bg-sage-800">Start with the demo shop</Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
