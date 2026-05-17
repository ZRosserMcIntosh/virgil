/**
 * GET  /api/contacts?q=...
 * POST /api/contacts  { name, email?, phone?, role?, company?, notes?, birthday?, tags? }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const where: Record<string, any> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  const contacts = await (prisma as any).contact.findMany({
    where,
    orderBy: [{ name: "asc" }],
    take: 100,
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const contact = await (prisma as any).contact.create({
    data: {
      name: body.name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      role: body.role ?? null,
      company: body.company ?? null,
      notes: body.notes ?? null,
      birthday: body.birthday ?? null,
      tags: body.tags ?? [],
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
