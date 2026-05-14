import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { buildTrustContext } from "@/lib/auth/trust-context";
import { headers } from "next/headers";
import NavShell from "./NavShell";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const h = await headers();
  const trust = await buildTrustContext({
    session,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  });

  // Outsider somehow holding a session? Send them away with no detail.
  if (!trust.isOwner) redirect("/login");

  const trustSummary = {
    authorizationLevel: trust.authorizationLevel,
    isTrustedDevice:    trust.isTrustedDevice,
    strongVerified:     trust.strongVerified,
    riskScore:          trust.riskScore,
  };

  return (
    <NavShell trust={trustSummary}>
      {children}
    </NavShell>
  );
}
