import { NextRequest, NextResponse } from "next/server";
import { generateDemoForLead } from "@/lib/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Genera (o rigenera) la demo del lead.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { slug } = await generateDemoForLead(id);
    return NextResponse.json({ ok: true, slug, url: `/demo/${slug}` });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
