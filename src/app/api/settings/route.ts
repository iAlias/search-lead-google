import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "sellerName", "sellerPhone", "emailFrom", "emailSubject", "emailBody",
    "waBody", "dailyEmailMax", "dailyWaMax", "waFollowupDays", "priceLine",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) {
      if (["dailyEmailMax", "dailyWaMax", "waFollowupDays"].includes(k)) {
        data[k] = Math.max(0, Number(body[k]) || 0);
      } else {
        data[k] = String(body[k] ?? "");
      }
    }
  }

  await getSettings(); // assicura che il singleton esista
  const settings = await prisma.settings.update({ where: { id: "singleton" }, data });
  return NextResponse.json(settings);
}
