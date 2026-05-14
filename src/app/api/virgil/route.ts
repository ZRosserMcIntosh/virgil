import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { buildTrustContext } from "@/lib/auth/trust-context";
import { handleVirgilRequest } from "@/lib/virgil/pipeline";
import { handleVeronicaRequest } from "@/lib/veronica/pipeline";
import { ACCESS_DENIED_MESSAGE } from "@/lib/virgil/constitution";
import { VERONICA_ACCESS_DENIED } from "@/lib/veronica/constitution";
import type { CompanionId } from "@/lib/companions/types";

const Body = z.object({
  input: z.string().min(1).max(8000),
  taskClass: z.string().optional(),
});

export async function POST(req: Request) {
  // Determine which companion handles this request.
  const companionHeader = req.headers.get("x-virgil-companion") ?? "VIRGIL";
  const companion: CompanionId = companionHeader === "VERONICA" ? "VERONICA" : "VIRGIL";
  const accessDenied = companion === "VERONICA" ? VERONICA_ACCESS_DENIED : ACCESS_DENIED_MESSAGE;

  // Parse and validate body. Bad input -> deny silently.
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ message: accessDenied }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const fp = req.headers.get("x-virgil-device") ?? undefined;

  const trust = await buildTrustContext({
    session,
    ip,
    userAgent,
    trustedDeviceFingerprint: fp,
  });

  const response = companion === "VERONICA"
    ? await handleVeronicaRequest({
        input: parsed.input,
        trust,
        taskClass: (parsed.taskClass as never) ?? "CORE_ASSISTANT",
      })
    : await handleVirgilRequest({
        input: parsed.input,
        trust,
        taskClass: (parsed.taskClass as never) ?? "CORE_ASSISTANT",
      });

  return NextResponse.json(response);
}
