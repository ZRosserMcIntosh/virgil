"use client";

import { useState, useRef } from "react";

interface ProfileFact {
  id: string;
  subject: "ROSSER" | "STELLA";
  category: string;
  label: string;
  value: string;
  veronicaVisible: boolean;
  pinned: boolean;
  encrypted: boolean;
}

interface Props {
  subject: "ROSSER" | "STELLA";
  initialFacts: ProfileFact[];
}

// Suggested categories per subject — user can type any free value
const CATEGORY_SUGGESTIONS = {
  ROSSER: [
    "Identity", "Travel", "Health", "Accounts", "Finances",
    "Preferences", "Family", "Work", "Contacts", "Goals",
  ],
  STELLA: [
    "Identity", "Family", "Preferences", "Health", "Travel",
    "Contacts", "Interests", "Important Dates", "Notes",
  ],
};

export default function ProfileSection({ subject, initialFacts }: Props) {
  const [facts, setFacts] = useState<ProfileFact[]>(initialFacts);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // new-fact form state
  const [newCategory, setNewCategory] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newVeronica, setNewVeronica] = useState(false);
  const [saving, setSaving] = useState(false);

  const isStella = subject === "STELLA";
  const labelRef = useRef<HTMLInputElement>(null);

  // Group by category
  const grouped = facts.reduce<Record<string, ProfileFact[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] ?? []).push(f);
    return acc;
  }, {});

  async function addFact() {
    if (!newCategory.trim() || !newLabel.trim() || !newValue.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile-facts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        category: newCategory.trim(),
        label: newLabel.trim(),
        value: newValue.trim(),
        veronicaVisible: newVeronica,
      }),
    });
    const created = await res.json();
    setFacts((prev) => [...prev, created]);
    setNewCategory("");
    setNewLabel("");
    setNewValue("");
    setNewVeronica(false);
    setAdding(false);
    setSaving(false);
  }

  async function deleteFact(id: string) {
    await fetch(`/api/profile-facts/${id}`, { method: "DELETE" });
    setFacts((prev) => prev.filter((f) => f.id !== id));
  }

  async function toggleVeronica(fact: ProfileFact) {
    const updated = await fetch(`/api/profile-facts/${fact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ veronicaVisible: !fact.veronicaVisible }),
    }).then((r) => r.json());
    setFacts((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  async function saveEdit(fact: ProfileFact, newVal: string) {
    const updated = await fetch(`/api/profile-facts/${fact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: newVal }),
    }).then((r) => r.json());
    setFacts((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    setEditId(null);
  }

  return (
    <div className="v-card space-y-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
        <div>
          <div className="v-label">
            {isStella ? "About Stella" : "About Me"}
          </div>
          {isStella && (
            <p className="mt-0.5 text-[11px] text-bone-400">
              Facts marked <span className="text-signal-green">V</span> are
              visible to Verônica&apos;s knowledge base.
            </p>
          )}
        </div>
        <button
          onClick={() => { setAdding(true); setTimeout(() => labelRef.current?.focus(), 50); }}
          className="rounded bg-ink-700 px-3 py-1.5 text-xs text-bone-200 hover:bg-ink-600 transition-colors"
        >
          + Add fact
        </button>
      </div>

      {/* ── Add form ── */}
      {adding && (
        <div className="border-b border-ink-700 bg-ink-900 px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Category */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1">
                Category
              </label>
              <input
                list={`cats-${subject}`}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Travel, Health…"
                className="w-full rounded bg-ink-800 border border-ink-600 px-2.5 py-1.5 text-sm text-bone-100 outline-none focus:border-ink-400"
              />
              <datalist id={`cats-${subject}`}>
                {CATEGORY_SUGGESTIONS[subject].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Label */}
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1">
                Label
              </label>
              <input
                ref={labelRef}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Delta Skymiles #, Birthday…"
                className="w-full rounded bg-ink-800 border border-ink-600 px-2.5 py-1.5 text-sm text-bone-100 outline-none focus:border-ink-400"
              />
            </div>

            {/* Value */}
            <div className="col-span-2 sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-wider text-bone-400 mb-1">
                Value
              </label>
              <input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addFact()}
                placeholder="The fact itself"
                className="w-full rounded bg-ink-800 border border-ink-600 px-2.5 py-1.5 text-sm text-bone-100 outline-none focus:border-ink-400"
              />
            </div>
          </div>

          {isStella && (
            <label className="flex items-center gap-2 cursor-pointer text-xs text-bone-300">
              <input
                type="checkbox"
                checked={newVeronica}
                onChange={(e) => setNewVeronica(e.target.checked)}
                className="accent-signal-green"
              />
              Visible to Verônica
            </label>
          )}

          <div className="flex gap-2">
            <button
              onClick={addFact}
              disabled={saving || !newCategory || !newLabel || !newValue}
              className="rounded bg-ink-600 px-4 py-1.5 text-xs text-bone-100 hover:bg-ink-500 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded px-3 py-1.5 text-xs text-bone-400 hover:text-bone-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Facts grouped by category ── */}
      {Object.keys(grouped).length === 0 && !adding ? (
        <div className="px-5 py-8 text-center text-sm text-bone-400">
          No facts yet. Add the first one above.
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="border-b border-ink-700 last:border-0">
            <div className="bg-ink-900/50 px-5 py-2 text-[10px] uppercase tracking-[0.2em] text-bone-400">
              {category}
            </div>
            {items.map((fact) => (
              <FactRow
                key={fact.id}
                fact={fact}
                isStella={isStella}
                editId={editId}
                setEditId={setEditId}
                onDelete={deleteFact}
                onToggleVeronica={toggleVeronica}
                onSaveEdit={saveEdit}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ── Individual row ────────────────────────────────────────────────────────────

function FactRow({
  fact,
  isStella,
  editId,
  setEditId,
  onDelete,
  onToggleVeronica,
  onSaveEdit,
}: {
  fact: ProfileFact;
  isStella: boolean;
  editId: string | null;
  setEditId: (id: string | null) => void;
  onDelete: (id: string) => void;
  onToggleVeronica: (fact: ProfileFact) => void;
  onSaveEdit: (fact: ProfileFact, val: string) => void;
}) {
  const [editVal, setEditVal] = useState(fact.value);
  const isEditing = editId === fact.id;

  return (
    <div className="flex items-center gap-3 border-t border-ink-800 px-5 py-2.5 group hover:bg-ink-900/40 transition-colors">
      {/* Label */}
      <span className="w-44 shrink-0 text-xs text-bone-400 truncate">{fact.label}</span>

      {/* Value */}
      {isEditing ? (
        <input
          autoFocus
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit(fact, editVal);
            if (e.key === "Escape") setEditId(null);
          }}
          aria-label="Edit fact value"
          placeholder="Edit value"
          className="flex-1 rounded border border-ink-500 bg-ink-800 px-2 py-1 text-sm text-bone-100 outline-none"
        />
      ) : (
        <span
          className="flex-1 text-sm text-bone-100 cursor-pointer"
          onClick={() => { setEditId(fact.id); setEditVal(fact.value); }}
          title="Click to edit"
        >
          {fact.encrypted ? (
            <span className="text-signal-amber text-xs italic">encrypted</span>
          ) : (
            fact.value
          )}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {isEditing ? (
          <>
            <button
              onClick={() => onSaveEdit(fact, editVal)}
              className="text-[11px] text-signal-green hover:underline"
            >save</button>
            <button
              onClick={() => setEditId(null)}
              className="text-[11px] text-bone-400 hover:underline"
            >cancel</button>
          </>
        ) : (
          <button
            onClick={() => { setEditId(fact.id); setEditVal(fact.value); }}
            className="text-[11px] text-bone-400 hover:text-bone-100"
          >edit</button>
        )}
        {isStella && (
          <button
            onClick={() => onToggleVeronica(fact)}
            title={fact.veronicaVisible ? "Visible to Verônica — click to hide" : "Hidden from Verônica — click to share"}
            className={`text-[11px] font-medium transition-colors ${
              fact.veronicaVisible ? "text-signal-green" : "text-bone-600 hover:text-bone-300"
            }`}
          >
            V
          </button>
        )}
        <button
          onClick={() => onDelete(fact.id)}
          className="text-[11px] text-bone-500 hover:text-signal-red transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}
