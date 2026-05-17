/**
 * /tasks — Task management page.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project?: { name: string; slug: string } | null;
  tags: string[];
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [filter, setFilter]   = useState("TODO");
  const [title, setTitle]     = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks${filter ? `?status=${filter}` : ""}`);
    if (res.ok) setTasks(await res.json());
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: title.trim(), priority }),
    });
    setTitle("");
    load();
  }

  async function complete(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  }

  const priorityColor: Record<string, string> = {
    URGENT: "text-signal-red",
    HIGH:   "text-signal-amber",
    MEDIUM: "text-bone-300",
    LOW:    "text-bone-500",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl tracking-wide text-bone-50">Tasks</h1>
        <p className="mt-1 text-xs text-bone-400">Manage your obligations.</p>
      </header>

      {/* Create */}
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="New task…"
          className="flex-1 rounded border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-bone-100 placeholder-bone-500 outline-none focus:border-ink-400"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded border border-ink-600 bg-ink-800 px-2 py-2 text-xs text-bone-200"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <button onClick={create} className="rounded bg-ink-600 px-4 py-2 text-xs text-bone-100 hover:bg-ink-500">
          Add
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 text-xs">
        {["TODO", "IN_PROGRESS", "DONE", ""].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded px-3 py-1 transition-colors ${filter === s ? "bg-ink-700 text-bone-100" : "text-bone-400 hover:text-bone-200"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-1">
        {tasks.length === 0 && <p className="text-xs text-bone-500">No tasks.</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded border border-ink-700 bg-ink-900 px-4 py-2.5">
            <button
              onClick={() => t.status !== "DONE" ? complete(t.id) : undefined}
              className={`h-4 w-4 shrink-0 rounded border ${t.status === "DONE" ? "border-signal-green bg-signal-green/20" : "border-ink-500 hover:border-signal-green"}`}
            />
            <div className="flex-1 min-w-0">
              <div className={`text-sm ${t.status === "DONE" ? "text-bone-500 line-through" : "text-bone-100"}`}>{t.title}</div>
              <div className="flex gap-2 mt-0.5 text-[10px]">
                <span className={priorityColor[t.priority] ?? "text-bone-400"}>{t.priority}</span>
                {t.project && <span className="text-bone-500">{t.project.name}</span>}
                {t.dueDate && <span className="text-bone-500">due {new Date(t.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
            <button onClick={() => remove(t.id)} className="text-bone-600 hover:text-signal-red text-xs">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
