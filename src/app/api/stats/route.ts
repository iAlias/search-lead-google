import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [campaigns, total, byStatus, withEmail, withPhone, replied, won] = await Promise.all([
    prisma.campaign.count(),
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.count({ where: { email: { not: null } } }),
    prisma.lead.count({ where: { phoneWa: { not: null } } }),
    prisma.lead.count({ where: { repliedAt: { not: null } } }),
    prisma.lead.count({ where: { outcome: "won" } }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const s of byStatus) statusMap[s.status] = s._count;

  const emailSent = (statusMap.email_sent || 0) + (statusMap.wa_sent || 0) + (statusMap.replied || 0) + (statusMap.won || 0) + (statusMap.lost || 0);

  return NextResponse.json({
    campaigns,
    total,
    withEmail,
    withPhone,
    replied,
    won,
    emailSent,
    statusMap,
  });
}
