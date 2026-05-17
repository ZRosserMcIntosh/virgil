/**
 * /contacts — People / CRM page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  notes: string | null;
  birthday: string | null;
  tags: string[];
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch]     = useState("");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("");
  const [company, setCompany]   = useState("");

  const load = useCallback(async () => {
    const q = search.trim();
    const res = await fetch(`/api/contacts${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) setContacts(await res.json());
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!name.trim()) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email || null, role: role || null, company: company || null }),
    });
    setName(""); setEmail(""); setRole(""); setCompany("");
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl tracking-wide text-bone-50">Contacts</h1>
        <p className="mt-1 text-xs text-bone-400">People database. Virgil can look these up in conversation.</p>
      </header>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search contacts…"
        className="w-full rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none focus:border-ink-400"
      />

      {/* Create */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none" />
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" className="rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none" />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none" />
      </div>
      <button onClick={create} disabled={!name.trim()} className="rounded bg-ink-600 px-4 py-2 text-xs text-bone-100 hover:bg-ink-500 disabled:opacity-40">
        Add contact
      </button>

      {/* List */}
      <div className="space-y-1">
        {contacts.length === 0 && <p className="text-xs text-bone-500">No contacts found.</p>}
        {contacts.map((c) => (
          <div key={c.id} className="flex items-start gap-3 rounded border border-ink-700 bg-ink-900 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-bone-100">{c.name}</div>
              <div className="flex gap-2 mt-0.5 text-[11px] text-bone-400">
                {c.role && <span>{c.role}</span>}
                {c.company && <span>at {c.company}</span>}
                {c.email && <span>— {c.email}</span>}
              </div>
              {c.notes && <div className="mt-1 text-xs text-bone-500">{c.notes}</div>}
            </div>
            <button onClick={() => remove(c.id)} className="text-bone-600 hover:text-signal-red text-xs shrink-0">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
