# Entscheidungen (ADR-Log)

Format: **Kontext → Entscheidung → Konsequenz.**
Annahmen sind als solche markiert; geänderte Geschäftsregeln nur mit
Gründer-Freigabe.

## ADR-001: Next.js-Monolith statt Microservices (2026-09-20, Schritt 01)

- **Kontext:** Solo-Gründer ohne Programmiererfahrung, Budget < 500 €,
  KI-gestützte Entwicklung, Web-first.
- **Entscheidung:** Eine Next.js-App (App Router, TypeScript) mit
  Server-Actions/API-Routen, relationale DB, managed Hosting.
- **Konsequenz:** Minimale Betriebskomplexität, eine Codebasis, später
  horizontal skalierbar; kein verteilter System-Overhead.

## ADR-002: PostgreSQL + Prisma ab Schritt 04 (2026-09-20, Schritt 01)

- **Kontext:** Komplexes relationales Modell (Mitglieder, Deals,
  Provisionen), Portabilität wichtig.
- **Entscheidung:** Managed PostgreSQL (Free-Tier, z. B. Neon) + Prisma
  mit versionierten Migrationen.
- **Konsequenz:** Schritt 01–03 ohne DB lauffähig; Schema wächst
  phasengerecht (Plan in `02-architecture.md`).

## ADR-003: Auth.js, keine eigene Krypto (2026-09-20, Schritt 01)

- **Kontext:** Sichere Konten ohne eigenes Sicherheitsrisiko.
- **Entscheidung:** Auth.js (E-Mail+Passwort zuerst, OAuth/2FA später).
- **Konsequenz:** Schnellere, geprüfte Implementierung in Schritt 04.

## ADR-004: Stripe für Abos, Connect-Kandidat für Marktplatz (2026-09-20, Schritt 01)

- **Kontext:** Karten + Apple/Google Pay, Abo-Logik, später Verkäufer-Auszahlungen.
- **Entscheidung:** Stripe (Testmodus zuerst); Marktplatz-Anbieter
  final in Schritt 12 (Kandidat: Stripe Connect). PayPal als Ergänzung
  evaluieren, sobald Abo-Flow steht.
- **Konsequenz:** Keine eigene Zahlungsinfrastruktur; Abo-Status nur
  per verifizierte Webhooks.

## ADR-005: Eigenes i18n-Wörterbuch statt next-intl (2026-09-20, Schritt 01)

- **Kontext:** DE/EN-Pflicht ab Tag 1, geringe Komplexität, keine
  lokalisierten Routen nötig im Fundament.
- **Entscheidung:** Leichtgewichtiges zentrales Wörterbuch
  (`src/lib/i18n`) mit Provider; Umstieg auf Routing-basiertes i18n
  in Schritt 03 möglich, falls nötig.
- **Konsequenz:** Keine zusätzliche Abhängigkeit; Regel „kein
  Hardcodetext" gilt ab sofort.

## ADR-006: Eigenes Theme-Modul (2026-09-20, Schritt 01)

- **Kontext:** Light/Dark-Pflicht, persistiert, ohne Lade-Blitzen.
- **Entscheidung:** Eigener `ThemeProvider` + Blocking-Init-Script statt
  Fremdpaket.
- **Konsequenz:** Volle Kontrolle, keine Abhängigkeit.

## ADR-007: Vercel als Hosting-Ziel (2026-09-20, Schritt 01)

- **Kontext:** Null DevOps, Preview-Deployments, Next.js-nativ.
- **Entscheidung:** Vercel (Free-Tier → Pro bei Wachstum).
- **Konsequenz:** Deployment ab Schritt 03 sinnvoll (öffentliche Seite);
  Kostenentscheidung bei Launch (`07-external-services.md`).

## ADR-008: Cloudflare Workers + D1 statt Vercel/PostgreSQL (2026-09-20, Sprint 2.0)

- **Kontext:** Der erste Cloudflare-Deploy scheiterte („Could not detect a
  directory containing static files“), weil das Projekt als statische
  Seite ohne Worker-Konfiguration angebunden war. Die Plattform ist
  vollständig serverseitig dynamisch (Session-Cookie auf jeder Route) und
  nutzt bereits SQLite (Drizzle/libSQL, ADR-002 damit überholt).
- **Entscheidung:** Hosting auf **Cloudflare Workers** über den
  OpenNext-Adapter (`@opennextjs/cloudflare`, `wrangler.jsonc`,
  `open-next.config.ts`); Produktionsdatenbank **Cloudflare D1**
  (SQLite-kompatibel, Binding `DB`). `src/db/client.ts` wählt den Treiber
  zur Laufzeit (D1 in `workerd`, libSQL in Node.js), sodass Dev, Tests
  und Produktion denselben Code und dasselbe Schema nutzen. Migrationen
  liegen versioniert in `drizzle/` und werden mit
  `wrangler d1 migrations apply` eingespielt.
- **Konsequenz:** Kein separater DB-Anbieter, alles in einem Konto und
  im Free-Tier startbar; kein R2/Queue nötig (kein ISR). Erster Admin
  wird per `scripts/admin-bootstrap.ts` befördert, Basistaxonomie per
  `scripts/d1-bootstrap.ts` eingespielt – der Demo-Seed bleibt
  Entwicklung. Grenzen: D1 hat kein Transaktions-API (die App nutzt
  keine Transaktionen); Bildoptimierung bewusst deaktiviert.
  ADR-007 (Vercel) ist damit ersetzt.

## ADR-009: Kein stiller Nachrichtenverlust – Dev-Postausgang nur explizit, admin-only, mit Allowlist (2026-09-21)

- **Kontext:** Auf dem ersten Cloudflare-Deploy gab es weder `RESEND_API_KEY`
  noch `ENABLE_DEV_OUTBOX`. Der Transport meldete trotzdem „dev“, die UI
  verlinkte einen Postausgang, der in Produktion bewusst 404 liefert, und
  Verifizierungscodes gingen unbemerkt verloren. Gleichzeitig darf ein
  öffentlich erreichbarer Worker niemals einen frei zugänglichen Postausgang
  mit den Codes aller Nutzer zeigen.
- **Entscheidung:**
  1. Der Nachrichten-Transport kennt drei ehrliche Zustände: `provider`
     (wirklich versendet), `dev` (nur im Postausgang abgelegt), `none`
     (kein Kanal – Fehler, kein Erfolg). Ein Code, der niemanden erreichen
     kann, wird sofort entwertet.
  2. Der Dev-Postausgang existiert in Produktions-Builds nur mit
     `ENABLE_DEV_OUTBOX=true`, ist immer auf die Rolle `admin` beschränkt,
     gibt den Code nie an den Browser zurück und kann per
     `DEV_OUTBOX_RECIPIENTS` auf eigene Testadressen begrenzt werden.
  3. Die UI beschreibt den Zustellstatus aus der Serverkonfiguration; Links
     zu Entwicklungsrouten erscheinen nur, wenn das aktuelle Konto sie
     tatsächlich öffnen kann.
  4. `wrangler.jsonc` setzt `keep_vars: true`, damit im Dashboard gepflegte
     Variablen (auch die Test-Schalter) einen Deploy überleben.
- **Konsequenz:** Der Ablauf Registrierung → Verifizierung → Interessen →
  48-h-Trial ist ohne E-Mail-Provider sicher testbar (Code über
  Admin-Seite, D1-Konsole oder `npm run dev:outbox -- --remote`), ohne dass
  Codes öffentlich werden. Sobald ein Provider konfiguriert ist, hat er
  Vorrang; der Postausgang ist vor dem Launch zu deaktivieren
  (`docs/09-deployment.md`).
