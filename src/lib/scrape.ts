import { prisma } from "./db";
import { searchPlaces, hasPlacesKey } from "./places";
import { scrapeMaps } from "./mapsScraper";
import { scrapeEmail } from "./emailScraper";
import { checkWebsite } from "./websiteCheck";
import { detectCategory } from "./category";
import { normalizePhoneIt } from "./utils";
import type { RawLead } from "./types";

// Concorrenza limitata per l'arricchimento (controllo sito + email).
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Esegue una campagna: cerca le attivita, filtra quelle senza sito buono,
 * arricchisce con email + stato sito, salva i lead nel DB.
 */
export async function runCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campagna non trovata");

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "running", error: null },
  });

  try {
    // 1. Scelta motore.
    const engine =
      campaign.engine === "places" || (campaign.engine === "auto" && hasPlacesKey())
        ? "places"
        : "scrape";

    let raw: RawLead[];
    if (engine === "places") {
      raw = await searchPlaces(campaign.businessType, campaign.location, campaign.targetCount);
    } else {
      raw = await scrapeMaps(campaign.businessType, campaign.location, campaign.targetCount);
    }

    // 2. Dedup per nome+indirizzo.
    const seen = new Set<string>();
    raw = raw.filter((r) => {
      const k = (r.name + "|" + (r.address || "")).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // 3. Arricchimento: stato sito + email (in parallelo, max 5 alla volta).
    const enriched = await mapLimit(raw, 5, async (r) => {
      const websiteStatus = await checkWebsite(r.website);
      let email: string | null = null;
      let emailSource = "none";
      // Cerca email solo se ha un sito (da li la si scrapa).
      if (r.website && websiteStatus !== "none") {
        const found = await scrapeEmail(r.website);
        email = found.email;
        emailSource = found.source;
      }
      return { r, websiteStatus, email, emailSource };
    });

    // 4. Salvataggio. Un lead vale se: sito assente/scadente (e quindi vendibile).
    //    I siti "good" li teniamo comunque ma marchiamo (l'utente filtra in dashboard).
    for (const { r, websiteStatus, email, emailSource } of enriched) {
      const phoneWa = normalizePhoneIt(r.phone);
      const channel =
        email && phoneWa
          ? "email_and_wa"
          : email
            ? "email_only"
            : phoneWa
              ? "whatsapp_only"
              : "none";

      await prisma.lead.upsert({
        where: { placeId: r.placeId || `noid-${campaignId}-${r.name}-${r.address || ""}` },
        create: {
          campaignId,
          placeId: r.placeId || `noid-${campaignId}-${r.name}-${r.address || ""}`,
          name: r.name,
          category: detectCategory(campaign.businessType + " " + r.name),
          address: r.address,
          city: r.city || campaign.location,
          phone: r.phone,
          phoneWa,
          email,
          emailSource,
          website: r.website,
          websiteStatus,
          rating: r.rating,
          reviewCount: r.reviewCount || 0,
          photos: JSON.stringify(r.photos || []),
          hours: r.hours ? JSON.stringify(r.hours) : null,
          topReviews: JSON.stringify(r.topReviews || []),
          lat: r.lat,
          lng: r.lng,
          outreachChannel: channel,
          status: "scraped",
        },
        update: {
          // refresh dei dati su re-scan
          phone: r.phone,
          phoneWa,
          email: email ?? undefined,
          emailSource,
          website: r.website,
          websiteStatus,
          rating: r.rating,
          reviewCount: r.reviewCount || 0,
          photos: JSON.stringify(r.photos || []),
          hours: r.hours ? JSON.stringify(r.hours) : null,
          topReviews: JSON.stringify(r.topReviews || []),
        },
      });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "done", engine },
    });
  } catch (e) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "failed", error: (e as Error).message },
    });
    throw e;
  }
}
