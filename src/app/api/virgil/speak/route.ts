/**
 * POST /api/virgil/speak
 *
 * Accepts { text, companion } and streams back mp3 audio via ElevenLabs TTS.
 *
 * The client plays the audio using the Web Audio API or a simple <audio> element
 * with a Blob URL — see the command page voice hook for the full client pattern.
 *
 * Rate limiting: ElevenLabs free tier is 10k chars/month. Starter is 30k.
 * The route strips markdown before sending, reducing char consumption.
 *
 * Security: route is auth-gated via session check. No text is stored here;
 * ElevenLabs does not log by default on paid plans.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth/options";
import {
  synthesizeSpeech,
  stripMarkdownForSpeech,
  VoiceCompanion,
} from "@/lib/virgil/voice";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // ── Auth gate ────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let text: string;
  let companion: VoiceCompanion;

  try {
    const body = await req.json();
    text       = String(body.text ?? "").trim();
    companion  = body.companion === "VERONICA" ? "VERONICA" : "VIRGIL";
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  // ── Sanitize for TTS ─────────────────────────────────────────────────────
  const cleaned = stripMarkdownForSpeech(text);

  // Enforce a hard cap to prevent runaway ElevenLabs consumption
  const capped = cleaned.slice(0, 4000);

  // ── Synthesize ───────────────────────────────────────────────────────────
  try {
    const audioStream = await synthesizeSpeech(capped, companion);

    // Collect chunks and return as a single mp3 blob
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("[speak] ElevenLabs error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Voice synthesis failed", detail: err?.message },
      { status: 502 },
    );
  }
}
