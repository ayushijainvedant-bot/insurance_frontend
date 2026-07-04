"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import { Card, TableWrap, Th, Td, LoadingRows, EmptyRow, ActivePill, titleCase } from "@/components/cms/ui";
import { Modal, Field, TextInput, Textarea, Toggle, FormActions, NewButton, RowActions } from "@/components/cms/form";
import {
  listProductsCms, createProductCms, updateProductCms, deleteProductCms, setProductStatusCms,
  type CmsProduct,
} from "@/services/cmsCatalog";

type FormState = { category: string; name: string; description: string; isActive: boolean; config: string };
const emptyForm: FormState = { category: "", name: "", description: "", isActive: true, config: "" };

export default function CmsProductsPage() {
  const [rows, setRows] = useState<CmsProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CmsProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRows(await listProductsCms()); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load products."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErr(null); setOpen(true); };
  const openEdit = (p: CmsProduct) => {
    setEditing(p);
    setForm({
      category: p.category, name: p.name, description: p.description ?? "",
      isActive: p.isActive, config: p.config ? JSON.stringify(p.config, null, 2) : "",
    });
    setFormErr(null); setOpen(true);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    let config: Record<string, unknown> | null = null;
    if (form.config.trim()) {
      try { config = JSON.parse(form.config); }
      catch { setFormErr("Config must be valid JSON."); return; }
    }
    setSaving(true);
    try {
      const body = { category: form.category.trim(), name: form.name.trim(), description: form.description.trim() || null, isActive: form.isActive, config };
      if (editing) await updateProductCms(editing.id, body);
      else await createProductCms(body);
      setOpen(false);
      await load();
    } catch (e) { setFormErr(e instanceof Error ? e.message : "Couldn't save."); }
    finally { setSaving(false); }
  }

  async function toggle(p: CmsProduct) {
    setRowBusy(p.id);
    try { await setProductStatusCms(p.id, !p.isActive); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't change status."); }
    finally { setRowBusy(null); }
  }

  async function remove(p: CmsProduct) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setRowBusy(p.id);
    try { await deleteProductCms(p.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete."); }
    finally { setRowBusy(null); }
  }

  return (
    <CmsShell title="Products">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{rows.length} products</p>
        <NewButton onClick={openCreate} label="New product" />
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
            <Th>Name</Th><Th>Category</Th><Th>Description</Th><Th>Status</Th><Th className="text-right">Actions</Th>
          </tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={5} />
              : rows.length === 0 ? <EmptyRow cols={5} label="No products yet." />
              : rows.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                  <Td className="font-semibold">{p.name}</Td>
                  <Td className="text-ink-soft">{titleCase(p.category)}</Td>
                  <Td className="max-w-xs truncate text-ink-soft" title={p.description ?? ""}>{p.description ?? "—"}</Td>
                  <Td><button onClick={() => toggle(p)} disabled={rowBusy === p.id}><ActivePill active={p.isActive} /></button></Td>
                  <Td><RowActions onEdit={() => openEdit(p)} onDelete={() => remove(p)} busy={rowBusy === p.id} /></Td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit product" : "New product"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name"><TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Four Wheeler Insurance" required /></Field>
          <Field label="Category" hint="unique slug, e.g. four_wheeler"><TextInput value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="four_wheeler" required /></Field>
          <Field label="Description"><TextInput value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short tagline" /></Field>
          <Field label="Config (JSON)" hint="optional — badge, features…"><Textarea value={form.config} onChange={(e) => setForm((f) => ({ ...f, config: e.target.value }))} placeholder='{ "badge": "Lowest Price", "features": ["…"] }' /></Field>
          <Field label="Active"><Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label={form.isActive ? "Visible to customers" : "Hidden"} /></Field>
          {formErr && <p className="text-xs text-coral">{formErr}</p>}
          <FormActions busy={saving} onCancel={() => setOpen(false)} submitLabel={editing ? "Save changes" : "Create product"} />
        </form>
      </Modal>
    </CmsShell>
  );
}
