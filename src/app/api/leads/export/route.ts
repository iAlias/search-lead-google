import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaignId") || undefined;
  const leads = await prisma.lead.findMany({
    where: campaignId ? { campaignId } : {},
    orderBy: { createdAt: "desc" },
  });

  const headers = ["nome", "categoria", "citta", "indirizzo", "telefono", "email", "fonte_email", "sito", "stato_sito", "rating", "recensioni", "canale", "stato", "demo"];
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const rows = leads.map((l) =>
    [
      l.name, l.category, l.city, l.address, l.phone, l.email, l.emailSource,
      l.website, l.websiteStatus, l.rating, l.reviewCount, l.outreachChannel, l.status,
      l.demoSlug ? `${base}/demo/${l.demoSlug}` : "",
    ].map(csvCell).join(";")
  );

  const csv = "﻿" + [headers.join(";"), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads.csv"`,
    },
  });
}
