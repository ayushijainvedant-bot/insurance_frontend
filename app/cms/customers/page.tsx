"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import {
  Card, TableWrap, Th, Td, LoadingRows, EmptyRow, Pagination, SearchBox, Avatar, ActivePill,
  fmtDate,
} from "@/components/cms/ui";
import { listCustomers, type AdminCustomer, type Page } from "@/services/cmsData";

const LIMIT = 12;

export default function CmsCustomersPage() {
  const [data, setData] = useState<Page<AdminCustomer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await listCustomers({ page, limit: LIMIT, search })); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load customers."); }
    finally { setLoading(false); }
  }, [page, search]);

  // Debounce search; reset to page 1 on new query.
  useEffect(() => {
    const id = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(id);
  }, [load]);

  const onSearch = (v: string) => { setSearch(v); setPage(1); };

  return (
    <CmsShell title="Customers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{data ? `${data.total} customers` : "—"}</p>
        <SearchBox value={search} onChange={onSearch} placeholder="Search name, email or phone…" />
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
            <Th>Customer</Th><Th>Phone</Th><Th>DOB</Th><Th className="text-center">Policies</Th><Th>Status</Th><Th>Joined</Th>
          </tr></thead>
          <tbody>
            {loading && !data ? <LoadingRows cols={6} />
              : !data || data.rows.length === 0 ? <EmptyRow cols={6} label="No customers found." />
              : data.rows.map((c) => (
                <tr key={c.id} className="border-t border-line hover:bg-paper/60">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink">{c.name ?? "—"}</p>
                        <p className="truncate text-[0.7rem] text-ink-soft">{c.email ?? "—"}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-ink-soft">{c.phone ?? "—"}</Td>
                  <Td className="text-ink-soft">{fmtDate(c.dob)}</Td>
                  <Td className="text-center font-bold">{c.policyCount}</Td>
                  <Td><ActivePill active={c.isActive} /></Td>
                  <Td className="text-ink-soft">{fmtDate(c.createdAt)}</Td>
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
