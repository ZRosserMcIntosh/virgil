import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ message: "Access denied." }, { status: 403 });
  const owner = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!owner || owner.identity !== "OWNER") return NextResponse.json({ message: "Access denied." }, { status: 403 });

  const inferences = await prisma.virgilMemoryInference.findMany({
    where: { userId: owner.id, status: "PENDING_REVIEW" },
    include: { question: { select: { question: true, domain: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(inferences);
}
