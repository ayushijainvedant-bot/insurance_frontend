"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import CmsShell from "@/components/cms/CmsShell";
import { Card, TableWrap, Th, Td, LoadingRows, EmptyRow, ActivePill, Avatar } from "@/components/cms/ui";
import { Modal, Field, TextInput, Textarea, Toggle, FormActions, NewButton, RowActions } from "@/components/cms/form";
import {
  listProvidersCms, createProviderCms, updateProviderCms, deleteProviderCms, setProviderStatusCms,
  type CmsProvider,
} from "@/services/cmsCatalog";

type FormState = { code: string; name: string; isActive: boolean; config: string };
const emptyForm: FormState = { code: "", name: "", isActive: true, config: "" };

export default function CmsProvidersPage() {
  const [rows, setRows] = useState<CmsProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CmsProvider | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRows(await listProvidersCms()); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't load providers."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErr(null); setOpen(true); };
  const openEdit = (p: CmsProvider) => {
    setEditing(p);
    setForm({ code: p.code, name: p.name, isActive: p.isActive, config: p.config ? JSON.stringify(p.config, null, 2) : "" });
    setFormErr(null); setOpen(true);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr(null);
    let config: Record<string, unknown> | null = null;
    if (form.config.trim()) {
      try { config = JSON.parse(form.config); } catch { setFormErr("Config must be valid JSON."); return; }
    }
    setSaving(true);
    try {
      const body = { code: form.code.trim().toUpperCase(), name: form.name.trim(), isActive: form.isActive, config };
      if (editing) await updateProviderCms(editing.id, body);
      else await createProviderCms(body);
      setOpen(false); await load();
    } catch (e) { setFormErr(e instanceof Error ? e.message : "Couldn't save."); }
    finally { setSaving(false); }
  }

  async function toggle(p: CmsProvider) {
    setRowBusy(p.id);
    try { await setProviderStatusCms(p.id, !p.isActive); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't change status."); }
    finally { setRowBusy(null); }
  }

  async function remove(p: CmsProvider) {
    if (!window.confirm(`Delete "${p.name}"? This can't be undone.`)) return;
    setRowBusy(p.id);
    try { await deleteProviderCms(p.id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't delete."); }
    finally { setRowBusy(null); }
  }

  return (
    <CmsShell title="Providers">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">{rows.length} providers</p>
        <NewButton onClick={openCreate} label="New provider" />
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
          <thead><tr><Th>Insurer</Th><Th>Code</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>
            {loading ? <LoadingRows cols={4} />
              : rows.length === 0 ? <EmptyRow cols={4} label="No providers yet." />
              : rows.map((p) => (
                <tr key={p.id} className="border-t border-line hover:bg-paper/60">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.name} />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-xs text-ink-soft">{p.code}</Td>
                  <Td><button onClick={() => toggle(p)} disabled={rowBusy === p.id}><ActivePill active={p.isActive} /></button></Td>
                  <Td><RowActions onEdit={() => openEdit(p)} onDelete={() => remove(p)} busy={rowBusy === p.id} /></Td>
                </tr>
              ))}
          </tbody>
        </TableWrap>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit provider" : "New provider"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Insurer name"><TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Go Digit" required /></Field>
          <Field label="Code" hint="unique, matches the integration registry (e.g. DIGIT)"><TextInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="DIGIT" required /></Field>
          <Field label="Config (JSON)" hint="optional — base URL, integration ids…"><Textarea value={form.config} onChange={(e) => setForm((f) => ({ ...f, config: e.target.value }))} placeholder='{ }' /></Field>
          <Field label="Active"><Toggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label={form.isActive ? "Enabled" : "Disabled"} /></Field>
          {formErr && <p className="text-xs text-coral">{formErr}</p>}
          <FormActions busy={saving} onCancel={() => setOpen(false)} submitLabel={editing ? "Save changes" : "Create provider"} />
        </form>
      </Modal>
    </CmsShell>
  );
}
