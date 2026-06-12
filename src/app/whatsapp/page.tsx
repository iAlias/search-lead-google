"use client";

import { useCallback, useEffect, useState } from "react";

interface WaStatus {
  state: string;
  qr: string | null;
  error: string | null;
}

const LABEL: Record<string, string> = {
  disconnected: "Disconnesso",
  initializing: "Avvio in corso…",
  qr: "Scansiona il QR",
  authenticated: "Autenticato…",
  ready: "Connesso ✅",
  error: "Errore",
};

export default function WhatsAppPage() {
  const [st, setSt] = useState<WaStatus>({ state: "disconnected", qr: null, error: null });
  const [busy, setBusy] = useState(false);

  const poll = useCallback(async () => {
    const s = await fetch("/api/whatsapp").then((r) => r.json());
    setSt(s);
  }, []);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [poll]);

  async function connect() {
    setBusy(true);
    await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "init" }) });
    setBusy(false);
  }
  async function logout() {
    setBusy(true);
    await fetch("/api/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    await poll();
    setBusy(false);
  }

  return (
    <div>
      <h1>WhatsApp</h1>
      <p className="sub">
        Collega il tuo WhatsApp per inviare i follow-up automatici. Metodo non ufficiale: tieni
        questo PC acceso durante gli invii. Limita i messaggi per evitare blocchi (vedi Impostazioni).
      </p>

      <div className="panel" style={{ textAlign: "center", maxWidth: 460 }}>
        <div style={{ marginBottom: 16 }}>
          Stato: <span className={`tag ${st.state === "ready" ? "green" : st.state === "error" ? "none" : "blue"}`}>{LABEL[st.state] || st.state}</span>
        </div>

        {st.error && <div className="notice err">{st.error}</div>}

        {st.state === "qr" && st.qr && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={st.qr} alt="QR WhatsApp" style={{ width: 280, height: 280, background: "#fff", padding: 10, borderRadius: 12 }} />
            <p className="muted" style={{ fontSize: ".85rem", marginTop: 12 }}>
              WhatsApp → Impostazioni → Dispositivi collegati → Collega un dispositivo
            </p>
          </div>
        )}

        {st.state === "ready" ? (
          <button className="btn red" disabled={busy} onClick={logout}>Disconnetti</button>
        ) : (
          <button className="btn" disabled={busy || st.state === "initializing"} onClick={connect}>
            {busy || st.state === "initializing" ? <span className="spinner" /> : "🔌"} Connetti WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
