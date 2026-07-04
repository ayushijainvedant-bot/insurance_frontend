"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import { Card, TableWrap, Th, Td, LoadingRows, EmptyRow, ActivePill, titleCase } from "@/components/cms/ui";
import { Modal, Field, TextInput, Select, Toggle, FormActions, NewButton, RowActions } from "@/components/cms/form";
import {
  listOfferingsCms, createOfferingCms, updateOfferingCms, deleteOfferingCms, setOfferingStatusCms,
  listProductsCms, listProvidersCms,
  type CmsOffering, type CmsProduct, type CmsProvider,
} from "@/services/cmsCatalog";

type FormState = { productId: string; providerId: string; productCode: string; subProductCode: string; isActive: boolean };
const emptyForm: FormState = { productId: "", providerId: "", productCode: "", subProductCode: "", isActive: true };

export default function CmsOfferingsPage() {
  const [rows, setRows] = useState<CmsOffering[]>([]);
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [providers, setProviders] = useState<CmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CmsOffering | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [o, p, pr] = await Promise.all([listOfferingsCms(), listProductsCms(), listProvidersCms()]);
      setRows(o); setProducts(p); setProviders(pr);
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't load offerings."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErr(null); setOpen(true); };
  const openEdit = (o: CmsOffering) => {
    setEditing(o);
    setForm({
      productId: String(o.productId), providerId: String(o.providerId),
      productCode: o.productCode, subProductCode: o.subProductCode ?? "", isActive: o.isActive,
    });
    setFormErr(null); setOpen(true);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    if (!form.productId || !form.providerId) { setFormErr("Pick a product and a provider."); return; }
    setSaving(true);
    try {
      const body = {
        productId: form.productId, providerId: form.providerId,
        productCode: form.productCode.trim(), subProductCode: form.subProductCode.trim() || null,
        isActive: form.isActive,
      };
      if (editing) await updateOfferingCms(editing.id, body);
      else await createOfferingCms(body);
      setOpen(false); await load();
    } catch (e) { setFormErr(e instanceof Error ? e.message : "Couldn't save."); }
    finally { setSaving(false); }
  }

  async function toggle(o: CmsOffering) {
    setRowBusy(o.id);
    try { await setOfferingStatusCms(o.id, !o.isActive); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't change status."); }
    finally { setRowBusy(null); }
  }

  async function remove(o: CmsOffering) {
    if (!window.confirm("Delete this offering? This can't be undone.")) return;
    setRowBusy(o.id);
    try { await deleteOfferingCms(o.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete."); }
    finally { setRowBusy(null); }
  }

  return (
    <CmsShell title="Offerings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{rows.length} offerings <span className="text-ink-soft/70">· one insurer × product</span></p>
        <NewButton onClick={openCreate} label="New offering" />
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
            <Th>Product</Th><Th>Insurer</Th><Th>Product Code</Th><Th>Sub Code</Th><Th>Status</Th><Th className="text-right">Actions</Th>
          </tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={6} />
              : rows.length === 0 ? <EmptyRow cols={6} label="No offerings yet." />
              : rows.map((o) => (
                <tr key={o.id} className="border-t border-line hover:bg-paper/60">
                  <Td className="font-semibold">{o.product?.name ?? titleCase(o.product?.category) ?? "—"}</Td>
                  <Td className="text-ink-soft">{o.provider?.name ?? o.provider?.code ?? "—"}</Td>
                  <Td className="font-mono text-xs">{o.productCode}</Td>
                  <Td className="font-mono text-xs text-ink-soft">{o.subProductCode ?? "—"}</Td>
                  <Td><button onClick={() => toggle(o)} disabled={rowBusy === o.id}><ActivePill active={o.isActive} /></button></Td>
                  <Td><RowActions onEdit={() => openEdit(o)} onDelete={() => remove(o)} busy={rowBusy === o.id} /></Td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit offering" : "New offering"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Product">
            <Select value={form.productId} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} required>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({titleCase(p.category)})</option>)}
            </Select>
          </Field>
          <Field label="Insurer">
            <Select value={form.providerId} onChange={(e) => setForm((f) => ({ ...f, providerId: e.target.value }))} required>
              <option value="">Select an insurer…</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </Select>
          </Field>
          <Field label="Product code" hint="insurer's code, e.g. 20102"><TextInput value={form.productCode} onChange={(e) => setForm((f) => ({ ...f, productCode: e.target.value }))} placeholder="20102" required /></Field>
          <Field label="Sub-product code" hint="optional, e.g. PB"><TextInput value={form.subProductCode} onChange={(e) => setForm((f) => ({ ...f, subProductCode: e.target.value }))} placeholder="PB" /></Field>
          <Field label="Active"><Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label={form.isActive ? "Quotable" : "Hidden"} /></Field>
          {formErr && <p className="text-xs text-coral">{formErr}</p>}
          <FormActions busy={saving} onCancel={() => setOpen(false)} submitLabel={editing ? "Save changes" : "Create offering"} />
        </form>
      </Modal>
    </CmsShell>
  );
}
