// Order timeline: the plain-words journey of one parcel, from placed to
// delivered — or down the return branch. Built from the order's recorded
// timeline events plus its current status, so it always matches the
// dashboard's view of the same order.
import { formatDateTime } from "../lib/orderInsights";

const MAIN_CHAIN = ["Placed", "Confirmed", "Packed", "Shipped", "Delivered"];
const RETURN_CHAIN = ["Return in transit", "Returned to seller"];

function statusIndex(order) {
  const map = {
    New: 0,
    "Awaiting confirmation": 0,
    Confirmed: 1,
    Packed: 2,
    Shipped: 3,
    Delivered: 4,
    "Return in transit": 4,
    "Returned to seller": 4,
    Returned: 4,
    "Expired — not confirmed": 0,
  };
  return map[order.status] ?? 0;
}

function eventTime(order, needle) {
  const hit = [...(order.timeline || [])].reverse().find((t) => t.event.toLowerCase().includes(needle.toLowerCase()));
  return hit ? hit.at : null;
}

const NEXT_LINE = {
  Placed: "The seller will send a confirmation message next.",
  Confirmed: "The seller will pack the parcel next.",
  Packed: "The parcel will be handed to the courier next.",
  Shipped: "The rider is on the way — please keep your phone nearby.",
  Delivered: "Delivered. Thank you for ordering.",
  "Return in transit": "The parcel is travelling back to the seller. It is not counted as lost until it arrives back.",
  "Returned to seller": "The parcel is back with the seller. The seller may offer a reship or a refund.",
  "Expired — not confirmed": "This order was never confirmed, so it was never shipped. No charge was made.",
};

export default function OrderTimeline({ order }) {
  if (!order) return null;
  const idx = statusIndex(order);
  const hasReturn = Boolean(order.returnInfo) || order.status === "Return in transit" || order.status === "Returned to seller" || order.status === "Returned";
  const expired = order.status === "Expired — not confirmed";

  const stepState = (stepIdx) => {
    if (expired) return stepIdx === 0 ? "done" : "todo";
    if (stepIdx < idx) return "done";
    if (stepIdx === idx) return order.status === "Delivered" ? "done" : "current";
    return "todo";
  };

  const times = {
    Placed: order.placedAt || eventTime(order, "Order placed"),
    Confirmed: eventTime(order, "Status changed to Confirmed") || (order.confirmedAt === "Confirmed by customer" ? order.placedAt : null),
    Packed: eventTime(order, "Status changed to Packed"),
    Shipped: eventTime(order, "Status changed to Shipped"),
    Delivered: eventTime(order, "Status changed to Delivered"),
    "Return in transit": order.returnInfo?.returnedAt || eventTime(order, "Return recorded"),
    "Returned to seller": order.returnInfo?.receivedAt || eventTime(order, "received back"),
  };

  const dot = (state) =>
    state === "done"
      ? "bg-sage-600 text-cream-50"
      : state === "current"
        ? "bg-gold-500 text-white ring-4 ring-gold-400/30"
        : "bg-cream-200 text-sage-400";

  return (
    <div>
      <ol className="space-y-0">
        {MAIN_CHAIN.map((step, i) => {
          const state = stepState(i);
          return (
            <li key={step} className="relative flex gap-3 pb-5 last:pb-0">
              {i < MAIN_CHAIN.length - 1 && (
                <span className={`absolute left-[15px] top-8 h-[calc(100%-28px)] w-0.5 ${state === "done" ? "bg-sage-400" : "bg-cream-200"}`} aria-hidden="true" />
              )}
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dot(state)}`}>
                {state === "done" ? "✓" : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sage-900">
                  {step}
                  {step === "Placed" && order.status === "Awaiting confirmation" ? " — waiting for your confirmation" : ""}
                </p>
                {times[step] && <p className="text-xs text-sage-500">{formatDateTime(times[step])}</p>}
                {state === "current" && step !== "Delivered" && (
                  <p className="text-sm text-sage-700">{NEXT_LINE[step]}</p>
                )}
                {state === "done" && step === "Delivered" && <p className="text-sm text-sage-700">{NEXT_LINE.Delivered}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {hasReturn && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-display font-bold text-red-900">Return journey</p>
          <ol className="mt-3 space-y-0">
            {RETURN_CHAIN.map((step, i) => {
              const done = order.status === "Returned to seller" || order.status === "Returned" || (i === 0 && order.status === "Return in transit");
              const current = i === 0 && order.status === "Return in transit";
              return (
                <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
                  {i === 0 && (
                    <span className={`absolute left-[15px] top-8 h-[calc(100%-28px)] w-0.5 ${done ? "bg-red-300" : "bg-cream-200"}`} aria-hidden="true" />
                  )}
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-red-600 text-white" : current ? "bg-gold-500 text-white ring-4 ring-gold-400/30" : "bg-cream-200 text-sage-400"}`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-red-900">{step}</p>
                    {times[step] && <p className="text-xs text-red-700/70">{formatDateTime(times[step])}</p>}
                    {current && <p className="text-sm text-red-800">{NEXT_LINE[step]}</p>}
                    {done && step === "Returned to seller" && <p className="text-sm text-red-800">{NEXT_LINE["Returned to seller"]}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {order.returnInfo && (
            <p className="mt-3 text-sm text-red-800">
              Reason: {order.returnInfo.reason} · Courier: {order.returnInfo.courier || "—"} · Tracking: {order.returnInfo.awb || "—"}
              {order.returnInfo.note ? ` · Note: ${order.returnInfo.note}` : ""}
            </p>
          )}
        </div>
      )}

      {expired && (
        <p className="mt-4 rounded-2xl bg-stone-100 px-4 py-3 text-sm leading-relaxed text-stone-700">
          {NEXT_LINE["Expired — not confirmed"]}
        </p>
      )}

      {order.timeline && order.timeline.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-semibold text-sage-700 underline">Full activity history ({order.timeline.length} events)</summary>
          <ul className="mt-2 space-y-1.5 border-l-2 border-cream-200 pl-3 text-sm">
            {[...order.timeline].reverse().map((t, i) => (
              <li key={i} className="text-sage-700">
                <span className="font-medium text-sage-900">{t.event}</span>{" "}
                <span className="text-xs text-sage-500">· {formatDateTime(t.at)} · {t.by}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
