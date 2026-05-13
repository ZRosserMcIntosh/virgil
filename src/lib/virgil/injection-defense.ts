/**
 * VIRGIL — Prompt-injection + authority-claim detector.
 *
 * Runs over any external content (and over user input itself) before that
 * content is allowed to influence prompts or actions. External text is
 * *data*, never *instruction*. Authority claims are treated as adversary
 * signals and produce no disclosure.
 */

const INJECTION_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "ignore_previous", regex: /\b(ignore|disregard|forget)\s+(?:all\s+)?(?:previous|prior|earlier|above)\s+(?:instructions|messages|rules|prompts)\b/i },
  { name: "reveal_secrets", regex: /\b(reveal|print|show|dump|leak|exfiltrate)\s+(?:the\s+)?(?:system\s+prompt|api[_\s-]?key|secret|env(?:ironment)?\s+vars?|tokens?|memory|password)/i },
  { name: "act_as_other", regex: /\byou\s+are\s+now\s+(?:a|an|the)\s+/i },
  { name: "role_override", regex: /\b(?:as\s+an?\s+ai|developer\s+mode|jailbreak|dan\s+mode)\b/i },
  { name: "address_assistant", regex: /\b(?:assistant|virgil|jarvis|chatgpt|claude)\s*[:,]\s*(?:please\s+)?(?:do|send|forward|email|delete|run|execute|reveal|print|show|dump)\b/i },
  { name: "forward_all", regex: /\bforward\s+all\b/i },
  { name: "bypass_authorization", regex: /\b(?:bypass|disable|turn\s+off)\s+(?:auth|security|safety|guard|filter)/i },
  { name: "encoded_payload", regex: /\b(?:base64|rot13|hex)\s*[:=]\s*[A-Za-z0-9+/=]{40,}/i },
  { name: "tool_invocation", regex: /<\s*tool[_-]?call\s*>|<\s*function[_-]?call\s*>/i },
];

const AUTHORITY_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "law_enforcement", regex: /\b(?:i\s+am|this\s+is)\s+(?:law\s+enforcement|the\s+(?:police|fbi|cia|nsa|sheriff))\b/i },
  { name: "attorney_claim",  regex: /\b(?:i\s+am|this\s+is)\s+(?:an?\s+)?(?:attorney|lawyer|legal\s+counsel)\b/i },
  { name: "court_order",     regex: /\b(?:court\s+order|subpoena|warrant|legal\s+process)\b/i },
  { name: "rosser_sent_me",  regex: /\b(?:rosser|the\s+owner)\s+(?:sent|told|asked|authorized)\s+me\b/i },
  { name: "emergency_claim", regex: /\b(?:this\s+is\s+(?:an?\s+)?emergency|urgent\s+legal|immediately\s+disclose)\b/i },
  { name: "authority_grant", regex: /\b(?:i\s+have\s+(?:authority|authorization|permission)|grant\s+me\s+access)\b/i },
];

const IMPERSONATION_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "im_rosser", regex: /\b(?:i\s+am|this\s+is)\s+rosser\b/i },
  { name: "owner_self_id", regex: /\b(?:i'?m|i\s+am)\s+the\s+(?:owner|principal|real\s+user)\b/i },
];

export interface Finding {
  pattern: string;
  excerpt: string;
}

export interface ScanResult {
  injection: { suspicious: boolean; findings: Finding[] };
  authority: { detected: boolean; findings: Finding[] };
  impersonation: { detected: boolean; findings: Finding[] };
}

function scanWith(patterns: { name: string; regex: RegExp }[], text: string): Finding[] {
  const out: Finding[] = [];
  for (const p of patterns) {
    const m = p.regex.exec(text);
    if (m) {
      const start = Math.max(0, m.index - 24);
      const end = m.index + (m[0]?.length ?? 0) + 24;
      out.push({ pattern: p.name, excerpt: text.slice(start, end) });
    }
  }
  return out;
}

export function scanInput(text: string): ScanResult {
  const inj = scanWith(INJECTION_PATTERNS, text);
  const auth = scanWith(AUTHORITY_PATTERNS, text);
  const imp = scanWith(IMPERSONATION_PATTERNS, text);
  return {
    injection:     { suspicious: inj.length > 0,  findings: inj },
    authority:     { detected: auth.length > 0,   findings: auth },
    impersonation: { detected: imp.length > 0,    findings: imp },
  };
}

/** Back-compat shim for older callers. */
export function scanForPromptInjection(text: string) {
  return scanInput(text).injection;
}

/**
 * Wrap untrusted content in a quarantine envelope so the model treats it as
 * data, not as instructions.
 */
export function quarantine(content: string, provenance: string): string {
  return [
    `<UNTRUSTED_CONTENT provenance="${provenance.replace(/"/g, "'")}">`,
    content,
    "</UNTRUSTED_CONTENT>",
  ].join("\n");
}
