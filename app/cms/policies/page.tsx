"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, ChevronDown, Eye } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import PolicyDetailModal from "@/components/cms/PolicyDetailModal";
import {
  Card, TableWrap, Th, Td, LoadingRows, EmptyRow, Pagination, SearchBox, Avatar, StatusPill,
  fmtINR, fmtDate, titleCase,
} from "@/components/cms/ui";
import { listPolicies, type AdminPolicy, type Page } from "@/services/cmsData";

const LIMIT = 12;
const STATUS_OPTS = [
  { value: "all", label: "All statuses" },
  { value: "COMPLETE", label: "Complete" },
  { value: "INCOMPLETE", label: "Incomplete" },
  { value: "EFFECTIVE", label: "Effective" },
];

export default function CmsPoliciesPage() {
  const [data, setData] = useState<Page<AdminPolicy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await listPolicies({ page, limit: LIMIT, search, status })); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load policies."); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load]);

  return (
    <CmsShell title="Policies">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{data ? `${data.total} policies` : "—"}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-8 text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-4 focus:ring-brand/10">
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          </div>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search policy number…" />
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
            <Th>Customer</Th><Th>Insurer</Th><Th>Plan</Th><Th>Policy No.</Th><Th>Status</Th><Th className="text-right">Premium</Th><Th>Purchased</Th><Th className="text-right">View</Th>
          </tr></thead>
          <tbody>
            {loading && !data ? <LoadingRows cols={8} />
              : !data || data.rows.length === 0 ? <EmptyRow cols={8} label="No policies found." />
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
                  <Td className="text-ink-soft">{p.provider?.name ?? "—"}</Td>
                  <Td className="text-ink-soft">{p.productName ?? titleCase(p.category)}</Td>
                  <Td className="font-mono text-xs">{p.policyNumber ?? "—"}</Td>
                  <Td><StatusPill status={p.status} /></Td>
                  <Td className="text-right font-semibold">{fmtINR(p.premiumPaid)}</Td>
                  <Td className="text-ink-soft">{fmtDate(p.createdAt)}</Td>
                  <Td className="text-right">
                    <button onClick={() => setOpenId(p.id)} title="View policy details"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-soft transition hover:border-brand/40 hover:text-brand">
                      <Eye className="h-4 w-4" />
                    </button>
                  </Td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
        {data && data.pageCount > 1 && (
          <Pagination page={data.page} pageCount={data.pageCount} total={data.total} onPage={setPage} busy={loading} />
        )}
      </Card>

      {openId && <PolicyDetailModal policyId={openId} onClose={() => setOpenId(null)} />}
    </CmsShell>
  );
}
