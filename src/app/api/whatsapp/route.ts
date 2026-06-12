import { NextRequest, NextResponse } from "next/server";
import { getWaStatus, initWhatsApp, logoutWhatsApp } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getWaStatus());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "init");

  if (action === "logout") {
    await logoutWhatsApp();
    return NextResponse.json(getWaStatus());
  }

  // init: avvia il client (non blocca; lo stato/QR si leggono via GET in polling)
  initWhatsApp().catch((e) => console.error("wa init:", e));
  return NextResponse.json(getWaStatus());
}
