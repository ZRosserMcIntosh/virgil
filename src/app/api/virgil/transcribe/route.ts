/**
 * POST /api/virgil/transcribe
 *
 * Accepts a multipart/form-data body containing:
 *   - audio: Blob (webm, mp4, wav, ogg, etc.)
 *   - companion: "VIRGIL" | "VERONICA"  (optional — used for language hint)
 *
 * Returns: { text: string }
 *
 * Uses ElevenLabs Scribe v2 (best-in-class STT, 32 languages).
 * Zero-retention mode is available on enterprise plans.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ElevenLabsClient } from "elevenlabs";

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse form ────────────────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audioFile = formData.get("audio") as File | null;
  const companion = (formData.get("companion") as string) ?? "VIRGIL";

  if (!audioFile || audioFile.size === 0) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  // Hard cap: 10MB to prevent abuse
  if (audioFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio file too large (max 10MB)" }, { status: 413 });
  }

  // ── ElevenLabs STT ────────────────────────────────────────────────────────
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs not configured" }, { status: 503 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey });

    const result = await client.speechToText.convert({
      file: audioFile,
      model_id: "scribe_v1",
      // Provide language hint based on companion
      language_code: companion === "VERONICA" ? "pt" : "en",
      // Don't tag laughter/footsteps etc. — we only want clean transcript
      tag_audio_events: false,
      timestamps_granularity: "none",
    });

    const text = (result as any).text ?? "";

    if (!text) {
      return NextResponse.json({ text: "" });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err: any) {
    console.error("[transcribe] ElevenLabs STT error:", err?.message ?? err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
