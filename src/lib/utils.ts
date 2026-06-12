import { customAlphabet } from "nanoid";

const nano = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 6);

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function makeSlug(name: string, location: string): string {
  const base = [slugify(name), slugify(location)].filter(Boolean).join("-");
  return `${base || "demo"}-${nano()}`;
}

// Normalizza un numero italiano in formato wa.me: 39 + 9/10 cifre, niente +, spazi, prefissi internazionali.
export function normalizePhoneIt(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  d = d.replace(/\D/g, "");
  if (!d) return null;
  // 00 prefisso internazionale → toglilo
  if (d.startsWith("0039")) d = d.slice(2);
  // gia con prefisso 39 e lunghezza plausibile
  if (d.startsWith("39") && d.length >= 11 && d.length <= 13) return d;
  // numero nazionale (cellulare 3xx o fisso 0xx) → aggiungi 39
  if (/^[03]/.test(d) && d.length >= 9 && d.length <= 11) return "39" + d;
  // fallback: se ha gia 39 davanti lascialo, altrimenti aggiungilo
  if (d.startsWith("39")) return d;
  return "39" + d;
}

export function jsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Estrae una citta plausibile da un indirizzo formattato italiano.
export function cityFromAddress(address: string | undefined): string | undefined {
  if (!address) return undefined;
  // formato tipico: "Via Roma 1, 95100 Catania CT, Italia"
  const m = address.match(/\b\d{5}\s+([A-Za-zÀ-ÿ'\s]+?)(?:\s+[A-Z]{2})?(?:,|$)/);
  if (m) return m[1].trim();
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2].replace(/\d{5}/, "").replace(/\s+[A-Z]{2}$/, "").trim();
  return undefined;
}
