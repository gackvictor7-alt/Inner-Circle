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
```

Umgebungsvariablen: `.env.example` nach `.env.local` kopieren
(alle Integrationen folgen in späteren Schritten).

## Struktur

- `src/app/` – Next.js App Router (Routen, Layouts; jede Route mit eigenem
  Server-Wrapper für Metadaten + Client-Content-Komponente)
- `src/components/` – `ui/` Designsystem-Komponenten, `site/` Website-Bausteine
- `src/domains/` – Fachlogik je Produktbereich (A–J, ab Schritt 04+)
- `src/lib/i18n/` – Zentrale DE/EN-Texte (kein Hardcodetext in Komponenten!)
- `src/app/fonts/` – Self-hosted Inter (SIL OFL 1.1)
- `src/lib/auth/`, `src/lib/db/` – Platzhalter bis Schritt 04
- `docs/` – Produktvision, Architektur, Roadmap, Fortschritt

## Regeln (Kurzfassung)

1. Ein Entwicklungsschritt nach dem anderen (`docs/03-roadmap.md`).
2. Jede Phase: bauen → testen → in `docs/04-progress.md` protokollieren.
3. UI-Text nur über `src/lib/i18n` (DE + EN), Light + Dark immer prüfen.
4. Keine erfundenen Nutzer/Transaktionen/Erfolge als echt darstellen.
5. Geheimnisse nur in Env-Variablen, nie im Code.

## Technik

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 ·
PostgreSQL + Prisma (ab Schritt 04) · Auth.js (ab Schritt 04) ·
Stripe (ab Schritt 05) · Vercel-Hosting.
Details: `docs/02-architecture.md`, Entscheidungen: `docs/05-decisions.md`.
