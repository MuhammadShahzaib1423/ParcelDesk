// Record Return form — the 30-second way a seller tells ParcelDesk a parcel
// came back. Used on the Returns page and inside the order detail panel.
// Writes exactly the same record the courier-sheet import writes.
import { useState } from "react";
import { COURIERS, RETURN_REASONS, formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function RecordReturnForm({ order, onDone, compact = false }) {
  const { settings, recordReturn } = useShop();
  const [courier, setCourier] = useState(order?.courier || settings.defaultCourier || "TCS");
  const [awb, setAwb] = useState(order?.awb || "");
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [fee, setFee] = useState(settings.returnFee ?? 250);
  const [note, setNote] = useState("");
  const [returnDate, setReturnDate] = useState(todayISO());
  const [alreadyBack, setAlreadyBack] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!order) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!awb.trim()) {
      setError("Please enter the tracking / AWB number — it is how returns are matched to orders.");
      return;
    }
    recordReturn(order.id, {
      courier,
      awb: awb.trim(),
      reason,
      fee,
      note: note.trim(),
      returnDate,
      alreadyBack,
    });
    setSaved(true);
    setError("");
    if (onDone) onDone();
  };

  if (saved && compact) {
    return (
      <p className="rounded-2xl bg-sage-100 px-4 py-3 text-sm font-semibold text-sage-800">
        ✓ Return recorded for {order.id}. It now shows as “{alreadyBack ? "Returned to seller" : "Return in transit"}” everywhere — RTO log, funnel, city risk board, trust score and savings.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-red-200 bg-white p-5 shadow-card">
      <h3 className="font-display text-lg font-bold text-sage-900">Record a return — {order.id}</h3>
      <p className="mt-1 text-sm leading-relaxed text-sage-600">
        Tell ParcelDesk the parcel came back. The order moves to “Return in transit” until you mark the
        parcel received — only then is it counted as money lost. {order.customer} · {order.city} · {formatPKR(order.total)}
      </p>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">{error}</p>}
      {saved && (
        <p className="mt-3 rounded-2xl bg-sage-100 px-4 py-2.5 text-sm font-semibold text-sage-800">
          ✓ Return recorded. You can record another update below, or close this form.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-courier-${order.id}`}>Courier company</label>
          <select id={`rr-courier-${order.id}`} value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
            {COURIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-awb-${order.id}`}>Tracking / AWB number</label>
          <input id={`rr-awb-${order.id}`} value={awb} onChange={(e) => setAwb(e.target.value)} placeholder="e.g. AWB-1043" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-reason-${order.id}`}>Return reason</label>
          <select id={`rr-reason-${order.id}`} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5">
            {RETURN_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-date-${order.id}`}>Return date</label>
          <input id={`rr-date-${order.id}`} type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-fee-${order.id}`}>Return fee charged (PKR)</label>
          <input id={`rr-fee-${order.id}`} type="number" min="0" value={fee} onChange={(e) => setFee(e.target.value)} className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
          <p className="mt-1 text-xs text-sage-500">What the courier charged for the failed delivery and return.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-sage-900" htmlFor={`rr-note-${order.id}`}>Note (optional)</label>
          <input id={`rr-note-${order.id}`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rider said gate was locked" className="mt-1 w-full rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5" />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-sage-800">
        <input type="checkbox" checked={alreadyBack} onChange={(e) => setAlreadyBack(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#43523B]" />
        <span>The parcel is already back with me — mark it “Returned to seller” straight away.</span>
      </label>

      <button type="submit" className="btn-lift mt-4 w-full rounded-full bg-red-700 py-3 font-semibold text-white hover:bg-red-800">
        Record this return
      </button>
      <p className="mt-2 text-center text-xs text-sage-500">
        No return exists in ParcelDesk unless it is recorded here or imported from a courier sheet.
      </p>
    </form>
  );
}
