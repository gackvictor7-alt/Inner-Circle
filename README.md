# INNER CIRCLE (Arbeitsname)

Digitales Business-Ökosystem: Netzwerk, Geschäfte, Wissen,
Kapitalzugang und Erlebnisse in einer Plattform.
**Leitprinzip: Zugang schafft Chancen.**

> Stand: **Schritt 02 – Designsystem & öffentliche Website**.
> Die Startseite ist die hochwertige öffentliche Marken- und
> Produktpräsentation; nicht aktivierte Funktionen sind als
> „Demnächst verfügbar“ gekennzeichnet.
> Verbindliche Spezifikation: [`docs/`](docs/00-overview.md).

## Schnellstart

Voraussetzung: Node.js ≥ 20.

```bash
npm install
npm run dev     # http://localhost:3000 (bindet 0.0.0.0)
npm run build   # Produktions-Build prüfen
npm run lint    # Lint prüfen
npm test        # Unit- + Integrationstests (Wegwerf-Datenbank)
```

Umgebungsvariablen: `.env.example` nach `.env` kopieren (lokal genügt
`AUTH_SECRET`; alle weiteren Integrationen sind optional und laufen ohne
Schlüssel im gekennzeichneten Dev-Modus). Lokale Datenbank:
`npm run db:push && npm run db:seed`. Verifizierungscodes ohne
E-Mail-Provider: `npm run dev:outbox` (Dev-Postausgang, nie echt versendet).

## Deployment (Cloudflare Workers + D1)

```bash
npm run cf:preview    # App lokal in der Cloudflare-Laufzeit (workerd) + lokale D1
npm run cf:dry-run    # Build + Wrangler-Konfiguration prüfen (kein Upload)
npm run cf:deploy     # Build + Deployment (nach `npx wrangler login`)
```

Produktion läuft als Cloudflare Worker (OpenNext-Adapter) mit einer
D1-Datenbank (Binding `DB`, Migrationen in `drizzle/`). Erstinbetriebnahme,
Secrets, Build-Einstellungen, Admin-Bootstrap und der geschützte Testbetrieb
ohne E-Mail-Provider: `docs/09-deployment.md`.

## Struktur

- `src/app/` – Next.js App Router (Routen, Layouts; jede Route mit eigenem
  Server-Wrapper für Metadaten + Client-Content-Komponente)
- `src/components/` – `ui/` Designsystem-Komponenten, `site/` Website-Bausteine
- `src/domains/` – Fachlogik je Produktbereich (A–J, ab Schritt 04+)
- `src/lib/i18n/` – Zentrale DE/EN-Texte (kein Hardcodetext in Komponenten!)
- `src/app/fonts/` – Self-hosted Inter (SIL OFL 1.1)
- `src/db/` – Drizzle-Schema + Laufzeit-Client (D1 in Workers, libSQL lokal)
- `drizzle/` – versionierte SQL-Migrationen; `scripts/` – Seed, D1-Bootstrap, Admin-Bootstrap
- `wrangler.jsonc`, `open-next.config.ts` – Cloudflare-Worker-Konfiguration
- `docs/` – Produktvision, Architektur, Roadmap, Fortschritt

## Regeln (Kurzfassung)

1. Ein Entwicklungsschritt nach dem anderen (`docs/03-roadmap.md`).
2. Jede Phase: bauen → testen → in `docs/04-progress.md` protokollieren.
3. UI-Text nur über `src/lib/i18n` (DE + EN), Light + Dark immer prüfen.
4. Keine erfundenen Nutzer/Transaktionen/Erfolge als echt darstellen.
5. Geheimnisse nur in Env-Variablen, nie im Code.

## Technik

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 ·
Drizzle ORM (SQLite: Cloudflare D1 in Produktion, libSQL lokal) ·
eigene Session-Auth (scrypt, OTP) · Stripe (Sandbox zuerst) ·
Cloudflare Workers via OpenNext.
Details: `docs/02-architecture.md`, Entscheidungen: `docs/05-decisions.md`.
