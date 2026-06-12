import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const campaignId = sp.get("campaignId") || undefined;
  const status = sp.get("status") || undefined;
  const channel = sp.get("channel") || undefined;
  const onlyLeads = sp.get("onlyLeads"); // "1" → solo sito assente/scadente

  const where: Record<string, unknown> = {};
  if (campaignId) where.campaignId = campaignId;
  if (status) where.status = status;
  if (channel) where.outreachChannel = channel;
  if (onlyLeads === "1") where.websiteStatus = { in: ["none", "bad"] };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ websiteStatus: "asc" }, { reviewCount: "desc" }],
    take: 500,
  });
  return NextResponse.json(leads);
}

// Azioni bulk: approve / skip / reset.
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  const action = String(body.action || "");
  if (!ids.length) return NextResponse.json({ error: "Nessun lead selezionato" }, { status: 400 });

  let data: Record<string, unknown> = {};
  if (action === "approve") data = { status: "approved" };
  else if (action === "skip") data = { status: "skipped" };
  else if (action === "reset") data = { status: "scraped" };
  else if (action === "won") data = { status: "won", outcome: "won" };
  else if (action === "lost") data = { status: "lost", outcome: "lost" };
  else return NextResponse.json({ error: "Azione sconosciuta" }, { status: 400 });

  const res = await prisma.lead.updateMany({ where: { id: { in: ids } }, data });
  return NextResponse.json({ ok: true, count: res.count });
}
