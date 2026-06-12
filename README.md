# Lead Machine

**Trova attività locali → genera una demo col loro nome e dati reali → contattale via email + WhatsApp. In automatico.**

Inserisci `ristorante` + `Catania` (o `Sicilia`, o `Italia`) e il tool cerca le attività su Google,
recupera **telefono ed email**, capisce chi **non ha un sito o ce l'ha scadente**, e prepara per ognuna
una **demo personalizzata** pronta da mostrare. Poi invii email e follow-up WhatsApp con un clic.

Niente porta a porta.

---

## Avvio (3 comandi)

Richiede Node.js ≥ 20.

```bash
npm install          # installa tutto (scarica anche Chromium per lo scraping)
npm run db:push      # crea il database SQLite
npm run dev          # http://localhost:3000
```

Apri **http://localhost:3000**, scrivi tipo attività + luogo, premi **Avvia ricerca**.

---

## Come funziona (il flusso)

1. **Cerca** (home): tipo attività + città/regione/nazione → lista di attività con telefono, email, stato del sito.
2. **Lead**: spunti i migliori (sito assente/scadente = più vendibili), premi **Genera demo**, poi **Approva**.
3. **Lancia invio**: email a chi ha un indirizzo; dopo N giorni senza risposta parte il follow-up WhatsApp.
4. La demo è una pagina pubblica `/demo/...` con i **dati reali** dell'attività e una CTA che porta a te.

---

## Configurazione (`.env`)

Tutto è opzionale e **degrada con grazia**: il tool funziona anche senza chiavi.

| Variabile | Serve per | Senza |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | motore di ricerca veloce e completo (orari, recensioni, foto) | usa lo **scraping diretto di Google Maps** via Puppeteer (più lento, nessuna chiave) |
| `RESEND_API_KEY` + `EMAIL_FROM` | inviare email reali | le email vengono solo **registrate in console** (dry-run) |
| `ANTHROPIC_API_KEY` | testi della demo scritti dall'AI | testo segnaposto credibile per categoria |

### Google Places API (consigliato)
Crea una chiave su [console.cloud.google.com](https://console.cloud.google.com) → abilita **"Places API (New)"**.
Google offre crediti gratuiti generosi. Con la chiave ottieni anche orari, recensioni e foto reali nelle demo.

### Resend (per inviare davvero)
Registrati su [resend.com](https://resend.com) → API Keys. 100 email/giorno gratis. Verifica il tuo dominio mittente.

---

## WhatsApp

Pagina **WhatsApp** → **Connetti** → scansiona il QR con WhatsApp (Dispositivi collegati).
Metodo non ufficiale (`whatsapp-web.js`): **tieni il PC acceso** durante gli invii e rispetta i limiti
giornalieri (Impostazioni) per evitare blocchi. Ritardo anti-ban 30-90s tra messaggi, già attivo.

---

## Limiti e note oneste

- **Places API**: max ~60 risultati per query. Per coprire una città grande, lancia più ricerche con
  tipi diversi (pizzeria, trattoria, ristorante…).
- **Scraping Maps**: dipende dal layout di Google, può rallentare o saltare qualche scheda. La Places
  API è più affidabile.
- **Email**: trovata scrapando il sito dell'attività. Chi non ha sito → solo WhatsApp.
- **GDPR**: i dati sono pubblici (Google, siti aziendali). Ogni email include "rispondi STOP".
  Per un uso continuativo come professionista, regolati con P.IVA e informativa.
- I dati di esempio NON esistono: tutto ciò che vedi è reale, preso al momento.

---

## Impostazioni utili

In **Impostazioni**: il tuo nome e numero (per la CTA nelle demo), il listino mostrato, i testi di
email e WhatsApp (con segnaposto `{{nome}} {{citta}} {{demo}} {{prezzo}} {{venditore}}`), e i limiti
giornalieri di invio.

---

## Stack

Next.js 15 (App Router) · Prisma + SQLite · Google Places API / Puppeteer · Resend · whatsapp-web.js · Anthropic (opzionale).
