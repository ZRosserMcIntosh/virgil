/**
 * VIRGIL — Trust context builder.
 *
 * Translates a NextAuth session + request signals into a TrustContext.
 * Conservative: missing signals reduce the rung. Outsiders are STRANGER.
 * Any DB hit on the denial list flips `denied = true`. Lockdown overrides all.
 */

import type { Session } from "next-auth";
import { PepperRung, PermissionLevel, type TrustContext } from "@/lib/virgil/types";
import { hashOpaque } from "@/lib/encryption";
import { prisma } from "@/lib/db/client";
import { isDenied } from "@/lib/virgil/adversary";
import { getLockdown } from "@/lib/virgil/lockdown";

const OWNER_EMAIL = (process.env.VIRGIL_OWNER_EMAIL ?? "").toLowerCase();

export interface BuildTrustOptions {
  session: Session | null;
  ip?: string;
  userAgent?: string;
  trustedDeviceFingerprint?: string;
}

const STRANGER_BASE = (overrides: Partial<TrustContext>): TrustContext => ({
  userId: null,
  sessionId: null,
  identity: "STRANGER",
  isAuthenticated: false,
  isOwner: false,
  isPepper: false,
  pepperRung: PepperRung.NONE,
  isTrustedDevice: false,
  voiceVerified: false,
  strongVerified: false,
  riskScore: 80,
  authorizationLevel: PermissionLevel.STRANGER,
  lockedDown: false,
  denied: false,
  adversaryScore: 0,
  ...overrides,
});

export async function buildTrustContext(opts: BuildTrustOptions): Promise<TrustContext> {
  const ipHash = opts.ip ? hashOpaque(opts.ip, "ip") : undefined;
  const userAgent = opts.userAgent;

  // System-wide lockdown wins over everything except the constitutional clear flow.
  const lockdown = await getLockdown();
  const denied = await isDenied({
    ip: opts.ip,
    ua: opts.userAgent,
    fp: opts.trustedDeviceFingerprint,
    email: opts.session?.user?.email ?? undefined,
  });

  // Stranger floor.
  const stranger = STRANGER_BASE({ ipHash, userAgent, lockedDown: lockdown.engaged, denied });

  if (denied || lockdown.engaged || !opts.session?.user?.email) {
    // For denied/lockdown we keep STRANGER identity and let the pipeline gate.
    return stranger;
  }

  const email = opts.session.user.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.suspended) return stranger;

  const isOwner = user.identity === "OWNER" && email === OWNER_EMAIL;
  const isPepper = user.identity === "PEPPER";

  let isTrustedDevice = false;
  if (opts.trustedDeviceFingerprint) {
    const fpHash = hashOpaque(opts.trustedDeviceFingerprint, "device");
    const device = await prisma.trustedDevice.findUnique({ where: { fingerprintHash: fpHash } });
    isTrustedDevice = !!device && device.trusted && !device.revokedAt;
  }

  // Pepper rung mapping.
  const pepperRung =
    user.pepperTrust === "PEPPER_PRIMARY"   ? PepperRung.PRIMARY :
    user.pepperTrust === "PEPPER_HOUSEHOLD" ? PepperRung.HOUSEHOLD :
    user.pepperTrust === "PEPPER_TRUSTED"   ? PepperRung.TRUSTED :
    user.pepperTrust === "PEPPER_BASIC"     ? PepperRung.BASIC :
                                              PepperRung.NONE;

  // Owner ladder mapping. Conservative.
  let authorizationLevel: TrustContext["authorizationLevel"] = PermissionLevel.BASIC_AUTH;
  if (isOwner) {
    authorizationLevel = isTrustedDevice
      ? PermissionLevel.STRONG_VERIFIED
      : PermissionLevel.BASIC_AUTH;
  } else if (user.identity === "DELEGATE") {
    authorizationLevel = isTrustedDevice
      ? PermissionLevel.TRUSTED_SESSION
      : PermissionLevel.BASIC_AUTH;
  } else if (user.identity === "PEPPER" || user.identity === "GUEST") {
    authorizationLevel = PermissionLevel.BASIC_AUTH;
  } else {
    // ADVERSARY or unknown enum: strangerize.
    return STRANGER_BASE({ ipHash, userAgent, lockedDown: false, denied: true, identity: "ADVERSARY" });
  }

  const riskScore =
    isOwner       ? (isTrustedDevice ? 10 : 35) :
    isPepper      ? 25 :
    user.identity === "DELEGATE" ? 40 :
    user.identity === "GUEST"    ? 55 :
                                   80;

  return {
    userId: user.id,
    sessionId: null,
    identity: user.identity,
    isAuthenticated: true,
    isOwner,
    isPepper,
    pepperRung,
    isTrustedDevice,
    voiceVerified: false,
    strongVerified: isOwner && isTrustedDevice,
    riskScore,
    authorizationLevel,
    ipHash,
    userAgent,
    lockedDown: false,
    denied: false,
    adversaryScore: 0,
  };
}
