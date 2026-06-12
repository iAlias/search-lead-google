import type { Category } from "./types";

// Mappa parole chiave italiane → categoria interna, per scegliere il template demo.
const RULES: Array<{ cat: Category; words: string[] }> = [
  { cat: "ristorante", words: ["ristorant", "trattoria", "pizzeri", "osteria", "agriturism", "tavola calda", "rosticceri", "braceria", "sushi"] },
  { cat: "bar", words: ["bar", "caffe", "caffetteria", "pasticceri", "gelateri", "pub", "birreria", "enoteca"] },
  { cat: "parrucchiere", words: ["parrucchier", "barbier", "hair", "acconciat"] },
  { cat: "estetista", words: ["estetist", "centro estetico", "beauty", "nail", "spa", "benessere", "massagg"] },
  { cat: "officina", words: ["officina", "autoriparaz", "gommista", "carrozzeri", "meccanic", "autolavagg", "elettrauto"] },
  { cat: "hotel", words: ["hotel", "b&b", "bed and breakfast", "albergo", "affittacamere", "residence", "pensione"] },
  { cat: "studio_professionale", words: ["studio", "avvocat", "commercialist", "geometr", "architett", "ingegner", "notaio", "dentist", "medico", "fisioterap", "consulen"] },
  { cat: "negozio", words: ["negozio", "boutique", "abbigliament", "ferrament", "ottica", "gioielleri", "fioraio", "libreria", "cartoleri", "store", "shop", "macelleri", "panifici", "alimentari"] },
];

export function detectCategory(input: string): Category {
  const s = (input || "").toLowerCase();
  for (const rule of RULES) {
    if (rule.words.some((w) => s.includes(w))) return rule.cat;
  }
  return "generico";
}

export const CATEGORY_LABEL: Record<Category, string> = {
  ristorante: "Ristorante",
  bar: "Bar / Caffetteria",
  negozio: "Negozio",
  parrucchiere: "Parrucchiere / Barbiere",
  estetista: "Centro estetico",
  studio_professionale: "Studio professionale",
  officina: "Officina / Auto",
  hotel: "Hotel / B&B",
  generico: "Attività",
};
