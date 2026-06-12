"use client";

import { useEffect, useState } from "react";

interface Settings {
  sellerName: string; sellerPhone: string; emailFrom: string; emailSubject: string;
  emailBody: string; waBody: string; dailyEmailMax: number; dailyWaMax: number;
  waFollowupDays: number; priceLine: string;
}

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then(setS);
  }, []);

  function up<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((p) => (p ? { ...p, [k]: v } : p));
    setSaved(false);
  }

  async function save() {
    if (!s) return;
    setBusy(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setBusy(false);
    setSaved(true);
  }

  if (!s) return <p><span className="spinner" /> Carico…</p>;

  return (
    <div>
      <h1>Impostazioni</h1>
      <p className="sub">Dati del venditore, messaggi e limiti di invio. I segnaposto disponibili: <code>{"{{nome}} {{citta}} {{demo}} {{prezzo}} {{venditore}}"}</code>.</p>

      {saved && <div className="notice ok">Salvato.</div>}

      <div className="panel">
        <h2>Tu (il venditore)</h2>
        <div className="row">
          <div><label>Nome</label><input value={s.sellerName} onChange={(e) => up("sellerName", e.target.value)} /></div>
          <div><label>Tuo numero WhatsApp (per la CTA nelle demo)</label><input value={s.sellerPhone} onChange={(e) => up("sellerPhone", e.target.value)} placeholder="es. 347 1234567" /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label>Listino / prezzo mostrato</label>
          <input value={s.priceLine} onChange={(e) => up("priceLine", e.target.value)} />
        </div>
      </div>

      <div className="panel">
        <h2>Email</h2>
        <label>Mittente (From)</label>
        <input value={s.emailFrom} onChange={(e) => up("emailFrom", e.target.value)} placeholder="Antonio <antonio@restore.shopping>" />
        <label style={{ marginTop: 14 }}>Oggetto</label>
        <input value={s.emailSubject} onChange={(e) => up("emailSubject", e.target.value)} />
        <label style={{ marginTop: 14 }}>Testo email</label>
        <textarea value={s.emailBody} onChange={(e) => up("emailBody", e.target.value)} style={{ minHeight: 180 }} />
      </div>

      <div className="panel">
        <h2>WhatsApp</h2>
        <label>Testo messaggio</label>
        <textarea value={s.waBody} onChange={(e) => up("waBody", e.target.value)} style={{ minHeight: 140 }} />
      </div>

      <div className="panel">
        <h2>Limiti (anti-blocco)</h2>
        <div className="row">
          <div><label>Max email / giorno</label><input type="number" value={s.dailyEmailMax} onChange={(e) => up("dailyEmailMax", Number(e.target.value))} /></div>
          <div><label>Max WhatsApp / giorno</label><input type="number" value={s.dailyWaMax} onChange={(e) => up("dailyWaMax", Number(e.target.value))} /></div>
          <div><label>Follow-up WhatsApp dopo (giorni)</label><input type="number" value={s.waFollowupDays} onChange={(e) => up("waFollowupDays", Number(e.target.value))} /></div>
        </div>
      </div>

      <button className="btn" disabled={busy} onClick={save}>{busy ? <span className="spinner" /> : "💾"} Salva impostazioni</button>
    </div>
  );
}
