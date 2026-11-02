// Inline SVG product art — no image files anywhere in the repo.
import { motion, useReducedMotion } from "framer-motion";
export default function ProductArt({ motif, gradient, className = "h-44" }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} ${className}`}>
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/25" />
      <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/20" />
      <svg viewBox="0 0 120 120" className="relative mx-auto h-full w-auto py-5 text-sage-800/70" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {motif === "dress" && (
          <>
            <path d="M60 18 L44 30 L50 52 L40 96 Q60 106 80 96 L70 52 L76 30 Z" fill="rgba(255,255,255,0.35)" />
            <path d="M52 26 Q60 34 68 26" />
            <path d="M48 62 Q60 70 72 62" />
          </>
        )}
        {motif === "scarf" && (
          <>
            <path d="M38 22 Q60 12 82 22 L74 88 Q60 98 46 88 Z" fill="rgba(255,255,255,0.35)" />
            <path d="M46 40 Q60 48 74 40 M44 58 Q60 66 76 58 M46 76 Q60 84 74 76" />
          </>
        )}
        {motif === "bottle" && (
          <>
            <rect x="46" y="42" width="28" height="54" rx="10" fill="rgba(255,255,255,0.35)" />
            <rect x="52" y="26" width="16" height="16" rx="4" />
            <path d="M46 60 H74 M46 74 H74" />
          </>
        )}
        {motif === "drop" && (
          <>
            <path d="M60 20 Q82 52 82 70 A22 22 0 1 1 38 70 Q38 52 60 20 Z" fill="rgba(255,255,255,0.35)" />
            <path d="M50 72 a10 10 0 0 0 10 10" />
          </>
        )}
        {motif === "lipstick" && (
          <>
            <rect x="48" y="58" width="24" height="38" rx="6" fill="rgba(255,255,255,0.35)" />
            <path d="M54 58 L54 34 Q54 26 60 24 Q66 26 66 34 L66 58" fill="rgba(255,255,255,0.5)" />
            <path d="M48 70 H72" />
          </>
        )}
        {motif === "pencil" && (
          <>
            <path d="M52 24 L68 24 L68 78 L60 94 L52 78 Z" fill="rgba(255,255,255,0.35)" />
            <path d="M52 78 L68 78 M52 36 L68 36" />
          </>
        )}
        {motif === "jar" && (
          <>
            <rect x="40" y="46" width="40" height="46" rx="10" fill="rgba(255,255,255,0.35)" />
            <rect x="46" y="32" width="28" height="14" rx="6" />
            <path d="M48 66 H72" />
          </>
        )}
      </svg>
    </div>
  );
}

export function StatusBadge({ status }) {
  const reduce = useReducedMotion();
  const map = {
    New: "bg-sky-100 text-sky-800",
    "Awaiting confirmation": "bg-amber-100 text-amber-800",
    Confirmed: "bg-sage-100 text-sage-800",
    Packed: "bg-violet-100 text-violet-800",
    Shipped: "bg-blue-100 text-blue-800",
    Delivered: "bg-emerald-100 text-emerald-800",
    "Return in transit": "bg-orange-100 text-orange-800",
    "Returned to seller": "bg-red-100 text-red-800",
    Returned: "bg-red-100 text-red-800",
    "Expired — not confirmed": "bg-stone-200 text-stone-700",
  };
  const cls = `inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-cream-200 text-ink"}`;
  if (reduce) return <span className={cls}>{status}</span>;
  // Keyed on status so a status change animates in smoothly.
  return (
    <motion.span
      key={status}
      className={cls}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {status}
    </motion.span>
  );
}
