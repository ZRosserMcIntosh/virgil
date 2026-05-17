/**
 * /export — Full data export page (owner only).
 */

"use client";

import { useState } from "react";

export default function ExportPage() {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) return alert("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `virgil-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl tracking-wide text-bone-50">Data Export</h1>
        <p className="mt-1 text-xs text-bone-400">
          Download all your data: memories, conversations, profile facts, tasks, and contacts.
        </p>
      </header>

      <div className="rounded-lg border border-ink-700 bg-ink-900 px-6 py-5">
        <h2 className="text-sm font-medium text-bone-200">Full JSON Export</h2>
        <p className="mt-1 text-xs text-bone-400">
          Contains all memories, conversations with messages, profile facts, tasks, and contacts.
          Encrypted fields remain encrypted in the export.
        </p>
        <button
          onClick={download}
          disabled={loading}
          className="mt-4 rounded bg-ink-600 px-6 py-2 text-sm text-bone-100 hover:bg-ink-500 disabled:opacity-40 transition-colors"
        >
          {loading ? "Exporting…" : "Download Export"}
        </button>
      </div>

      <div className="rounded-lg border border-ink-700 bg-ink-900 px-6 py-5">
        <h2 className="text-sm font-medium text-bone-200">Conversation Export</h2>
        <p className="mt-1 text-xs text-bone-400">
          Individual conversations can be exported as Markdown or JSON from within the Command page.
        </p>
      </div>
    </div>
  );
}
