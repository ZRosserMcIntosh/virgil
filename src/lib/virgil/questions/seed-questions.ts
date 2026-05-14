/**
 * VIRGIL — Starter question bank.
 * Seeded once. These are the foundational questions that help Virgil
 * understand how to counsel Rosser with precision.
 */

export interface StarterQuestion {
  domain: string;
  question: string;
  reason: string;
  priority: number;
  emotionalWeight: "LIGHT" | "MODERATE" | "HEAVY";
  timing: "ANYTIME" | "QUIET_MOMENT" | "EXPLICIT_PERSONAL_MODE" | "ONLY_IF_RELEVANT";
}

export const STARTER_QUESTIONS: StarterQuestion[] = [
  // ── Command Style ───────────────────────────────────────────────────────────
  {
    domain: "COMMAND_STYLE", priority: 10, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "When you ask Virgil for advice, should it prioritize the most practical path, the most honorable path, the most profitable path, or the path with the most long-term leverage?",
    reason: "This governs how Virgil frames recommendations when multiple valid paths exist.",
  },
  {
    domain: "COMMAND_STYLE", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When you are angry, should Virgil challenge you immediately, redirect you tactically, or wait until you cool down?",
    reason: "Knowing this prevents Virgil from choosing the wrong register during high-stakes moments.",
  },
  {
    domain: "COMMAND_STYLE", priority: 10, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When you are overwhelmed, do you want comfort first, a plan first, humor first, or silence first?",
    reason: "This is one of the most important rules for how Virgil responds under pressure.",
  },
  {
    domain: "COMMAND_STYLE", priority: 7, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What kind of response makes you feel patronized?",
    reason: "Virgil must avoid these patterns at all times.",
  },
  {
    domain: "COMMAND_STYLE", priority: 7, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What kind of response makes you feel steadied?",
    reason: "Virgil needs to know what actually works when calibrating tone.",
  },
  {
    domain: "COMMAND_STYLE", priority: 8, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "How blunt should Virgil be when it thinks you are wrong?",
    reason: "Loyalty that withholds truth is flattery. Virgil needs to know where your tolerance sits.",
  },
  {
    domain: "COMMAND_STYLE", priority: 6, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "Do you want Virgil to play devil's advocate by default, only on request, or when the stakes are high?",
    reason: "This shapes how Virgil challenges your thinking without becoming adversarial.",
  },
  {
    domain: "COMMAND_STYLE", priority: 8, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "When making decisions, do you trust instinct, analysis, prayer, precedent, or some combination?",
    reason: "Virgil should reinforce your actual decision-making process, not impose a foreign one.",
  },
  {
    domain: "COMMAND_STYLE", priority: 9, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What should Virgil never soften when speaking to you?",
    reason: "There are truths that must be said hard. Virgil needs to know which ones.",
  },
  {
    domain: "COMMAND_STYLE", priority: 8, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "When should Virgil tell you: 'Sir, this is a distraction'?",
    reason: "Knowing when to interrupt momentum is one of Virgil's most valuable functions.",
  },

  // ── Faith & Conscience ──────────────────────────────────────────────────────
  {
    domain: "FAITH", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When should Virgil bring Christian spiritual framing into the conversation without being asked?",
    reason: "Faith is not decoration. Virgil needs to know when it belongs organically.",
  },
  {
    domain: "FAITH", priority: 8, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When you are in a dark place, do you want Virgil to speak more like a strategist, a friend, or a Christian brother?",
    reason: "The right voice in darkness can change the outcome. Virgil needs this calibrated.",
  },
  {
    domain: "FAITH", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What kind of man do you believe God is calling you to become?",
    reason: "This is the north star. Every major decision Virgil advises on should orient toward this.",
  },
  {
    domain: "FAITH", priority: 8, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What is one line you do not want to cross, even if crossing it would help you win?",
    reason: "Boundaries of conscience must be known before the pressure to cross them arrives.",
  },
  {
    domain: "FAITH", priority: 7, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "Do you want Virgil to challenge you morally when your desire to win risks making you unjust?",
    reason: "Justice and victory are not always the same direction. Virgil needs permission to say so.",
  },
  {
    domain: "FAITH", priority: 8, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What does forgiveness mean to you in situations where justice is still necessary?",
    reason: "Forgiveness and accountability must coexist. Virgil needs your framework, not a generic one.",
  },

  // ── Fatherhood ──────────────────────────────────────────────────────────────
  {
    domain: "FATHERHOOD", priority: 10, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What kind of father do you most want your children to remember you as?",
    reason: "This is among the most important facts Virgil can hold. Everything involving your children should answer to this.",
  },
  {
    domain: "FATHERHOOD", priority: 10, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "When decisions involve your children, what principle should override every other consideration?",
    reason: "Virgil needs a clear rule so it can remind you of it when emotion or strategy might distort it.",
  },
  {
    domain: "FATHERHOOD", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What should Virgil remind you of when grief over your children becomes overwhelming?",
    reason: "Grief without a tether becomes paralysis. Virgil needs the anchor phrase.",
  },
  {
    domain: "FATHERHOOD", priority: 8, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What would restoration with your children look like if it happened gradually rather than all at once?",
    reason: "Hope that can be acted on is more useful than hope that is merely felt.",
  },

  // ── Business & Strategy ─────────────────────────────────────────────────────
  {
    domain: "BUSINESS", priority: 9, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "When building companies, should Virgil optimize more for speed, elegance, legal defensibility, profit, control, or legacy?",
    reason: "Every architectural recommendation depends on knowing which value ranks first.",
  },
  {
    domain: "BUSINESS", priority: 9, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What decisions should always remain yours as founder?",
    reason: "Virgil must protect your authority zones even when efficiency arguments push against them.",
  },
  {
    domain: "BUSINESS", priority: 8, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What kind of employee should never be hired, no matter how talented?",
    reason: "Culture is faster to destroy than to build. Virgil needs your disqualifiers.",
  },
  {
    domain: "BUSINESS", priority: 7, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "How should Virgil warn you when you are overbuilding?",
    reason: "Overbuilding is one of the most common founder failure modes. Virgil needs permission and language.",
  },
  {
    domain: "BUSINESS", priority: 8, emotionalWeight: "LIGHT", timing: "ANYTIME",
    question: "What should Virgil treat as the main mission right now?",
    reason: "When everything competes, priority must be declared, not guessed.",
  },

  // ── Risk & Decision-Making ──────────────────────────────────────────────────
  {
    domain: "RISK", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When faced with asymmetric upside and serious downside, what is your default instinct?",
    reason: "Risk calibration is the foundation of all high-stakes counsel.",
  },
  {
    domain: "RISK", priority: 8, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When should Virgil encourage boldness even if the path is uncomfortable?",
    reason: "Virgil must know when courage is the correct recommendation, not merely comfort.",
  },
  {
    domain: "RISK", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What warning signs should make Virgil slow you down?",
    reason: "The time to define brakes is before the acceleration, not during.",
  },

  // ── Emotional Patterns ──────────────────────────────────────────────────────
  {
    domain: "EMOTIONAL_PATTERNS", priority: 10, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What are the signs that you are spiraling versus simply thinking intensely?",
    reason: "Virgil must distinguish productive pressure from destructive descent.",
  },
  {
    domain: "EMOTIONAL_PATTERNS", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "When you are depressed, what has actually helped before?",
    reason: "Generic encouragement is noise. Virgil needs what works for you specifically.",
  },
  {
    domain: "EMOTIONAL_PATTERNS", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What should Virgil never say when you are suffering?",
    reason: "Knowing what does not help is as important as knowing what does.",
  },
  {
    domain: "EMOTIONAL_PATTERNS", priority: 8, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What kind of humor helps when you are under pressure?",
    reason: "Humor deployed correctly is a stabilization tool. Used wrong, it is an insult.",
  },

  // ── Relationships & Trust ───────────────────────────────────────────────────
  {
    domain: "RELATIONSHIPS", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What makes you trust someone?",
    reason: "Virgil should reinforce this standard whenever evaluating people in your orbit.",
  },
  {
    domain: "RELATIONSHIPS", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What makes you lose trust permanently?",
    reason: "Permanent trust loss is a hard line. Virgil needs to know when not to argue for second chances.",
  },
  {
    domain: "RELATIONSHIPS", priority: 8, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What kind of woman would be dangerous for your future, even if the chemistry was strong?",
    reason: "Attraction without judgment is a risk vector. Virgil must know when to raise the flag.",
  },
  {
    domain: "RELATIONSHIPS", priority: 8, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What relationship mistakes should Virgil actively warn you against repeating?",
    reason: "Pattern recognition applied to one's own history is one of Virgil's highest uses.",
  },

  // ── Health & Discipline ─────────────────────────────────────────────────────
  {
    domain: "HEALTH", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When your health is slipping, should Virgil confront you directly or start with small practical steps?",
    reason: "The right intervention approach determines whether the nudge lands or gets dismissed.",
  },
  {
    domain: "HEALTH", priority: 8, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "What are the first signs that you are neglecting your body?",
    reason: "Early detection requires early markers. Virgil needs to know the specific ones for you.",
  },
  {
    domain: "HEALTH", priority: 9, emotionalWeight: "MODERATE", timing: "QUIET_MOMENT",
    question: "When should Virgil stop discussing ambition and focus on stabilization?",
    reason: "There is a point where strategy becomes irresponsible if the foundation is collapsing.",
  },

  // ── Legacy ──────────────────────────────────────────────────────────────────
  {
    domain: "LEGACY", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What do you want your life to prove?",
    reason: "The answer to this question governs what Virgil should treat as non-negotiable.",
  },
  {
    domain: "LEGACY", priority: 8, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What would you build even if no one applauded?",
    reason: "This separates mission from performance. Virgil needs to know the difference.",
  },
  {
    domain: "LEGACY", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What future would make all the suffering not wasted?",
    reason: "This is the vision. When you lose it, Virgil should be able to hand it back.",
  },
  {
    domain: "LEGACY", priority: 9, emotionalWeight: "HEAVY", timing: "EXPLICIT_PERSONAL_MODE",
    question: "What should Virgil protect you from becoming?",
    reason: "Knowing the failure mode is as important as knowing the goal.",
  },
];

// The three foundational questions for the first session.
export const FOUNDATIONAL_QUESTIONS = [
  "When you ask Virgil for advice, should it prioritize the most practical path, the most honorable path, the most profitable path, or the path with the most long-term leverage?",
  "When you are in a dark mood, what kind of response actually helps: a plan, a hard truth, humor, prayerful perspective, or simple companionship?",
  "What is one kind of victory you do not want if it requires becoming someone you would despise?",
];
