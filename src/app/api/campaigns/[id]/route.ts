import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runCampaign } from "@/lib/scrape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { leads: true } } },
  });
  if (!campaign) return NextResponse.json({ error: "Non trovata" }, { status: 404 });
  return NextResponse.json(campaign);
}

// Re-scan della campagna.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return NextResponse.json({ error: "Non trovata" }, { status: 404 });

  runCampaign(id).catch((e) => console.error("rerun error:", e));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.campaign.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
