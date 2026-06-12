"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Lead {
  id: string;
  name: string;
  category: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  emailSource?: string | null;
  website?: string | null;
  websiteStatus: string;
  rating?: number | null;
  reviewCount: number;
  outreachChannel: string;
  status: string;
  demoSlug?: string | null;
}

const WS_TAG: Record<string, string> = { none: "none", bad: "bad", good: "good" };
const WS_LABEL: Record<string, string> = { none: "nessun sito", bad: "sito scadente", good: "ha sito ok" };
const ST_TAG: Record<string, string> = {
  scraped: "gray", demo_ready: "blue", approved: "blue",
  email_sent: "good", wa_sent: "good", replied: "green", won: "green", lost: "none", skipped: "gray",
};

function LeadsInner() {
  const sp = useSearchParams();
  const campaignId = sp.get("campaignId") || "";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [onlyLeads, setOnlyLeads] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [msg, setMsg] = useState<{ kind: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (campaignId) q.set("campaignId", campaignId);
    if (onlyLeads) q.set("onlyLeads", "1");
    if (statusFilter) q.set("status", statusFilter);
    const data = await fetch(`/api/leads?${q}`).then((r) => r.json());
    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [campaignId, onlyLeads, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSel((s) => (s.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  async function bulk(action: string) {
    if (!sel.size) return;
    setBusy(true);
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [...sel], action }),
    });
    setSel(new Set());
    await load();
    setBusy(false);
  }

  async function genDemos() {
    if (!sel.size) return;
    setBusy(true);
    setMsg({ kind: "", text: `Genero ${sel.size} demo…` });
    let ok = 0;
    for (const id of sel) {
      const r = await fetch(`/api/leads/${id}/demo`, { method: "POST" });
      if (r.ok) ok++;
    }
    setMsg({ kind: "ok", text: `${ok} demo generate.` });
    setSel(new Set());
    await load();
    setBusy(false);
  }

  async function runOutreach() {
    setBusy(true);
    setMsg({ kind: "", text: "Invio in corso…" });
    const r = await fetch("/api/outreach/run", { method: "POST" });
    const d = await r.json();
    if (r.ok) {
      setMsg({ kind: "ok", text: `Email inviate: ${d.emailsSent} · WhatsApp: ${d.waSent} · saltati: ${d.skipped}${d.errors?.length ? " · errori: " + d.errors.slice(0, 3).join("; ") : ""}` });
    } else {
      setMsg({ kind: "err", text: d.error || "Errore" });
    }
    await load();
    setBusy(false);
  }

  return (
    <div>
      <h1>Lead</h1>
      <p className="sub">
        Approva i lead buoni, genera le demo, poi lancia l&apos;invio. I lead con sito assente o
        scadente sono i più vendibili.
      </p>

      {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

      <div className="toolbar">
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          <input type="checkbox" style={{ width: "auto" }} checked={onlyLeads} onChange={(e) => setOnlyLeads(e.target.checked)} />
          Solo senza sito / sito scadente
        </label>
        <select style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tutti gli stati</option>
          <option value="scraped">Da valutare</option>
          <option value="demo_ready">Demo pronta</option>
          <option value="approved">Approvati</option>
          <option value="email_sent">Email inviata</option>
          <option value="wa_sent">WhatsApp inviato</option>
          <option value="replied">Hanno risposto</option>
          <option value="won">Clienti</option>
          <option value="skipped">Scartati</option>
        </select>
        <div className="grow" />
        <a className="btn ghost sm" href={`/api/leads/export${campaignId ? `?campaignId=${campaignId}` : ""}`}>⬇ CSV</a>
        <button className="btn green sm" disabled={busy} onClick={runOutreach}>🚀 Lancia invio</button>
      </div>

      <div className="toolbar">
        <span className="muted">{sel.size} selezionati</span>
        <button className="btn sm" disabled={!sel.size || busy} onClick={() => bulk("approve")}>✓ Approva</button>
        <button className="btn sm" disabled={!sel.size || busy} onClick={genDemos}>🎨 Genera demo</button>
        <button className="btn ghost sm" disabled={!sel.size || busy} onClick={() => bulk("skip")}>Scarta</button>
        <button className="btn ghost sm" disabled={!sel.size || busy} onClick={() => bulk("won")}>🎉 Cliente</button>
      </div>

      {loading ? (
        <p><span className="spinner" /> Carico…</p>
      ) : leads.length === 0 ? (
        <p className="muted">Nessun lead. Avvia una ricerca dalla home, o togli il filtro.</p>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 30 }}><input type="checkbox" style={{ width: "auto" }} checked={sel.size === leads.length && leads.length > 0} onChange={toggleAll} /></th>
                <th>Attività</th>
                <th>Contatti</th>
                <th>Sito</th>
                <th>Recensioni</th>
                <th>Stato</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td><input type="checkbox" style={{ width: "auto" }} checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
                  <td>
                    <Link href={`/leads/${l.id}`}><b>{l.name}</b></Link>
                    <div className="muted" style={{ fontSize: ".78rem" }}>{l.city} · {l.category}</div>
                  </td>
                  <td style={{ fontSize: ".82rem" }}>
                    {l.phone ? <div>📞 {l.phone}</div> : <span className="muted">no tel</span>}
                    {l.email ? <div>✉ {l.email}</div> : <div className="muted">no email</div>}
                  </td>
                  <td><span className={`tag ${WS_TAG[l.websiteStatus] || "gray"}`}>{WS_LABEL[l.websiteStatus] || l.websiteStatus}</span></td>
                  <td>{l.rating ? `⭐ ${l.rating.toFixed(1)} (${l.reviewCount})` : <span className="muted">—</span>}</td>
                  <td><span className={`tag ${ST_TAG[l.status] || "gray"}`}>{l.status}</span></td>
                  <td className="right">
                    {l.demoSlug && <a className="btn ghost sm" href={`/demo/${l.demoSlug}`} target="_blank" rel="noopener">Demo ↗</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<p><span className="spinner" /> Carico…</p>}>
      <LeadsInner />
    </Suspense>
  );
}
