# INNER CIRCLE (Arbeitsname)

Digitales Business-Ökosystem: Netzwerk, Geschäfte, Wissen,
Kapitalzugang und Erlebnisse in einer Plattform.
**Leitprinzip: Zugang schafft Chancen.**

> **Verbindlicher Einstieg: [`docs/00-SOURCE-OF-TRUTH.md`](docs/00-SOURCE-OF-TRUTH.md)**
> – Status aller Bereiche (WORKING / PARTIAL / PREPARED / BLOCKED /
> NOT IMPLEMENTED), Route Map, Berechtigungen, Datenbank, Integrationen, Tests,
> Deployment, Design Freeze und Roadmap.
> KI-Agenten beginnen mit [`AGENTS.md`](AGENTS.md).
>
> **Design-Status:** freigegeben und eingefroren – keine visuellen Änderungen
> ohne ausdrücklichen Auftrag des Gründers
> ([`docs/10-design-freeze.md`](docs/10-design-freeze.md)).

## Aktueller Stand (Kurzfassung)

- **Läuft:** öffentliche Website (DE/EN, Light/Dark), Registrierung, Login,
  Sessions, E-Mail-Verifizierung (im geschützten Dev-Postausgang),
  48-h-Discovery-Trial, Mitgliedschaftslogik, Mitgliederbereich (Netzwerk,
  Verbindungen, Nachrichten, Notifications, Profil, Karte, Billing, Trust,
  Chancen, Jobs, Marketplace, Academy, Investments, Events), Admin-Konsole,
  Cloudflare-Build und D1-Migrationen.
- **Blockiert durch fehlende Schlüssel:** echter E-Mail-Versand (Resend),
  SMS (Twilio), Bezahlung (Stripe), OAuth (Google/Apple – noch nicht
  implementiert).
- **Nächster Schritt:** echten E-Mail-Versand für die Account-Verifizierung
  einrichten ([`docs/12-roadmap.md`](docs/12-roadmap.md) → N-1).
- **Tests:** `npm test` = 12 Dateien / 56 Tests grün.

## Schnellstart

Voraussetzung: Node.js ≥ 20.

```bash
npm install
npm run dev     # http://localhost:3000 (bindet 0.0.0.0)
npm run build   # Produktions-Build prüfen
npm run lint    # Lint prüfen (bekannte Hinweise: docs/11-known-issues.md K-15)
npm test        # Unit- + Integrationstests (Wegwerf-Datenbank)
```

Umgebungsvariablen: `.env.example` nach `.env` kopieren (lokal genügt
`AUTH_SECRET`; alle weiteren Integrationen sind optional und laufen ohne
Schlüssel im gekennzeichneten Dev-Modus). Lokale Datenbank:
`npm run db:push && npm run db:seed`. Verifizierungscodes ohne
E-Mail-Provider: `npm run dev:outbox` (Dev-Postausgang, nie echt versendet).
Vollständige Variablenliste: [`docs/14-environment.md`](docs/14-environment.md).

## Deployment (Cloudflare Workers + D1)

```bash
npm run cf:preview    # App lokal in der Cloudflare-Laufzeit (workerd) + lokale D1
npm run cf:dry-run    # Build + Wrangler-Konfiguration prüfen (kein Upload)
npm run cf:deploy     # Build + Deployment (nach `npx wrangler login`)
```

Produktion läuft als Cloudflare Worker (OpenNext-Adapter) mit einer
D1-Datenbank (Binding `DB`, Name `inner-circle-db`, Migrationen in `drizzle/`).
Erstinbetriebnahme, Secrets, Build-Einstellungen, Admin-Bootstrap und der
geschützte Testbetrieb ohne E-Mail-Provider:
[`docs/09-deployment.md`](docs/09-deployment.md).

## Struktur

- `src/app/` – Next.js App Router: `(site)/` öffentliche Website,
  `(app)/` Mitgliederbereich + Onboarding, `admin/` Admin-Konsole,
  `actions/` Server Actions, `api/` API-Routen
- `src/components/` – `ui/` Designsystem, `site/` Website-Bausteine,
  `app/` Mitgliederbereich, `auth/`, `billing/`, `dev/`
- `src/lib/` – Domänenlogik: `access/`, `auth/`, `trial/`, `membership/`,
  `messages/`, `notifications/`, `payments/`, `platform/`, `i18n/`, `env.ts`
- `src/db/` – Drizzle-Schema, Laufzeit-Client (D1 in Workers, libSQL lokal)
- `drizzle/` – versionierte SQL-Migrationen
- `scripts/` – Seed, D1-Bootstrap, Admin-Bootstrap, Outbox, Audits
- `tests/` – Vitest Unit- + Integrationstests
- `docs/` – verbindliche Dokumentation (Einstieg: `00-SOURCE-OF-TRUTH.md`)
- `wrangler.jsonc`, `open-next.config.ts` – Cloudflare-Konfiguration

## Regeln (Kurzfassung – vollständig in `AGENTS.md`)

1. Zuerst `docs/00-SOURCE-OF-TRUTH.md` lesen; der Code ist die Wahrheit.
2. Bestehende Funktionen nicht neu bauen, nichts Unbeteiligtes ändern.
3. **Kein Redesign ohne ausdrücklichen Auftrag** (`docs/10-design-freeze.md`).
4. Jede sichtbare Aktion funktioniert, ist deaktiviert oder als „Demnächst
   verfügbar" gekennzeichnet – keine Dead Buttons, keine Fake-Features.
5. Geheimnisse nur in Umgebungsvariablen, nie im Repository.
6. UI-Text nur über `src/lib/i18n` (DE + EN), Light + Dark immer prüfen.
7. Tests vor und nach der Änderung; Dokumentation mitliefern.

## Technik

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 ·
Drizzle ORM (Cloudflare D1 in Produktion, libSQL lokal) ·
eigene Session-Auth (scrypt, OTP) · Stripe (Sandbox zuerst) ·
Cloudflare Workers via OpenNext.
Details: [`docs/02-architecture.md`](docs/02-architecture.md),
Entscheidungen: [`docs/13-decisions.md`](docs/13-decisions.md).
