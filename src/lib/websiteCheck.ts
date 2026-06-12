// Valuta rapidamente la qualita del sito di un'attivita senza browser:
// scarica l'HTML e applica euristiche (viewport, https, social-only, errori).
// Serve a decidere se l'attivita e un LEAD (sito assente o scadente) o no.

export type WebsiteStatus = "none" | "bad" | "good";

// Domini che NON sono un vero sito: solo social / aggregatori.
const SOCIAL_ONLY = [
  "facebook.com", "instagram.com", "linktr.ee", "wa.me", "business.site",
  "tripadvisor", "thefork", "justeat", "deliveroo", "subito.it",
  "paginegialle", "wixsite.com/", "google.com/maps",
];

export async function checkWebsite(website: string | null | undefined): Promise<WebsiteStatus> {
  if (!website) return "none";

  const lower = website.toLowerCase();
  // Un sito "business.site" di Google o un link social conta come "nessun vero sito".
  if (SOCIAL_ONLY.some((s) => lower.includes(s))) return "bad";

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(website.startsWith("http") ? website : `https://${website}`, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
    });
    clearTimeout(t);

    if (!res.ok) return "bad"; // 404/500/timeout → sito rotto = opportunita
    const html = (await res.text()).slice(0, 200_000);
    const lc = html.toLowerCase();

    let badPoints = 0;
    if (!lc.includes('name="viewport"')) badPoints += 2; // non mobile-friendly
    if (lc.includes("wordpress") && lc.includes("under construction")) badPoints += 3;
    if (lc.includes("sito in costruzione") || lc.includes("coming soon") || lc.includes("default web page")) badPoints += 3;
    if (lc.includes("apache2 ubuntu default") || lc.includes("welcome to nginx")) badPoints += 3;
    if (html.length < 1500) badPoints += 2; // pagina quasi vuota

    return badPoints >= 2 ? "bad" : "good";
  } catch {
    // irraggiungibile / certificato scaduto → opportunita
    return "bad";
  }
}
