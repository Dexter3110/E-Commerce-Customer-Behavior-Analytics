import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { gbp, num, pct, useApi } from "../lib/api";
import { Card, Empty, ErrorBox, Kpi, Loading, Page } from "../lib/ui";

export default function Dashboard() {
  const [gran, setGran] = useState("month");
  const s = useApi<any>("/api/dashboard/summary");
  const t = useApi<any[]>("/api/dashboard/trends", { granularity: gran });
  const p = useApi<any[]>("/api/dashboard/top-products", { limit: 10 });
  const c = useApi<any[]>("/api/dashboard/countries", { limit: 10 });
  if (s.loading) return <Loading />;
  if (s.error) return <ErrorBox msg={s.error} retry={s.reload} />;
  if (!s.data?.has_data) return <Page title="Dashboard"><Empty>No data yet. Go to <b>Data Import &amp; Quality</b> and upload the UCI Online Retail file.</Empty></Page>;
  const d = s.data;
  return (
    <Page title="Sales overview" sub={`All amounts in GBP. ${String(d.date_min).slice(0, 10)} to ${String(d.date_max).slice(0, 10)}. Revenue excludes cancelled invoices.`}>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="Revenue" value={gbp(d.revenue)} hint={`${gbp(d.cancelled_value)} cancelled`} />
        <Kpi label="Orders" value={num(d.orders)} />
        <Kpi label="Avg order value" value={"£" + num(d.avg_order_value, 2)} />
        <Kpi label="Customers" value={num(d.customers)} hint="identified only" />
        <Kpi label="Repeat purchase rate" value={pct(d.repeat_purchase_rate)} hint="buyers with 2+ orders" />
      </div>
      <Card title="Revenue trend" right={<select aria-label="Granularity" className="border rounded px-2 py-1 text-sm" value={gran} onChange={e => setGran(e.target.value)}>
        <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option></select>}>
        {t.loading ? <Loading /> : t.error ? <ErrorBox msg={t.error} retry={t.reload} /> :
          <div className="h-72"><ResponsiveContainer><LineChart data={t.data ?? []}><CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} /><YAxis fontSize={12} tickFormatter={v => "£" + v / 1000 + "k"} />
            <Tooltip formatter={(v: number) => gbp(v)} /><Line type="monotone" dataKey="revenue" stroke="#0E8F7E" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>}
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Top products by revenue">{p.loading ? <Loading /> : p.error ? <ErrorBox msg={p.error} /> :
          <div className="h-80"><ResponsiveContainer><BarChart data={p.data ?? []} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" fontSize={12} tickFormatter={v => "£" + v / 1000 + "k"} /><YAxis type="category" dataKey="description" width={170} fontSize={11} />
            <Tooltip formatter={(v: number) => gbp(v)} /><Bar dataKey="revenue" fill="#7B4B94" /></BarChart></ResponsiveContainer></div>}</Card>
        <Card title="Revenue by country (top 10)">{c.loading ? <Loading /> : c.error ? <ErrorBox msg={c.error} /> :
          <div className="h-80"><ResponsiveContainer><BarChart data={c.data ?? []} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" fontSize={12} tickFormatter={v => "£" + v / 1000 + "k"} /><YAxis type="category" dataKey="country" width={120} fontSize={11} />
            <Tooltip formatter={(v: number) => gbp(v)} /><Bar dataKey="revenue" fill="#E7A33E" /></BarChart></ResponsiveContainer></div>}</Card>
      </div>
    </Page>
  );
}
