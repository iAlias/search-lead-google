import { prisma } from "./db";

export const DEFAULT_EMAIL_BODY = `Buongiorno,

ho visto che {{nome}} non ha ancora un sito web aggiornato e ho preparato una demo usando i vostri dati reali (foto, orari, recensioni Google).

La trova qui sotto: e gia pronta, posso metterla online sul vostro dominio in 48 ore.

Un sito cosi: {{prezzo}}.

Mi risponda a questa email o mi scriva su WhatsApp, le mostro tutto senza impegno.

{{venditore}}`;

export const DEFAULT_WA_BODY = `Buongiorno! Le ho scritto qualche giorno fa per il sito di {{nome}}.
Le lascio il link diretto alla demo che ho preparato con i vostri dati reali:
{{demo}}

Sito completo online in 48h, {{prezzo}}. Se le interessa mi risponda qui 🙂
{{venditore}}`;

export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: "singleton" } });
  if (existing) {
    return {
      ...existing,
      emailFrom: existing.emailFrom || process.env.EMAIL_FROM || "",
      emailBody: existing.emailBody || DEFAULT_EMAIL_BODY,
      waBody: existing.waBody || DEFAULT_WA_BODY,
    };
  }
  return prisma.settings.create({
    data: {
      id: "singleton",
      emailFrom: process.env.EMAIL_FROM || "",
      emailBody: DEFAULT_EMAIL_BODY,
      waBody: DEFAULT_WA_BODY,
    },
  });
}

// Sostituisce i segnaposto {{nome}} {{demo}} {{prezzo}} {{venditore}} {{citta}}.
export function fillTemplate(
  tpl: string,
  vars: { nome: string; demo: string; prezzo: string; venditore: string; citta?: string }
): string {
  return tpl
    .replace(/\{\{\s*nome\s*\}\}/g, vars.nome)
    .replace(/\{\{\s*demo\s*\}\}/g, vars.demo)
    .replace(/\{\{\s*prezzo\s*\}\}/g, vars.prezzo)
    .replace(/\{\{\s*venditore\s*\}\}/g, vars.venditore)
    .replace(/\{\{\s*citta\s*\}\}/g, vars.citta || "");
}
