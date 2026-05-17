"use client";

import { useState } from "react";

interface MemoryRow {
  id: string;
  title: string;
  category: string;
  sensitivity: string;
  importance: number;
  cloudAllowed: boolean;
  neverSendToCloud: boolean;
  encrypted: boolean;
  updatedAt: string;
}

export default function MemoryTable({ initialRows }: { initialRows: MemoryRow[] }) {
  const [rows, setRows]         = useState<MemoryRow[]>(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving]     = useState<string | null>(null);

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setRows((prev) => prev.map((r) => r.id === id ? { ...r, title: editTitle.trim() } : r));
        setEditingId(null);
      }
    } catch { /* silent */ } finally {
      setSaving(null);
    }
  }

  async function deleteRow(id: string) {
    if (!confirm("Delete this memory entry?")) return;
    setSaving(id);
    try {
      const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
      if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    } catch { /* silent */ } finally {
      setSaving(null);
    }
  }

  return (
    <div className="v-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Sensitivity</th>
            <th className="px-4 py-3">Cloud</th>
            <th className="px-4 py-3">Importance</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-bone-400" colSpan={7}>
                No memory records yet.
              </td>
            </tr>
          )}
          {rows.map((m) => (
            <tr key={m.id} className="border-t border-ink-700 group">
              <td className="px-4 py-3 text-bone-50">
                {editingId === m.id ? (
                  <input
                    autoFocus
                    title="Edit memory title"
                    placeholder="Memory title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(m.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded border border-ink-500 bg-ink-800 px-2 py-0.5 text-sm text-bone-100 outline-none focus:border-ink-400"
                  />
                ) : (
                  <span>
                    {m.title}
                    {m.encrypted && (
                      <span className="ml-2 text-[10px] text-signal-amber">encrypted</span>
                    )}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-bone-200">{m.category}</td>
              <td className="px-4 py-3 text-bone-200">{m.sensitivity}</td>
              <td className="px-4 py-3 text-bone-200">
                {m.neverSendToCloud ? (
                  <span className="text-signal-red">never</span>
                ) : m.cloudAllowed ? (
                  <span className="text-signal-green">allowed</span>
                ) : (
                  <span className="text-signal-amber">restricted</span>
                )}
              </td>
              <td className="px-4 py-3 text-bone-200">{m.importance}</td>
              <td className="px-4 py-3 text-bone-400 text-xs">{new Date(m.updatedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                {editingId === m.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => saveEdit(m.id)}
                      disabled={!!saving}
                      className="rounded bg-signal-green/10 px-2 py-0.5 text-[10px] text-signal-green hover:bg-signal-green/20 transition-colors disabled:opacity-40"
                    >
                      {saving === m.id ? "…" : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-2 py-0.5 text-[10px] text-bone-500 hover:text-bone-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditTitle(m.title); setEditingId(m.id); }}
                      className="rounded p-1 text-bone-500 hover:text-bone-200 transition-colors"
                      title="Edit title"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2.5 11.5 4.5 5 11H3V9L9.5 2.5Z" /><line x1="8" y1="4" x2="10" y2="6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteRow(m.id)}
                      disabled={saving === m.id}
                      className="rounded p-1 text-bone-500 hover:text-signal-red transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="2,4 4,4 12,4" /><path d="M5 4V3h4v1" /><path d="M4 4l.5 8h5l.5-8" /><line x1="6" y1="7" x2="6" y2="10" /><line x1="8" y1="7" x2="8" y2="10" />
                      </svg>
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
