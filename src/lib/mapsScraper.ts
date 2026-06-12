import type { RawLead } from "./types";
import { cityFromAddress } from "./utils";

// Fallback senza chiave API: scraping diretto di Google Maps con Puppeteer.
// Piu lento e fragile della Places API, ma non richiede credenziali.
// Puppeteer e caricato in modo lazy: se non e installato, l'errore e chiaro.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadPuppeteer(): Promise<any> {
  try {
    const mod = await import("puppeteer");
    return mod.default ?? mod;
  } catch {
    throw new Error(
      "Puppeteer non installato. Esegui `npm install` oppure imposta GOOGLE_PLACES_API_KEY per usare il motore Places."
    );
  }
}

export async function scrapeMaps(
  businessType: string,
  location: string,
  target = 60
): Promise<RawLead[]> {
  const puppeteer = await loadPuppeteer();
  const query = `${businessType} a ${location}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}/?hl=it`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=it-IT"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

    // Accetta il banner consensi se presente.
    try {
      await page.waitForSelector('button[aria-label*="Accetta"], button[aria-label*="Accept"], form[action*="consent"] button', { timeout: 5000 });
      await page.click('button[aria-label*="Accetta"], button[aria-label*="Accept"], form[action*="consent"] button').catch(() => {});
      await new Promise((r) => setTimeout(r, 1500));
    } catch {
      /* nessun banner */
    }

    const feedSel = 'div[role="feed"]';
    await page.waitForSelector(feedSel, { timeout: 20000 }).catch(() => {});

    // Scroll del pannello risultati per caricare piu attivita.
    let stable = 0;
    let lastCount = 0;
    for (let i = 0; i < 25 && stable < 3; i++) {
      const count = await page.evaluate((sel: string) => {
        const feed = document.querySelector(sel);
        if (feed) feed.scrollTop = feed.scrollHeight;
        return document.querySelectorAll('a[href*="/maps/place/"]').length;
      }, feedSel);
      if (count >= target) break;
      if (count === lastCount) stable++;
      else stable = 0;
      lastCount = count;
      await new Promise((r) => setTimeout(r, 1600));
    }

    // Raccoglie i link alle schede.
    const placeLinks: string[] = await page.evaluate(() => {
      const set = new Set<string>();
      document.querySelectorAll('a[href*="/maps/place/"]').forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        if (href) set.add(href);
      });
      return [...set];
    });

    const links = placeLinks.slice(0, target);
    const out: RawLead[] = [];

    for (const link of links) {
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForSelector("h1", { timeout: 8000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));

        const data = await page.evaluate(() => {
          const txt = (sel: string) => document.querySelector(sel)?.textContent?.trim() || "";
          const name = document.querySelector("h1")?.textContent?.trim() || "";

          // Pulsanti info con data-item-id contengono indirizzo, telefono, sito.
          const getByItem = (key: string) => {
            const el = document.querySelector(`button[data-item-id="${key}"], a[data-item-id="${key}"]`);
            return el?.getAttribute("aria-label")?.replace(/^[^:]+:\s*/, "").trim() || "";
          };

          const address = getByItem("address");
          const phone = (() => {
            const el = document.querySelector('button[data-item-id^="phone"]');
            return el?.getAttribute("aria-label")?.replace(/^[^:]+:\s*/, "").trim() || "";
          })();
          const websiteEl = document.querySelector('a[data-item-id="authority"]') as HTMLAnchorElement | null;
          const website = websiteEl?.href || "";

          // rating + numero recensioni (la struttura Maps varia, piu fallback)
          const ratingTxt = txt('div.F7nice span[aria-hidden="true"]') || txt('span.ceNzKf');
          const rating = parseFloat((ratingTxt || "").replace(",", ".")) || undefined;
          const reviewTxt =
            document.querySelector('div.F7nice')?.textContent ||
            document.querySelector('button[aria-label*="recensioni"]')?.getAttribute("aria-label") ||
            document.querySelector('button[aria-label*="recensione"]')?.getAttribute("aria-label") ||
            document.querySelector('button[jsaction*="reviewChart"]')?.textContent ||
            "";
          // cerca un numero tra parentesi o seguito da "recensioni"
          const reviewMatch =
            reviewTxt.match(/\(([\d.,]+)\)/) ||
            reviewTxt.match(/([\d.,]+)\s*recension/i);
          const reviewCount = parseInt((reviewMatch?.[1] || "0").replace(/[.,]/g, ""), 10) || 0;

          // foto hero
          const photos: string[] = [];
          document.querySelectorAll('button img[src*="googleusercontent"], img[src*="googleusercontent"]').forEach((img) => {
            const src = (img as HTMLImageElement).src;
            if (src && photos.length < 4) photos.push(src.replace(/=w\d+-h\d+/, "=w1600-h900"));
          });

          return { name, address, phone, website, rating, reviewCount, photos };
        });

        if (!data.name) continue;
        out.push({
          name: data.name,
          address: data.address || undefined,
          city: cityFromAddress(data.address || undefined) || location,
          phone: data.phone || undefined,
          website: data.website || undefined,
          rating: data.rating,
          reviewCount: data.reviewCount,
          photos: data.photos || [],
          hours: null,
          topReviews: [],
        });
      } catch {
        /* salta scheda problematica */
      }
    }

    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}
