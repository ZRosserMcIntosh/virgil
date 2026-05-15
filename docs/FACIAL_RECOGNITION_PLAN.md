# Facial Recognition — Future Authentication Plan

**Status:** Planned. Not yet implemented.  
**Target:** Virgil (Rosser) and Verônica (Stella) login flows.  
**Principle:** Facial recognition is a convenience layer, not a security layer. The cryptographic key derivation (CPF + password for Stella, owner key for Rosser) remains the ground truth.

---

## Architecture Overview

Face recognition should be treated as a **fast-path unlock**, not a replacement for the primary credential.

```
Primary credential (CPF + password)  →  derives encryption key  →  decrypts data
Facial recognition                   →  retrieves stored session token  →  unlocks UI

Face CANNOT derive the encryption key. Only the password can.
```

This means: after face recognition succeeds, the user still needs their encryption key
available from a prior session (encrypted JWT stored server-side or in a secure cookie).
Face recognition unlocks the session — it does not regenerate the key from scratch.

---

## Implementation Plan

### Phase 1: Enroll (one-time, post-password-login)

After a successful password login, offer optional face enrollment:

1. Capture 10–20 face embeddings using the device camera.
2. Generate a face descriptor vector (128-float array via face-api.js or a server-side model).
3. Encrypt the descriptor with the session's `principalKey` before storing.
4. Store the encrypted descriptor in the database (`FaceEnrollment` table).
5. Set a flag: `faceEnrolled: true` on the User row.

```ts
model FaceEnrollment {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  descriptors String   // AES-256-GCM encrypted JSON array of Float32Arrays
  enrolledAt  DateTime @default(now())
  lastUsedAt  DateTime?
}
```

### Phase 2: Recognition (subsequent logins)

On the login page, before the credential form:

1. Request camera access.
2. Capture a live frame and extract face descriptor.
3. POST the descriptor to `/api/auth/face-verify`.
4. Server: look up the user's encrypted face descriptor, decrypt it (requires a server-side session token, not the full key — see security note), compare using Euclidean distance threshold (< 0.6 for face-api.js models).
5. On match: return a short-lived face-auth token (signed JWT, 60s TTL).
6. Client uses that token to skip the password form and go straight to the authenticated session.

**Security note on decryption at recognition time:**  
The face descriptor is encrypted with the `principalKey`, which is derived from CPF + password. This means the server cannot decrypt the descriptor at recognition time without the key — creating a chicken-and-egg problem.

**Solution options (choose one at implementation time):**

**Option A — Server-side encryption with a separate face key:**  
Encrypt face descriptors with a server-managed key (`FACE_ENCRYPTION_KEY` env var) rather than the user's personal key. This allows server-side comparison. Trade-off: the server operator (Rosser) can technically access face data. Acceptable for Rosser's own instance. Less ideal for Stella's enrollment given the privacy model.

**Option B — Client-side comparison:**  
Store face descriptors encrypted with the `principalKey`. On the login page, before the credential form, attempt face recognition. If face matches a candidate email (from the allowed list), pre-fill the email. The password step still runs. The face recognition only eliminates the email-lookup step — it does not bypass the password. Stella's encryption key is still required. This is the **recommended option** for Stella.

**Option C — Biometric-bound session extension:**  
After a successful full login, store the `principalKey` in the device's secure enclave (via WebAuthn / Credential Management API), bound to a biometric check. Subsequent logins use the enclave to retrieve the key, verified by face/fingerprint at the OS level. This is the most secure option but requires HTTPS and platform biometric support. **Recommended long-term target.**

---

## Recommended Libraries

| Library | Purpose | Notes |
|---------|---------|-------|
| `face-api.js` | Client-side face detection + recognition | Runs fully in browser (TensorFlow.js), no data leaves device during recognition |
| `@mediapipe/face_detection` | Alternative — faster, lighter | Google MediaPipe, well-maintained |
| Web Credential Management API | Option C: platform biometric binding | Available on Chrome/Safari on modern hardware |
| WebAuthn (`navigator.credentials`) | Option C: hardware security key / Touch ID | The gold standard for biometric auth |

**Recommendation:** Start with `face-api.js` for Option B (Stella) and Option C (Rosser via WebAuthn / Touch ID on MacBook).

---

## UI Plan

### Rosser's login:
```
[Camera preview — small, top right]
[ Email ] [ Owner Key ]
[ Enter ]

Or: Touch ID / Face ID  ←── appears only if enrolled
```

### Stella's login:
```
[Camera preview — ambient, warm]
Oi, Stella.  ←── appears when face is recognized (before password)

[ CPF ]  [ Senha ]
[ Entrar ]
```

Verônica should greet Stella by name the moment her face is recognized — before she types anything. The password still runs. But the recognition moment should feel warm, not clinical.

---

## Privacy Constraints for Stella

1. Face enrollment must be **Stella's explicit choice**. It is never automatic.
2. Face descriptors are never shared with Virgil's data store.
3. Face data must be deletable by Stella at any time via her settings.
4. If Option A (server-side face key) is used, Stella's settings page must show a clear notice: "Your face descriptor is stored server-side and is visible to the system administrator."
5. Option B or C should be used for Stella if privacy is the priority.
6. Face recognition logs must appear in the `VeronicaPrivacyAudit` table.

---

## Database Changes (when ready)

```sql
CREATE TABLE "FaceEnrollment" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "descriptors" TEXT NOT NULL,  -- encrypted JSON
  "enrolledAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastUsedAt"  TIMESTAMPTZ
);

ALTER TABLE "User" ADD COLUMN "faceEnrolled" BOOLEAN NOT NULL DEFAULT false;
```

---

## Implementation Sequence (when ready to build)

1. Install `face-api.js` and download TinyFaceDetector + FaceRecognitionNet models.
2. Host model weights in `/public/face-models/` (served statically, no external calls).
3. Build `FaceCapture` client component (camera + descriptor extraction).
4. Build enrollment flow in `/settings` (post-login, optional).
5. Build recognition flow on login page (Option B for Stella, Option C for Rosser).
6. Add `FaceEnrollment` table migration.
7. Add audit logging for face recognition events.
8. Test on mobile (camera access, descriptor quality, false acceptance rate).

**Target false acceptance rate:** < 0.1% (face-api.js default threshold achieves ~0.2% — tighten to 0.5 distance).

---

## One-line Summary

> Face recognition unlocks the session. The password unlocks the data. They are not the same thing, and they must never be conflated.
