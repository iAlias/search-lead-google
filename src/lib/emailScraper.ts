// Estrae email dal sito web di un'attivita scaricando alcune pagine chiave.
// Pura HTTP fetch, nessuna dipendenza nativa.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Estensioni/parole che indicano falsi positivi (asset, librerie, esempi).
const JUNK = [
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js",
  "example.com", "example.org", "sentry", "wixpress", "@2x", "@3x",
  "domain.com", "email.com", "yourname", "tuonome", "tuodominio",
];

const PATHS = ["", "/contatti", "/contatti.html", "/contact", "/contact-us", "/chi-siamo", "/about", "/azienda", "/dove-siamo"];

interface ScrapeResult {
  email: string | null;
  source: "mailto" | "scraped" | "guessed" | "none";
}

function cleanCandidates(text: string): string[] {
  const found = text.match(EMAIL_RE) || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (let e of found) {
    e = e.toLowerCase().replace(/\.$/, "");
    if (e.length > 64) continue;
    if (JUNK.some((j) => e.includes(j))) continue;
    if (/^[0-9]/.test(e.split("@")[0]) && e.split("@")[0].length > 12) continue; // hash-like
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}

function rankEmails(emails: string[], domain: string): string | null {
  if (!emails.length) return null;
  const score = (e: string) => {
    let s = 0;
    const local = e.split("@")[0];
    const host = e.split("@")[1] || "";
    if (domain && host.includes(domain)) s += 5; // stessa azienda
    if (/^(info|contatti|contact|amministrazione|prenotazioni|booking)/.test(local)) s += 3;
    if (/(gmail|libero|hotmail|yahoo|outlook|tiscali|virgilio|alice|pec)\./.test(host)) s -= 1;
    return s;
  };
  return emails.sort((a, b) => score(b) - score(a))[0];
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("html") && !ct.includes("text")) return null;
    return (await res.text()).slice(0, 600_000);
  } catch {
    return null;
  }
}

function normalizeBase(website: string): { base: string; domain: string } | null {
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return { base: `${u.protocol}//${u.host}`, domain: u.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

/**
 * Scarica fino a poche pagine del sito e tenta di trovare l'email migliore.
 */
export async function scrapeEmail(website: string | null | undefined): Promise<ScrapeResult> {
  if (!website) return { email: null, source: "none" };
  const norm = normalizeBase(website);
  if (!norm) return { email: null, source: "none" };

  const candidates: string[] = [];
  let sawMailto = false;

  for (const path of PATHS) {
    const html = await fetchText(norm.base + path);
    if (!html) continue;

    // mailto: ha priorita (email dichiarata esplicitamente)
    const mailtos = [...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => m[1]);
    if (mailtos.length) {
      sawMailto = true;
      candidates.push(...cleanCandidates(mailtos.join(" ")));
    }
    candidates.push(...cleanCandidates(html));

    // se abbiamo gia trovato un'email sullo stesso dominio, basta
    if (candidates.some((e) => e.includes(norm.domain))) break;
  }

  const best = rankEmails([...new Set(candidates)], norm.domain);
  if (!best) return { email: null, source: "none" };
  return { email: best, source: sawMailto ? "mailto" : "scraped" };
}
