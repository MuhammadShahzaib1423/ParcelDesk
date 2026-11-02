// Courier sheet CSV handling — everything parses in the browser. Nothing is
// uploaded to any server. The export format and the import format are
// compatible: a sheet exported from ParcelDesk can be edited and imported
// back, and a courier's own sheet is accepted when its columns match the
// common spellings below.

// Minimal RFC 4180 parser: quoted fields, embedded commas, doubled quotes,
// and newlines inside quoted fields.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const src = String(text || "").replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ""));
}

export function toCSV(rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

// Trigger a browser download of CSV text (no server involved).
export function downloadCSVFile(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function normHeader(h) {
  return String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Detect columns from a header row. Accepts common courier-sheet spellings:
// AWB / tracking / cn, phone / mobile, status / remarks, reason, date, fee /
// charges. Returns { awb, phone, status, reason, date, fee } column indexes
// (-1 when a column is absent).
export function detectColumns(headers) {
  const cols = { awb: -1, phone: -1, status: -1, reason: -1, date: -1, fee: -1 };
  headers.forEach((h, idx) => {
    const n = normHeader(h);
    if (n === "") return;
    if (cols.awb < 0 && (n.includes("tracking") || n.includes("awb") || n === "cn" || n.includes("consignment") || n.includes("trackingnumber"))) cols.awb = idx;
    else if (cols.phone < 0 && (n.includes("phone") || n.includes("mobile") || n.includes("contact"))) cols.phone = idx;
    else if (cols.status < 0 && (n.includes("status") || n.includes("remark"))) cols.status = idx;
    else if (cols.reason < 0 && n.includes("reason")) cols.reason = idx;
    else if (cols.date < 0 && (n.includes("date") || n.includes("updated"))) cols.date = idx;
    else if (cols.fee < 0 && (n.includes("fee") || n.includes("charge") || n.includes("amount"))) cols.fee = idx;
  });
  return cols;
}

// Map a courier sheet's status wording to a ParcelDesk outcome.
// Returns { kind: "delivered" | "shipped" | "return-transit" | "return-received" | "unknown", label }.
export function mapImportStatus(raw) {
  const s = String(raw || "").toLowerCase();
  if (/(return.*(receiv|back|seller|warehouse|origin))|(received back)|(rto.*(done|complete|receiv))/.test(s))
    return { kind: "return-received", label: "Returned to seller" };
  if (/(return|rto|refused|undelivered|unreachable|rejected|door.*(closed|locked)|not.*(answer|respond|availab))/.test(s))
    return { kind: "return-transit", label: "Return in transit" };
  if (/(deliver)/.test(s)) return { kind: "delivered", label: "Delivered" };
  if (/(ship|dispatch|transit|out for delivery|on the way|in transit)/.test(s))
    return { kind: "shipped", label: "Shipped" };
  return { kind: "unknown", label: String(raw || "").trim() || "No status" };
}

// Canonical statuses an import row may set (an import never moves an order
// backwards past confirmation: only Shipped / Delivered / return outcomes).
export const IMPORT_TARGET_STATUSES = {
  delivered: "Delivered",
  shipped: "Shipped",
  "return-transit": "Return in transit",
  "return-received": "Returned to seller",
};

export function parseFee(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const n = Number(String(raw).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// A sample sheet the seller can download, filled with the shop's own demo
// orders so the import preview shows real matches on first try.
export function sampleSheetCSV(orders) {
  const rows = [
    ["tracking_number", "phone", "status", "reason", "date", "fee"],
  ];
  (orders || [])
    .filter((o) => o.awb)
    .slice(0, 5)
    .forEach((o) => {
      rows.push([o.awb, o.phone, o.status === "Delivered" ? "Delivered" : "Shipped", "", "", ""]);
    });
  rows.push(["AWB-DEMO-1", "0300-0000000", "Returned — refused at door", "Refused at door", "", "250"]);
  return toCSV(rows);
}

export const COLUMN_GUIDE = [
  { column: "tracking_number", also: "AWB, tracking, CN, consignment no.", what: "The courier tracking / AWB number. Used to match rows to orders first." },
  { column: "phone", also: "mobile, contact no.", what: "Customer mobile number. Used to match when no tracking number matches." },
  { column: "status", also: "remarks", what: "Delivered, Shipped, Returned / RTO / refused, or similar courier wording." },
  { column: "reason", also: "return reason", what: "Why the parcel came back (optional). Used for return records." },
  { column: "date", also: "delivery date, updated", what: "The date on the courier sheet (optional)." },
  { column: "fee", also: "charges, amount", what: "Return fee charged for the parcel in PKR (optional). Defaults to the shop's return fee." },
];
