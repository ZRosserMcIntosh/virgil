# VOICE — ElevenLabs TTS Integration

Virgil and VERÔNICA both support voice output via ElevenLabs text-to-speech.
Voice is opt-in per session. It does not auto-play. The user enables it with the
speaker toggle in the command page header.

---

## Architecture

```
User enables voice toggle
        │
        ▼
MessageBubble renders a speaker button on each assistant message
        │
User clicks speaker button (or voice auto-plays if auto-mode enabled later)
        │
        ▼
POST /api/virgil/speak  { text, companion }
        │
        ▼
src/lib/virgil/voice.ts
  └─ stripMarkdownForSpeech(text)      ← removes **, `code`, headers, etc.
  └─ synthesizeSpeech(text, companion) ← calls ElevenLabs SDK
        │
        ▼
ElevenLabs API → mp3 audio buffer
        │
        ▼
Response: audio/mpeg blob
        │
        ▼
Client: new Audio(blobURL).play()
```

---

## Environment Variables

Add these to `.env.local` (and to Vercel environment variables):

```bash
# Required
ELEVENLABS_API_KEY=sk_...

# Optional — override default voice IDs without touching code
ELEVENLABS_VOICE_VIRGIL=onwK4e9ZLuTAKqWW03F9
ELEVENLABS_VOICE_VERONICA=pFZP5JQG7iQjIQuC4Bku
```

---

## Default Voice Selection

### VIRGIL — "Daniel" (ElevenLabs)
- **Voice ID:** `onwK4e9ZLuTAKqWW03F9`
- **Character:** Deep, calm, composed British male
- **Model:** `eleven_multilingual_v2`
- **Why:** Closest legal match to the composed butler archetype available in the
  ElevenLabs public library without a custom clone.

### VERÔNICA — "Valentina" (ElevenLabs)
- **Voice ID:** `pFZP5JQG7iQjIQuC4Bku`
- **Character:** Warm, natural Brazilian Portuguese female
- **Model:** `eleven_multilingual_v2`
- **Why:** Native Portuguese speaker voice. Warm and measured — appropriate for
  VERÔNICA's protective, loyal tone with Stella.

> **Note on voice IDs:** ElevenLabs voice library IDs can be confirmed at
> `https://elevenlabs.io/voice-library`. The IDs above were current as of
> May 2026. If a voice has been removed, substitute the nearest equivalent
> and update `ELEVENLABS_VOICE_VIRGIL` / `ELEVENLABS_VOICE_VERONICA` in env.

---

## Creating a Professional Voice Clone (Legal Path)

If you want a custom voice that is not in the public library:

### Requirements
- **ElevenLabs Creator plan or above** (Professional Voice Clone feature)
- **30+ minutes** of clean, consistent audio
- **Your own voice** — or audio you own the rights to and have written consent for
- Audio should be: mono or stereo WAV/MP3, minimal background noise, consistent
  recording environment, no music underneath

### Steps
1. Go to `elevenlabs.io` → **Voices** → **Add Voice** → **Professional Clone**
2. Upload your audio samples
3. Wait for training (typically 2–4 hours)
4. Copy the resulting **Voice ID** from the voice settings page
5. Set `ELEVENLABS_VOICE_VIRGIL=<your_voice_id>` in `.env.local`

### Legal note
ElevenLabs Terms of Service (Section 3) prohibit cloning any person's voice
without their explicit written consent. This applies to:
- Public figures (actors, journalists, politicians)
- Characters from copyrighted productions (TV shows, films, games)
- Anyone who has not given written consent

Violation can result in account termination and potential legal liability.

---

## Voice Settings Reference

Configured in `src/lib/virgil/voice.ts` → `VOICE_CONFIG`:

| Setting | Range | Effect |
|---|---|---|
| `stability` | 0.0–1.0 | Higher = more consistent/monotone. Lower = more expressive/variable. |
| `similarity_boost` | 0.0–1.0 | How closely to match the cloned voice. Higher = more accurate but may introduce artifacts at extremes. |
| `style` | 0.0–1.0 | Style exaggeration. 0 = neutral. 0.3 = slight expressiveness. |
| `use_speaker_boost` | bool | Enhances clarity. Keep `true` for both voices. |

Current settings:

```typescript
VIRGIL:   stability 0.55, similarity 0.80, style 0.20
VERÔNICA: stability 0.60, similarity 0.75, style 0.30
```

VERÔNICA is slightly more expressive (higher style) — appropriate for her warmer,
more personal relationship with Stella.

---

## Character Limits and Cost

ElevenLabs charges by character synthesized (not by request).

| Plan | Monthly chars | Approx. responses |
|---|---|---|
| Free | 10,000 | ~50 average responses |
| Starter ($5/mo) | 30,000 | ~150 responses |
| Creator ($22/mo) | 100,000 | ~500 responses |
| Pro ($99/mo) | 500,000 | ~2,500 responses |

The route caps synthesis at **4,000 characters per request** and strips markdown
before sending, which meaningfully reduces consumption (code blocks, bullets, and
headers are removed before TTS — they sound poor when read aloud anyway).

Average Virgil response after stripping: ~300–600 characters.

---

## Files

| File | Purpose |
|---|---|
| `src/lib/virgil/voice.ts` | ElevenLabs client, voice config, `synthesizeSpeech()`, `stripMarkdownForSpeech()` |
| `src/app/api/virgil/speak/route.ts` | POST endpoint — auth-gated, returns `audio/mpeg` |
| `src/app/(private)/command/page.tsx` | Voice toggle in header, `speakMessage()`, speaker button on bubbles |

---

## Future: Auto-speak Mode

The current implementation is **click-to-speak** only. A future enhancement:

- Add `autoSpeak` toggle to settings
- After each assistant message resolves, automatically call `speakMessage()`
- Add stop button to header that cancels current audio

This is one line of change in the `send()` function — add `speakMessage(assistantMsg)`
after the message is appended to state, gated behind `voiceEnabled && autoSpeak`.
