/**
 * VIRGIL — Voice Layer
 *
 * Wraps ElevenLabs TTS. Returns a readable stream of audio bytes (mp3).
 *
 * Voice IDs are configured per companion in VOICE_CONFIG.
 * To change a voice: replace the voiceId string. Nothing else changes.
 *
 * Voices chosen from ElevenLabs public library:
 *
 *   VIRGIL  → "Daniel" (British, composed, authoritative)
 *             ElevenLabs voice ID: onwK4e9ZLuTAKqWW03F9
 *             Description: Deep, calm, British male. Closest legal match to the
 *             composed butler archetype. Used by default for Mr. McIntosh.
 *
 *   VERÔNICA → "Valentina" (Brazilian Portuguese, warm, feminine)
 *              ElevenLabs voice ID: pFZP5JQG7iQjIQuC4Bku
 *              Description: Warm, natural Brazilian Portuguese female voice.
 *              Used by default for Stella's companion.
 *
 * To substitute your own Professional Voice Clone:
 *   1. Go to elevenlabs.io → Voices → Add Voice → Professional Clone
 *   2. Upload 30+ minutes of clean audio
 *   3. Copy the resulting Voice ID
 *   4. Replace the voiceId below (or set ELEVENLABS_VOICE_VIRGIL /
 *      ELEVENLABS_VOICE_VERONICA in .env.local to override without
 *      touching code)
 */

import { ElevenLabsClient } from "elevenlabs";

// ── Client ────────────────────────────────────────────────────────────────────

function getClient(): ElevenLabsClient {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set.");
  return new ElevenLabsClient({ apiKey });
}

// ── Voice config ──────────────────────────────────────────────────────────────

export const VOICE_CONFIG = {
  VIRGIL: {
    voiceId:    process.env.ELEVENLABS_VOICE_VIRGIL    ?? "onwK4e9ZLuTAKqWW03F9",
    modelId:    "eleven_multilingual_v2",
    stability:  0.55,   // higher = more consistent, less expressive
    similarity: 0.80,   // voice clone fidelity
    style:      0.20,   // slight stylistic expressiveness
    language:   "en",
  },
  VERONICA: {
    voiceId:    process.env.ELEVENLABS_VOICE_VERONICA  ?? "pFZP5JQG7iQjIQuC4Bku",
    modelId:    "eleven_multilingual_v2",
    stability:  0.60,
    similarity: 0.75,
    style:      0.30,   // slightly more expressive warmth for Verônica
    language:   "pt",
  },
} as const;

export type VoiceCompanion = keyof typeof VOICE_CONFIG;

// ── TTS stream ────────────────────────────────────────────────────────────────

/**
 * Returns a Node.js Readable stream of mp3 audio bytes.
 * The caller is responsible for piping or collecting the stream.
 *
 * @param text      The text to synthesize. Max ~5000 chars per call.
 * @param companion "VIRGIL" | "VERONICA"
 */
export async function synthesizeSpeech(
  text: string,
  companion: VoiceCompanion = "VIRGIL",
): Promise<NodeJS.ReadableStream> {
  const client  = getClient();
  const cfg     = VOICE_CONFIG[companion];

  const audio = await client.textToSpeech.convert(cfg.voiceId, {
    text,
    model_id: cfg.modelId,
    voice_settings: {
      stability:          cfg.stability,
      similarity_boost:   cfg.similarity,
      style:              cfg.style,
      use_speaker_boost:  true,
    },
    output_format: "mp3_44100_128",
  });

  return audio as unknown as NodeJS.ReadableStream;
}

// ── Utility: strip markdown for TTS ──────────────────────────────────────────

/**
 * Removes markdown syntax that sounds wrong when read aloud:
 * bold, italic, code blocks, headers, horizontal rules, bullet dashes.
 */
export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")        // fenced code blocks
    .replace(/`[^`]+`/g, "")               // inline code
    .replace(/#{1,6}\s+/g, "")             // headers
    .replace(/\*\*([^*]+)\*\*/g, "$1")     // bold
    .replace(/\*([^*]+)\*/g, "$1")         // italic
    .replace(/^[-*]\s+/gm, "")             // bullet points
    .replace(/^---+$/gm, "")               // horizontal rules
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → label only
    .replace(/\n{3,}/g, "\n\n")            // excess newlines
    .trim();
}
