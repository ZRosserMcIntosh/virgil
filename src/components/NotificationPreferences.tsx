"use client";

import { useState } from "react";

interface Prefs {
  briefingEmail: boolean;
  deadlineAlerts: boolean;
  securityAlerts: boolean;
  prAlerts: boolean;
  emailDigest: boolean;
}

export default function NotificationPreferences({ initial }: { initial: Prefs }) {
  const [prefs, setPrefs]   = useState<Prefs>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  const rows: { key: keyof Prefs; label: string; description: string }[] = [
    { key: "briefingEmail",  label: "Daily briefing email",   description: "Receive your morning briefing by email." },
    { key: "deadlineAlerts", label: "Deadline alerts",        description: "Notify when tasks or projects approach due dates." },
    { key: "securityAlerts", label: "Security alerts",        description: "Immediate notification on security events." },
    { key: "prAlerts",       label: "PR / GitHub alerts",     description: "Notify on PR reviews, merges, and CI failures." },
    { key: "emailDigest",    label: "Weekly digest",          description: "Sunday summary of all activity." },
  ];

  return (
    <div className="v-card v-card-pad">
      <div className="v-label mb-4">Notification Preferences</div>
      <div className="divide-y divide-ink-700">
        {rows.map(({ key, label, description }) => (
          <div key={key} className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm text-bone-100">{label}</div>
              <div className="text-xs text-bone-400">{description}</div>
            </div>
            <button
              role="switch"
              aria-checked={prefs[key] ? "true" : "false"}
              title={prefs[key] ? `Disable ${label}` : `Enable ${label}`}
              onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                prefs[key] ? "bg-signal-green" : "bg-ink-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-bone-50 shadow-sm transition-transform ${
                  prefs[key] ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-ink-600 px-4 py-1.5 text-xs font-medium text-bone-100 hover:bg-ink-500 transition-colors disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save preferences"}
        </button>
        {saved && <span className="text-xs text-signal-green">Saved.</span>}
      </div>
    </div>
  );
}
