import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { gbp, useApi } from "../lib/api";
import { Card, Empty, ErrorBox, Kpi, Loading, Page, RunPanel } from "../lib/ui";

export default function Forecast() {
  const { data, loading, error, reload } = useApi<any>("/api/forecast/latest");
  const r = data?.run?.result;
  const series = (data?.series ?? []).slice(-120).map((p: any) => ({ ...p, actual: p.actual }));
  return (
    <Page title="Sales forecasting" sub="Daily revenue (GBP). The model is trained only on days before the test window and compared with a seasonal-naive baseline (repeat the last observed week). All features are lagged by at least 28 days, so nothing from the test period leaks in.">
      <Card><RunPanel runType="forecast" label="Run forecast" params={{ horizon: 28, test_days: 28 }} onDone={reload} /></Card>
      {loading ? <Loading /> : error ? <ErrorBox msg={error} retry={reload} /> : !r ? <Empty>No forecast yet. Import data and run the forecast.</Empty> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Model MAE" value={gbp(r.model.mae)} /><Kpi label="Model RMSE" value={gbp(r.model.rmse)} />
          <Kpi label="Baseline MAE" value={gbp(r.baseline.mae)} /><Kpi label="Baseline RMSE" value={gbp(r.baseline.rmse)} hint={r.beats_baseline ? `Model is ${r.rmse_improvement_pct}% better (RMSE)` : "Model does not beat the baseline"} /></div>
        <Card title={`Last 120 days · test window starts ${r.test_start}`}><div className="h-80"><ResponsiveContainer><LineChart data={series}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" /><XAxis dataKey="date" fontSize={11} minTickGap={30} /><YAxis fontSize={12} tickFormatter={v => "£" + v / 1000 + "k"} />
          <Tooltip formatter={(v: number) => gbp(v)} /><Legend />
          <Line dataKey="actual" name="Actual" stroke="#1D2B3A" dot={false} connectNulls={false} /><Line dataKey="predicted" name="Model" stroke="#0E8F7E" strokeWidth={2} dot={false} />
          <Line dataKey="baseline" name="Baseline" stroke="#E7A33E" strokeDasharray="5 4" dot={false} /></LineChart></ResponsiveContainer></div></Card></>}
    </Page>
  );
}
