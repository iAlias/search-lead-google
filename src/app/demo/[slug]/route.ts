import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Serve la demo come HTML standalone (fuori dal layout della dashboard).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lead = await prisma.lead.findUnique({ where: { demoSlug: slug } });

  if (!lead || !lead.demoHtml) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><body style="font-family:sans-serif;text-align:center;padding:80px;color:#555">
       <h1>Demo non trovata</h1><p>Questa demo non esiste o non e ancora stata generata.</p></body>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new Response(lead.demoHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
