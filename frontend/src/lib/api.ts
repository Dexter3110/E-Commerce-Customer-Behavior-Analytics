import axios from "axios";
import { useCallback, useEffect, useState } from "react";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000" });

export function errMsg(e: any): string {
  if (e?.response?.data?.detail) {
    const d = e.response.data.detail;
    return typeof d === "string" ? d : d.map((x: any) => `${(x.loc ?? []).join(".")}: ${x.msg}`).join("; ");
  }
  return e?.code === "ERR_NETWORK" ? "Cannot reach the API. Is the backend running on port 8000?" : e?.message ?? "Request failed";
}

export function useApi<T>(url: string, params?: Record<string, any>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(params ?? {});
  const load = useCallback(() => {
    setLoading(true);
    api.get<T>(url, { params }).then(r => { setData(r.data); setError(null); }).catch(e => setError(errMsg(e))).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);
  useEffect(load, [load]);
  return { data, loading, error, reload: load };
}

export const gbp = (n: number | null | undefined) => n == null ? "–" : "£" + Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 });
export const num = (n: number | null | undefined, d = 0) => n == null ? "–" : Number(n).toLocaleString("en-GB", { maximumFractionDigits: d });
export const pct = (n: number | null | undefined) => n == null ? "–" : (n * 100).toFixed(1) + "%";
