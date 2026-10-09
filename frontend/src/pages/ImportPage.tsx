import { useState } from "react";
import { api, errMsg, num, useApi } from "../lib/api";
import { Badge, Card, Empty, ErrorBox, Loading, Page } from "../lib/ui";

const LABELS: Record<string, string> = { exact_duplicates_removed: "Exact duplicate rows removed", invalid_quantity_removed: "Invalid quantity rows removed",
  invalid_price_removed: "Zero/negative price rows removed", non_product_rows_removed: "Non-product rows removed (postage, fees…)",
  missing_description_filled: "Missing descriptions filled", missing_customer_id_rows_kept_as_guest: "Rows without CustomerID (kept as guest sales)",
  cancellation_rows_kept_flagged: "Cancellation rows (kept, flagged)", unparseable_rows_removed: "Unparseable rows removed" };

export default function ImportPage() {
  const { data, loading, error, reload } = useApi<any>("/api/import/latest");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<string | null>(null);
  const upload = async (f: File) => {
    setBusy(true); setMsg(null);
    try {
      const fd = new FormData(); fd.append("file", f);
      const { data: run } = await api.post("/api/import", fd);
      const t = window.setInterval(async () => {
        const r = (await api.get(`/api/runs/${run.id}`)).data;
        if (r.status === "completed" || r.status === "failed") { window.clearInterval(t); setBusy(false); if (r.status === "failed") setMsg(r.error); reload(); }
      }, 2000);
    } catch (e) { setBusy(false); setMsg(errMsg(e)); }
  };
  const r = data?.run?.result;
  return (
    <Page title="Data import & quality" sub="Upload the UCI Online Retail file (.xlsx or .csv). Importing replaces all existing data and any derived analysis results. The original GBP currency is preserved.">
      <Card title="Upload dataset">
        <input type="file" accept=".csv,.xlsx,.xls" disabled={busy} aria-label="Dataset file" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        {busy && <p className="text-sm mt-2 animate-pulse" role="status">Cleaning and loading… the full 541k-row file can take a few minutes.</p>}
        {msg && <div className="mt-3"><ErrorBox msg={msg} /></div>}
      </Card>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} retry={reload} /> : !data?.run ? <Empty>Nothing imported yet.</Empty> :
        data.run.status === "failed" ? <ErrorBox msg={`Last import failed: ${data.run.error}`} /> : !r ? null :
        <Card title="Data-quality report" right={<Badge s={data.run.status} />}>
          <p className="text-sm text-slate-500 mb-3">Source file: <b>{r.source_file}</b> · Currency: {r.currency} · {r.date_min.slice(0, 10)} to {r.date_max.slice(0, 10)}</p>
          <div className="grid sm:grid-cols-4 gap-3 mb-4 text-sm">{[["Raw rows", r.rows_raw], ["Clean rows", r.rows_clean], ["Invoices", r.unique_invoices], ["Products", r.unique_products]].map(([l, v]) =>
            <div key={l as string} className="border rounded p-3"><div className="text-slate-500">{l}</div><div className="text-xl font-semibold">{num(v as number)}</div></div>)}</div>
          <table className="w-full text-sm"><tbody>{Object.keys(LABELS).map(k => <tr key={k} className="border-b"><td className="py-2">{LABELS[k]}</td><td className="py-2 text-right font-medium">{num(r[k])}</td></tr>)}
            <tr><td className="py-2">Rows retained</td><td className="py-2 text-right font-medium">{r.retention_pct}%</td></tr></tbody></table>
          <h3 className="font-medium mt-4 mb-1 text-sm">Missing values in the raw file</h3>
          <div className="flex flex-wrap gap-2 text-xs">{Object.entries(r.missing_before).map(([c, n]) => <span key={c} className="border rounded px-2 py-1">{c}: {num(n as number)}</span>)}</div>
        </Card>}
    </Page>
  );
}
