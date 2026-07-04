"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ChevronDown } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import {
  Card, TableWrap, Th, Td, LoadingRows, EmptyRow, Pagination, Avatar, StatusPill,
  fmtINR, fmtDate, titleCase,
} from "@/components/cms/ui";
import { listPayments, type AdminPayment, type Page } from "@/services/cmsData";

const LIMIT = 12;
const STATUS_OPTS = [
  { value: "all", label: "All payments" },
  { value: "PAID", label: "Paid" },
  { value: "NOT_PAID", label: "Not paid" },
  { value: "PENDING", label: "Pending" },
];

export default function CmsPaymentsPage() {
  const [data, setData] = useState<Page<AdminPayment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await listPayments({ page, limit: LIMIT, status })); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load payments."); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <CmsShell title="Payments">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{data ? `${data.total} payments` : "—"}</p>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-8 text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">
            {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-coral/30 bg-coral/8 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-coral"><AlertCircle className="h-4 w-4" /> {error}</span>
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-coral/30 bg-white px-3 py-1.5 text-xs font-bold text-coral hover:bg-coral/5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      <Card>
        <TableWrap>
          <thead><tr>
            <Th>Customer</Th><Th>Policy No.</Th><Th>Mode</Th><Th>Status</Th><Th className="text-right">Amount</Th><Th>Date</Th>
          </tr></thead>
          <tbody>
            {loading && !data ? <LoadingRows cols={6} />
              : !data || data.rows.length === 0 ? <EmptyRow cols={6} label="No payments found." />
              : data.rows.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.customer?.name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{p.customer?.name ?? "—"}</p>
                        <p className="truncate text-[0.7rem] text-ink-soft">{p.customer?.email ?? "—"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                  <Td className="text-ink-soft">{titleCase(p.paymentMode)}</Td>
                  <Td><StatusPill status={p.status} /></Td>
                  <Td className="text-right font-semibold">{fmtINR(p.premium)}</Td>
                  <Td className="text-ink-soft">{fmtDate(p.createdAt)}</Td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
        {data && data.pageCount > 1 && (
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} busy={loading} />
        )}
      </Card>
    </CmsShell>
  );
}
