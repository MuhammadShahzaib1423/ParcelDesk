// Returns command centre: how the seller knows a parcel came back.
// Three connected ways, all writing the same record:
//  1. Record a return by hand (30 seconds) — courier, tracking number,
//     reason, fee, date. The parcel waits in "Return in transit" until the
//     seller marks it received.
//  2. Import the courier's daily sheet (CSV) — matched by tracking number,
//     then phone. Only rows the seller approves are applied.
//  3. Every return lands in the RTO log below, with its cost and trail.
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { formatPKR } from "../data/seed";
import { useShop } from "../store/ShopContext";
import { DashTabs } from "../components/Layout";
import { StatusBadge } from "../components/ProductArt";
import RecordReturnForm from "../components/RecordReturnForm";
import {
  effectiveReturnInfo,
  formatDay,
  isAnyReturn,
  isCompletedReturn,
  normalizePhone,
  returnDaysAway,
  topReturnReason,
  totalReturnFees,
} from "../lib/orderInsights";
import {
  COLUMN_GUIDE,
  IMPORT_TARGET_STATUSES,
  detectColumns,
  downloadCSVFile,
  mapImportStatus,
  parseCSV,
  parseFee,
  sampleSheetCSV,
} from "../lib/csv";

const LIFECYCLE = ["New", "Awaiting confirmation", "Confirmed", "Packed", "Shipped", "Delivered"];

function matchOrder(orders, awb, phone) {
  const awbNorm = String(awb || "").trim().toLowerCase();
  if (awbNorm) {
    const byAwb = orders.find((o) => String(o.awb || "").trim().toLowerCase() === awbNorm);
    if (byAwb) return { order: byAwb, by: "tracking number" };
  }
  const phoneNorm = normalizePhone(phone);
  if (phoneNorm) {
    const byPhone = orders.find((o) => normalizePhone(o.phone) === phoneNorm);
    if (byPhone) return { order: byPhone, by: "phone number" };
  }
  return { order: null, by: null };
}

export default function Returns() {
  const { orders, settings, markReturnReceived, applyImport, imports } = useShop();
  const [reasonFilter, setReasonFilter] = useState("All");
  const [courierFilter, setCourierFilter] = useState("All");
  const [recordForId, setRecordForId] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null); // { rows, warnings }
  const [importError, setImportError] = useState("");
  const [importDone, setImportDone] = useState("");
  const fileRef = useRef(null);

  const returnOrders = useMemo(
    () => orders.filter((o) => isAnyReturn(o)),
    [orders]
  );
  const inTransit = useMemo(
    () => orders.filter((o) => o.status === "Return in transit"),
    [orders]
  );
  const completed = useMemo(() => orders.filter((o) => isCompletedReturn(o)), [orders]);
  const fees = useMemo(() => totalReturnFees(orders), [orders]);
  const top = useMemo(() => topReturnReason(orders), [orders]);

  const reasons = useMemo(
    () => ["All", ...new Set(returnOrders.map((o) => effectiveReturnInfo(o)?.reason).filter(Boolean))],
    [returnOrders]
  );
  const couriers = useMemo(
    () => ["All", ...new Set(returnOrders.map((o) => effectiveReturnInfo(o)?.courier).filter(Boolean))],
    [returnOrders]
  );

  const filteredLog = useMemo(
    () =>
      returnOrders.filter((o) => {
        const info = effectiveReturnInfo(o);
        if (reasonFilter !== "All" && info?.reason !== reasonFilter) return false;
        if (courierFilter !== "All" && info?.courier !== courierFilter) return false;
        return true;
      }),
    [returnOrders, reasonFilter, courierFilter]
  );

  const recordable = useMemo(
    () => orders.filter((o) => ["Shipped", "Delivered"].includes(o.status)),
    [orders]
  );
  const recordFor = orders.find((o) => o.id === recordForId) || null;

  const downloadSample = () => downloadCSVFile("parceldesk-sample-sheet.csv", sampleSheetCSV(orders));

  const onFile = (file) => {
    setImportError("");
    setImportDone("");
    setPreview(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setImportError("Please choose a .csv file — courier sheets arrive as CSV. Other formats are not read.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportError("That file is over 2 MB. Please split the sheet into smaller files and import one at a time.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(reader.result);
        if (rows.length < 2) {
          setImportError("The sheet looks empty — it needs a header row plus at least one order row.");
          return;
        }
        const cols = detectColumns(rows[0]);
        if (cols.awb < 0 && cols.phone < 0) {
          setImportError("Could not find a tracking-number or phone column. Check the column guide below for the accepted headings.");
          return;
        }
        const built = rows.slice(1).map((cells, i) => {
          const get = (idx) => (idx >= 0 ? String(cells[idx] ?? "").trim() : "");
          const awb = get(cols.awb);
          const phone = get(cols.phone);
          const rawStatus = get(cols.status);
          const reason = get(cols.reason);
          const date = get(cols.date);
          const fee = parseFee(get(cols.fee));
          const mapped = mapImportStatus(rawStatus);
          const { order, by } = matchOrder(orders, awb, phone);
          let state = "unmatched";
          let note = "No order found for this tracking number / phone.";
          let checked = false;
          let targetStatus = null;
          let isReturn = false;
          if (order) {
            if (mapped.kind === "unknown") {
              state = "current";
              note = "Status wording not recognised — nothing will change for this order.";
            } else {
              targetStatus = IMPORT_TARGET_STATUSES[mapped.kind];
              isReturn = mapped.kind === "return-transit" || mapped.kind === "return-received";
              const regresses =
                !isReturn &&
                LIFECYCLE.indexOf(targetStatus) >= 0 &&
                LIFECYCLE.indexOf(order.status) >= 0 &&
                LIFECYCLE.indexOf(targetStatus) < LIFECYCLE.indexOf(order.status);
              const alreadyThere =
                order.status === targetStatus && !(isReturn && !order.returnInfo);
              if (regresses) {
                state = "current";
                note = `Already past “${targetStatus}” — imports never move an order backwards.`;
              } else if (alreadyThere) {
                state = "current";
                note = "Already up to date — nothing to change.";
              } else {
                state = "update";
                note = `Will become “${targetStatus}”${isReturn ? " with a return record" : ""}.`;
                checked = true;
              }
            }
          }
          return {
            key: `${i}-${awb}-${phone}`,
            awb, phone, rawStatus, reason, date, fee, mapped,
            order, matchBy: by, state, note, checked, targetStatus, isReturn,
          };
        });
        setFileName(file.name);
        setPreview({ rows: built, warnings: cols.status < 0 ? ["No status column found — rows will only update courier details."] : [] });
      } catch {
        setImportError("That file could not be read as CSV. Please check it opens as a spreadsheet and try again.");
      }
    };
    reader.readAsText(file);
  };

  const toggleRow = (key, checked) =>
    setPreview((prev) =>
      prev ? { ...prev, rows: prev.rows.map((r) => (r.key === key ? { ...r, checked } : r)) } : prev
    );

  const applyChecked = () => {
    if (!preview) return;
    const applied = preview.rows
      .filter((r) => r.checked && r.state === "update" && r.order)
      .map((r) => ({
        orderId: r.order.id,
        targetStatus: r.targetStatus,
        courier: r.order.courier || settings.defaultCourier || "",
        awb: r.awb || r.order.awb || "",
        reason: r.reason || "",
        fee: r.fee,
        date: r.date,
        isReturn: r.isReturn,
        rawStatus: r.rawStatus,
      }));
    const unmatched = preview.rows.filter((r) => r.state === "unmatched").length;
    applyImport({ fileName, applied, unmatched });
    setImportDone(`✓ Applied ${applied.length} update${applied.length === 1 ? "" : "s"} from ${fileName}. ${unmatched} unmatched row${unmatched === 1 ? "" : "s"} ${unmatched === 1 ? "was" : "were"} left untouched and listed below.`);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-sage-600">Seller dashboard</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-sage-900">Returns &amp; courier sheets</h1>
      <p className="mt-1 max-w-3xl leading-relaxed text-sage-700">
        This is how you know a parcel came back: record it here by hand, or import the courier&apos;s
        daily sheet. A return only exists in ParcelDesk once it is recorded one of those two ways —
        and a parcel is only counted as money lost once it is physically back with you.
      </p>
      <div className="mt-4"><DashTabs /></div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Returns in transit", value: inTransit.length, note: "Parcels on their way back — not counted as lost yet" },
          { label: "Returned to seller", value: completed.length, note: "Parcels physically back with you" },
          { label: "Total return fees", value: formatPKR(fees), note: completed.length ? `About ${formatPKR(Math.round(fees / completed.length))} per returned parcel` : "No completed returns yet" },
          { label: "Top return reason", value: top ? top.reason : "—", note: top ? `${top.count} parcel${top.count > 1 ? "s" : ""} came back for this reason` : "No returns recorded yet" },
        ].map((s) => (
          <div key={s.label} className="rounded-3xl border border-cream-200 bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-sage-500">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-sage-900">{s.value}</p>
            <p className="text-xs text-sage-500">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Record a return */}
      <div className="mt-6">
        <h2 className="font-display text-lg font-bold text-sage-900">Record a return by hand</h2>
        <p className="text-sm text-sage-600">Pick a shipped or delivered order. Thirty seconds, and the whole dashboard learns from it.</p>
        {recordable.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-cream-200 bg-white p-5 text-sm text-sage-700 shadow-card">
            No shipped or delivered orders to record a return for right now. Advance an order to
            Shipped in <Link to="/dashboard" className="font-semibold underline">Orders</Link> first.
          </p>
        ) : (
          <>
            <select
              value={recordForId}
              onChange={(e) => setRecordForId(e.target.value)}
              className="mt-3 w-full rounded-full border border-cream-300 bg-white px-4 py-2.5 text-sm sm:max-w-md"
              aria-label="Choose an order to record a return for"
            >
              <option value="">Choose an order…</option>
              {recordable.map((o) => (
                <option key={o.id} value={o.id}>{o.id} · {o.customer} · {o.city} · {formatPKR(o.total)} · {o.status}</option>
              ))}
            </select>
            {recordFor && (
              <div className="mt-4">
                <RecordReturnForm order={recordFor} compact onDone={() => setRecordForId("")} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Courier sheet import */}
      <div className="mt-8 rounded-3xl border border-cream-200 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-sage-900">Import the courier&apos;s daily sheet</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-sage-600">
          Couriers send a delivery / return sheet every day. Upload the CSV here — ParcelDesk matches
          each row to an order by tracking number first, then phone number, and shows you a preview.
          Nothing changes until you approve the rows. Unmatched rows are listed, never silently dropped.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="btn-lift cursor-pointer rounded-full bg-sage-700 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-sage-800">
            Choose a courier sheet (.csv)
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <button onClick={downloadSample} className="rounded-full border border-sage-300 bg-white px-5 py-2.5 text-sm font-semibold text-sage-800">
            Download a sample sheet
          </button>
        </div>
        {importError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800">{importError}</p>}
        {importDone && <p className="mt-3 rounded-2xl bg-sage-100 px-4 py-2.5 text-sm font-semibold text-sage-800">{importDone}</p>}

        {preview && (
          <div className="mt-5">
            <p className="text-sm font-semibold text-sage-900">
              Preview — {fileName} · {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"} ·{" "}
              {preview.rows.filter((r) => r.state === "update").length} will update,{" "}
              {preview.rows.filter((r) => r.state === "current").length} already current,{" "}
              {preview.rows.filter((r) => r.state === "unmatched").length} unmatched
            </p>
            {preview.warnings.map((w) => <p key={w} className="mt-1 text-sm text-amber-800">{w}</p>)}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-sage-500">
                    <th className="pb-2 pr-3">Apply?</th><th className="pb-2 pr-3">Tracking</th><th className="pb-2 pr-3">Phone</th><th className="pb-2 pr-3">Sheet says</th><th className="pb-2 pr-3">Matched order</th><th className="pb-2">What will happen</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.key} className="border-b border-cream-100">
                      <td className="py-2.5 pr-3">
                        {r.state === "update" ? (
                          <input type="checkbox" checked={r.checked} onChange={(e) => toggleRow(r.key, e.target.checked)} className="h-4 w-4 accent-[#43523B]" aria-label={`Apply row ${r.awb || r.phone}`} />
                        ) : (
                          <span className="text-xs text-sage-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{r.awb || "—"}</td>
                      <td className="py-2.5 pr-3">{r.phone || "—"}</td>
                      <td className="py-2.5 pr-3">{r.rawStatus || "—"}{r.fee != null && <span className="block text-xs text-sage-500">Fee {formatPKR(r.fee)}</span>}</td>
                      <td className="py-2.5 pr-3">
                        {r.order ? <span><strong>{r.order.id}</strong> · {r.order.customer} <span className="text-xs text-sage-500">(by {r.matchBy})</span></span> : <span className="text-sage-500">No match</span>}
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${r.state === "update" ? "bg-sage-100 text-sage-800" : r.state === "current" ? "bg-cream-200 text-sage-700" : "bg-red-100 text-red-800"}`}>
                          {r.state === "update" ? "Will update" : r.state === "current" ? "Already current" : "Unmatched"}
                        </span>
                        <span className="block text-xs text-sage-600">{r.note}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={applyChecked}
              disabled={!preview.rows.some((r) => r.checked && r.state === "update")}
              className="btn-lift mt-4 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply selected updates ({preview.rows.filter((r) => r.checked && r.state === "update").length})
            </button>
          </div>
        )}

        {/* Column guide */}
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-semibold text-sage-700 underline">Which columns does the sheet need? (column guide)</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-sage-500">
                  <th className="pb-2 pr-3">Column</th><th className="pb-2 pr-3">Also accepted</th><th className="pb-2">What it is for</th>
                </tr>
              </thead>
              <tbody>
                {COLUMN_GUIDE.map((c) => (
                  <tr key={c.column} className="border-b border-cream-100">
                    <td className="py-2 pr-3 font-mono text-xs font-semibold">{c.column}</td>
                    <td className="py-2 pr-3 text-sage-600">{c.also}</td>
                    <td className="py-2 text-sage-700">{c.what}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-sm text-sage-600">
            Extra columns are ignored. Rows are matched by tracking number first, then phone number.
            An import writes the same record as recording by hand — and stamps the order with the file name.
          </p>
        </details>

        {/* Import history */}
        <div className="mt-5 border-t border-cream-200 pt-4">
          <h3 className="font-display font-bold text-sage-900">Import history</h3>
          {imports.length === 0 ? (
            <p className="mt-1 text-sm text-sage-600">No sheets imported yet on this device.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-sage-700">
              {imports.map((imp, i) => (
                <li key={i}>
                  {new Date(imp.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {imp.fileName} · {imp.applied} update{imp.applied === 1 ? "" : "s"} applied, {imp.unmatched} unmatched
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* RTO log */}
      <div className="mt-8 rounded-3xl border border-red-100 bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold text-sage-900">RTO / returns log</h2>
        <p className="text-sm text-sage-600">
          Every parcel that came back or is coming back — with courier, tracking number, reason, fee
          and how long it spent away. “In transit” parcels are shown separately and are never counted
          as money lost before they are back.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="rounded-full border border-cream-300 bg-cream-50 px-3 py-2 text-sm" aria-label="Filter returns by reason">
            {reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select value={courierFilter} onChange={(e) => setCourierFilter(e.target.value)} className="rounded-full border border-cream-300 bg-cream-50 px-3 py-2 text-sm" aria-label="Filter returns by courier">
            {couriers.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {filteredLog.length === 0 ? (
          <p className="mt-4 text-sm text-sage-600">No returns match these filters. Record a return above, or import a courier sheet, and it will appear here.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-xs uppercase tracking-wide text-sage-500">
                  <th className="pb-2 pr-3">Order</th><th className="pb-2 pr-3">Customer / city</th><th className="pb-2 pr-3">Courier · tracking</th><th className="pb-2 pr-3">Reason</th><th className="pb-2 pr-3">Fee</th><th className="pb-2 pr-3">Away</th><th className="pb-2">Status / action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLog.map((o) => {
                  const info = effectiveReturnInfo(o);
                  const days = returnDaysAway(o);
                  return (
                    <tr key={o.id} className="border-b border-cream-100">
                      <td className="py-2.5 pr-3 font-semibold text-sage-900">
                        {o.id}
                        <span className="block text-xs font-normal text-sage-500">
                          {info?.returnedAt ? `Returned ${formatDay(info.returnedAt)}` : ""}{info?.receivedAt ? ` · back ${formatDay(info.receivedAt)}` : ""}
                          {info?.source === "import" ? ` · via sheet (${info.importFile})` : ""}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">{o.customer}<span className="block text-xs text-sage-500">{o.city} · {o.phone}</span></td>
                      <td className="py-2.5 pr-3">{info?.courier || "—"}<span className="block text-xs text-sage-500">{info?.awb || "—"}</span></td>
                      <td className="py-2.5 pr-3">{info?.reason || "—"}{info?.note && <span className="block text-xs text-sage-500">{info.note}</span>}</td>
                      <td className="py-2.5 pr-3 font-semibold text-red-700">{formatPKR(info?.fee || 0)}</td>
                      <td className="py-2.5 pr-3">{days == null ? "—" : `${days} day${days === 1 ? "" : "s"}`}</td>
                      <td className="py-2.5">
                        <StatusBadge status={o.status} />
                        {o.status === "Return in transit" && (
                          <button onClick={() => markReturnReceived(o.id)} className="mt-1.5 block rounded-full bg-sage-700 px-3 py-1.5 text-xs font-semibold text-cream-50 hover:bg-sage-800">
                            Mark parcel received
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
