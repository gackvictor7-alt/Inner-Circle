> ## ⚠️ ARCHIV – DEPRECATED ALS STATUSQUELLE
>
> Diese Datei ist das **historische Fortschrittsprotokoll** der früheren
> Entwicklungsphasen (Schritt 01, Schritt 02, Deployment, Sprint 2.0,
> Verifizierungs-Hotfix). Sie bleibt als Nachweis erhalten, ist aber
> **nicht mehr aktuell** und darf nicht als Statusquelle verwendet werden:
>
> - Die Schritt-Tabelle weiter unten führt Schritte als „⬜ geplant", die
>   längst gebaut sind.
> - Aktueller Status: [`../00-SOURCE-OF-TRUTH.md`](../00-SOURCE-OF-TRUTH.md).
> - Aktuelle Roadmap: [`../12-roadmap.md`](../12-roadmap.md).
>
> Neue Fortschrittseinträge werden **nicht** mehr hier, sondern in
> `docs/00-SOURCE-OF-TRUTH.md` (Status) und `docs/12-roadmap.md` (Planung)
> gepflegt.

---

# Entwicklungsfortschritt

## Hotfix – Verifizierung ohne E-Mail-Provider / Dev-Postausgang 404 (✅ 2026-09-21)

- **Anlass (erster echter Registrierungstest auf dem Worker):** Registrierung
  und Weiterleitung nach `/verify` funktionierten, der Link „Dev-Postausgang
  öffnen“ führte aber auf `/dev/outbox` → **404**; gleichzeitig behauptete die
  Seite oben „keine echte Nachricht versendet“ und unten „Code wurde über den
  konfigurierten Anbieter versendet“.
- **Ursache:** Im Produktions-Build ist `flags.devOutboxEnabled` ohne die
  Variable `ENABLE_DEV_OUTBOX` bewusst `false` (→ `notFound()` auf
  `/dev/outbox`). Der Nachrichten-Transport lieferte in genau diesem Zustand
  (kein `RESEND_API_KEY`, Postausgang aus) trotzdem `ok: true, mode: "dev"`:
  Der Code wurde als Hash gespeichert, der Klartext aber weder versendet noch
  abgelegt – **stiller Verlust**. Die UI zeigte deshalb den Dev-Hinweis samt
  Link auf eine nicht existierende Route; der Fußtext war ein statischer String.
- **Behoben:**
  - `src/lib/messages/transport.ts`: dritter Zustellmodus `none` – ohne
    Provider und ohne (erlaubten) Postausgang gibt es `ok: false,
    error: "no_delivery_channel"`; ein fehlgeschlagener Outbox-Write wird nicht
    mehr als „abgelegt“ gemeldet.
  - `src/lib/auth/otp.ts`: nicht zustellbare Codes werden sofort entwertet
    (`not_configured`); `devCode` weiterhin nur bei `NODE_ENV !== production`.
  - `src/lib/env.ts`: `deliveryModeFor()`, `canOpenDevOutbox()` (nur Admin +
    Postausgang aktiv), Empfänger-Allowlist `DEV_OUTBOX_RECIPIENTS`
    (`devOutboxAccepts()`), `integrationStatus().devOutboxRestricted`.
  - `/verify`, `/forgot-password`: Zustellstatus wird serverseitig ermittelt;
    Lead-, Hinweis- und Fußtext folgen dem tatsächlichen Modus
    (provider / dev / none). Der Link zum Postausgang erscheint nur, wenn das
    Konto ihn öffnen kann. „Code erneut senden“ meldet bei fehlendem
    Versandweg `deliveryUnavailable` statt eines Dev-Hinweises; ein Cooldown
    verändert den Zustellstatus nicht.
  - `/dev/outbox`: weiterhin 404 ohne Flag und **immer admin-only**; neu:
    `noindex`, Produktions-Warnbanner, Anzeige der Allowlist, Texte über i18n.
  - `wrangler.jsonc`: `keep_vars: true` – ohne dieses Flag löscht jeder Deploy
    (auch Workers Builds) die im Dashboard angelegten Text-Variablen
    (`NEXT_PUBLIC_SITE_URL`, `ENABLE_DEV_OUTBOX`, …).
  - `scripts/show-outbox.ts` (fehlte, obwohl `npm run dev:outbox` darauf
    zeigte): liest den Postausgang lokal, aus der lokalen D1-Emulation oder
    per `--remote` aus der Produktions-D1 (`--to=`, `--limit=`).
  - **Onboarding (Schritt „Interessen → 48-h-Trial“):** Das Formular sendete
    kein `startTrial`, die Action startete den Trial deshalb nie (Dashboard
    zeigte einem neuen Konto „Deine Discovery-Phase ist beendet“); außerdem
    schickte die Seite Taxonomie-IDs, die Action suchte nach Slugs → Interessen
    und Ziele wurden nie gespeichert. Beides behoben (hidden `startTrial=1`,
    Action akzeptiert IDs und Slugs).
  - Doku: `docs/09-deployment.md` (Abschnitt „Testbetrieb ohne
    E-Mail-Provider“, `keep_vars`, Admin-Hinweis), `.env.example`,
    `.dev.vars.example`, README, `tests/README.md`, ADR-009.
- **Tests:** neu `tests/integration/message-delivery.test.ts` (8 Tests:
  produktionsnahe Konfiguration → ehrliches `none`, kein hängender Code,
  Registrierung meldet `deliveryUnavailable`; `ENABLE_DEV_OUTBOX` +
  Allowlist; Code nie an den Browser; Resend-Cooldown ≠ fehlender Versandweg;
  Outbox-Link nur Admin) und `tests/integration/onboarding.test.ts` (3 Tests:
  Auswahl per ID/Slug gespeichert, Trial startet genau einmal und nur mit
  Flag, unverifiziert/anonym abgewiesen). `npm test` = 12 Dateien / 56 Tests,
  `npm run typecheck`, `npm run cf:build`, `wrangler deploy --dry-run` grün;
  `npm run lint` unverändert (21 bestehende Hinweise, keine neuen).
- **Manuell in `workerd` (`wrangler dev` gegen lokale D1, Produktions-Build):**
  - Ohne Flag: `/dev/outbox` 404, Registrierung legt Konto an, `/verify`
    zeigt „Versand noch nicht eingerichtet“ ohne Link, Resend meldet
    „kein Code zugestellt“, `DevOutbox` leer, keine offenen Codes.
  - Mit `ENABLE_DEV_OUTBOX=true` + `DEV_OUTBOX_RECIPIENTS`: dasselbe, zuvor
    angelegte Konto → Resend → Eintrag im Postausgang; als Nicht-Admin kein
    Link und `/dev/outbox` → 307; nach `cf:admin` Link sichtbar,
    `/dev/outbox` 200 mit Code (auch per `npm run dev:outbox -- --local`);
    Code eingeben → `/onboarding/interests` (enthält `startTrial`) →
    „Discovery starten“ → Trial `active`, 48 h, 3 Interessen + 1 Ziel
    gespeichert → `/app` mit Countdown „47h 59m“; fremde Adresse außerhalb
    der Allowlist wird nicht aufgezeichnet.
- **Offen (Gründer, Dashboard):** `ENABLE_DEV_OUTBOX=true` und
  `DEV_OUTBOX_RECIPIENTS=<eigene Testadresse>` setzen, Testkonto per
  D1-Konsole/`cf:admin` zum Admin machen, Merge nach `main` abwarten
  (Workers Builds), dann Resend → Code aus `/dev/outbox`. Vor dem Launch
  `RESEND_API_KEY` setzen und `ENABLE_DEV_OUTBOX` entfernen.

## Deployment – Cloudflare Workers + D1 (✅ vorbereitet, 2026-09-20)

- **Ziel:** Den fehlgeschlagenen Cloudflare-Deploy („Could not detect a
  directory containing static files“) beheben und die Plattform produktiv
  auf Cloudflare Workers mit D1-Datenbank lauffähig machen – ohne
  bestehende Funktionen zu verändern.
- **Geändert/erstellt:**
  - `wrangler.jsonc` (Worker `inner-circle`, `nodejs_compat`, Assets,
    D1-Binding `DB`, Observability), `open-next.config.ts`,
    `public/_headers`, `next.config.ts` (libSQL extern, Dev-Bindings).
  - `src/db/client.ts`: Laufzeit-Umschaltung D1 ↔ libSQL (lazy Proxy);
    alle 49 Importstellen unverändert.
  - `drizzle/0000_init.sql` + `meta/`: vollständige D1-Migration
    (50 Tabellen, 85 Indizes).
  - Skripte: `cf:build|release|deploy|preview|upload|dry-run|typegen`,
    `cf:d1:create|migrate|bootstrap`, `cf:admin` (`cf:release` = Deploy +
    D1-Migrationen + Taxonomie, als Deploy-Befehl für Workers Builds);
    `scripts/d1-bootstrap.ts` (Taxonomie), `scripts/admin-bootstrap.ts`
    (erster Admin), `scripts/taxonomy.ts` (gemeinsame Quelle mit Seed).
  - `.env.example` (erstmals versioniert – nur Platzhalter),
    `.dev.vars.example`, `.gitignore`.
  - Dokumentation: `docs/09-deployment.md` (Runbook), `07`, `05`
    (ADR-008), README, `src/lib/db/README.md`.
  - **Bugfix (Produktion):** `src/app/actions/auth.ts` exportierte das
    Objekt `initialAuthState` aus einer `"use server"`-Datei → in
    Produktions-Builds schlugen alle Auth-Actions mit
    „A 'use server' file can only export async functions“ fehl. Zustand
    nach `src/app/actions/auth-state.ts` verschoben.
- **Funktioniert (verifiziert):**
  - `npm run cf:build` (OpenNext-Bundle 5,9 MB, gzip 1,7 MB), `npm run
    typecheck`, `npm test` (45 Tests), `wrangler deploy --dry-run`
    (Bindings `DB`, `ASSETS`, `NEXTJS_ENV`).
  - `wrangler d1 migrations apply DB --local`: 136 Statements grün;
    Taxonomie-Bootstrap idempotent (23/11/3); Admin-Bootstrap befördert
    und meldet fehlende Konten sauber.
  - App in `workerd` (`npm run cf:preview`) gegen lokale D1: öffentliche
    Seiten 200, `/app`/`/admin` ohne Session 307, kompletter Flow
    Registrierung → OTP → Verifizierung → Login → Onboarding → 48-h-Trial
    → Mitgliederbereich (13 Routen 200) → Admin-Konsole; scrypt/OTP über
    `node:crypto`, Dev-Postausgang, Audit-Log, Rate-Limit in D1.
  - `_next/static` mit `immutable`-Cache-Header; libSQL/Native-Binding
    nicht im Worker-Bundle.
- **Offen (Gründer, manuell, nur Dashboard):** Build-/Deploy-Befehle in
  Workers Builds eintragen, `AUTH_SECRET` + `NEXT_PUBLIC_SITE_URL` setzen,
  Build erneut starten (D1 wird per Wrangler-Provisioning automatisch
  angelegt und migriert), ersten Admin befördern – Schritt-für-Schritt in
  `docs/09-deployment.md`.
- **Externe Abhängigkeiten:** `@opennextjs/cloudflare` (Runtime-Adapter),
  `wrangler` (Dev-Tool).

## Sprint 2.0 – Von der Website zur Plattform (in Arbeit, 2026-09-21)

- **Ziel:** Aus der bestehenden Website die erste wirklich nutzbare Version
  der Business-Plattform machen (öffentliche Entdeckung → Registrierung →
  Verifizierung → Interessen → 48-h-Trial → Mitgliedschaft → Mitglieder-
  bereich inkl. Netzwerk, Chancen, Marketplace, Investments, Events).
- **Geändert/erstellt (Auszug):**
  - Plattform-Bereich `src/app/(app)/app/*` mit Dashboard, Netzwerk,
    Discover (Swipe), Verbindungen, Nachrichten, Mitteilungen, Profil,
    Einstellungen, Mitgliedskarte, Trust & Performance, Billing sowie den
    sechs Kernbereichen (Netzwerk, Chancen, Investments, Marketplace &
    Academy, Jobs & Projekte, Events & Experiences).
  - Server-Actions (`src/app/actions/*`) für Auth, Netzwerk, Nachrichten,
    Mitteilungen, Beiträge, Profil, Business und Administration.
  - Datenbank auf Drizzle/libSQL (48 Tabellen), zentrale Zugriffsschicht
    (`src/lib/access/*`) mit Level `visitor < free < trial < member < admin`,
    Trial-Service (48 h, 3 Anfragen, serverseitige Ablaufprüfung),
    Membership-Service, Stripe-Sandbox-Integration mit signierten Webhooks,
    Audit-Log, Rate-Limits, Dev-Postausgang.
  - Admin-Konsole `/admin` (Kennzahlen, Nutzer, Investment-Prüfung,
    Mitgliedsanträge, Löschanträge).
  - Mitgliedsantrag (`/app/membership-application`): nur mit bestätigter,
    aktiver Mitgliedschaft; manuelle Prüfung durch die Administration.
  - Zentrales i18n erweitert: DE = EN = 1812 Schlüssel, gleiche Struktur,
    0 fehlende Schlüssel (`npx tsx scripts/check-keys.ts`).
  - Automatisierte Tests: 39 Tests in `tests/` (Unit + Integration gegen
    eine Wegwerf-Datenbank), siehe `tests/README.md` und
    `docs/08-testing.md`.
- **Funktioniert (verifiziert):**
  - `npm run build`, `npx tsc --noEmit`, `npm test`, `scripts/check-keys.ts`
    und `scripts/i18n-audit.ts` laufen grün.
  - Öffentliche Seiten liefern 200; `/app`, `/admin` und `/verify` sind ohne
    Session 307 → Login (kein Zugriff ohne Anmeldung).
  - Mit Testkonten (dev-session) liefern alle Mitgliederseiten 200, inkl.
    Detailseiten, Checkout-Rückleitungen und öffentlicher Mitgliedskarte.
  - Nicht-Admin-Konten erhalten auf `/admin*` 307 (Zugriff serverseitig
    verweigert).
  - Membership-Lebenszyklus, Trial-Regeln, Verbindungs- und
    Nachrichten-Autorisierung sind durch Integrationstests abgedeckt.
- **Fehlgeschlagen / nicht möglich:**
  - Echter E-Mail-/SMS-Versand, OAuth und Stripe-Livebetrieb: keine
    Zugangsdaten vorhanden. Alles läuft im klar gekennzeichneten Dev-Modus
    (Dev-Postausgang, Dev-Mitgliedschaftsaktivierung); benötigte Schlüssel
    stehen in `docs/07-external-services.md` und `.env.example`.
  - Browser-/Layout-Prüfung im echten Browser ist in dieser Umgebung nicht
    möglich (kein Chromium installierbar) – Responsivität wurde über
    Tailwind-Klassen, Code-Review und manuelle Klickpfade geprüft.
- **Offen / als Nächstes:**
  - Abschluss der §67-QA-Checkliste inkl. Mobile 320–430 px.
  - Fehlende Demo-Avatare (3–6) und finale Bildauswahl.
  - E2E-Tests für Server-Actions (Registrierung/Login) benötigen eine
    laufende Instanz und stehen noch aus.
  - `docs/05-decisions.md`, `docs/09-deployment.md` und der Abschlussbericht
    werden am Ende des Sprints aktualisiert.
- **Tests in diesem Schritt:** `npm run build`, `npx tsc --noEmit`,
  `npm test` (39 Tests), `npx tsx scripts/check-keys.ts` (390 Referenzen),
  `npx tsx scripts/i18n-audit.ts` (1812 = 1812), HTTP-Smoke über 25 Routen.


Wird nach **jeder Phase** aktualisiert: Ergebnis, Dateien, Tests,
Probleme, externe Abhängigkeiten, nächster Schritt.

## Legende

- ✅ abgeschlossen · 🔄 laufend · ⬜ geplant · 🚫 blockiert

## Übersicht

| Schritt | Phase                    | Status   |
| ------- | ------------------------ | -------- |
| 01      | Projekt-Fundament        | ✅ abgeschlossen |
| 02      | Designsystem + öffentliche Website | ✅ abgeschlossen (überarbeiteter Umfang) |
| 03      | Öffentliche Website (Restumfang) | ⬜ geplant |
| 04      | Datenbank & Auth         | ⬜ geplant |
| 05      | Mitgliedschaft & Onboarding | ⬜ geplant |
| 06      | Dashboard & Profile      | ⬜ geplant |
| 07      | Netzwerk & Nachrichten   | ⬜ geplant |
| 08      | Firmenprofile & Gruppen  | ⬜ geplant |
| 09      | Business-Deals-Marktplatz| ⬜ geplant |
| 10      | Deal-Räume & Brokerage   | ⬜ geplant |
| 11      | Investment-Chancen       | ⬜ geplant |
| 12      | Marktplatz & Verkäufer   | ⬜ geplant |
| 13      | Academy & Service-Buchung| ⬜ geplant |
| 14      | Creator & Referrals      | ⬜ geplant |
| 15      | Vertrauen & Leistung     | ⬜ geplant |
| 16      | Events & Experiences     | ⬜ geplant |
| 17      | Administration & Finanzen| ⬜ geplant |
| 18      | Integration & E2E-Tests  | ⬜ geplant |
| 19      | Sicherheit & Produktionsreife | ⬜ geplant |
| 20      | Deployment & Launch      | ⬜ geplant |

## Protokoll

### Schritt 02 – Designsystem & öffentliche Website (✅ abgeschlossen, 2026-09-20)

- **Ziel (überarbeiteter Auftrag):** Die technische Statusseite durch eine
  professionelle, interaktive Marken- und Produktpräsentation ersetzen.
  Designsystem + neue Startseite + echte Unterseiten in einem Schritt.
- **Umgesetzt:**
  - **Design-System:** Erweiterte Design-Tokens (Farben, Radien, Schatten,
    Motion) in `globals.css`; Typografie Inter (self-hosted, SIL OFL 1.1);
    UI-Primitiven: Button, Badge, Card, Input/Textarea, Dialog, Dropdown,
    Tabs, Toaster, Progress, RatingStars, Avatar, Icon-Set.
    Übersichtsseite `/design` (intern, im Footer verlinkt).
  - **Startseite:** Bildstarker Hero („YOUR NETWORK. YOUR OPPORTUNITIES.“,
    DE: „DEIN NETZWERK. DEINE CHANCEN.“), 4 Möglichkeiten-Bereiche,
    Trust-&-Reputation-Erklärung mit klar markierter Beispieldarstellung
    (Sterne 1–5), Events & Community (regulär + Vision, mit Hinweis
    „keine bestätigten Veranstaltungen“), Membership (24,99 €/Monat,
    Jahrespreis „folgt“), FAQ, Final-CTA, professioneller Footer.
  - **Routen (alle real, verlinkt, mit eigener Struktur):** `/`, `/network`,
    `/business-deals`, `/investments`, `/marketplace` (mit Tabs
    Marketplace/Academy), `/events` (ehrlicher Leerzustand),
    `/membership`, `/login`, `/register` (echte Validierung, ehrlicher
    „noch nicht verfügbar“-Toast), `/imprint`, `/privacy`, `/terms`
    (Platzhalter ohne Fake-Rechtstexte), `/design`, 404-Seite.
  - **Navigation:** Sticky Header mit aktiven Zuständen, vollständiges
    mobiles Menü (Escape, Scroll-Lock, Fokus-Handling), Sprach- &
    Theme-Dropdowns überall.
  - **i18n/Theme:** Beide Systeme aus Schritt 01 erhalten; Sprache &
    Theme bleiben über alle Unterseiten und Reloads erhalten
    (localStorage); `usePageMeta` hält Tabtitel/Description sprachabhängig.
  - **Fix aus Step 01 übernommen:** ThemeProvider aktualisiert sich jetzt
    sofort, wenn im System-Modus das OS-Erscheinungsbild wechselt.
  - **Bilder:** 8 KI-generierte Stimmungsbilder als deutlich
    gekennzeichnete, vorläufige Platzhalter (Footer-Disclaimer +
    Bild-Captions). Keine echten Veranstaltungen/Mitglieder dargestellt.
- **Geändert/erstellt:** `src/app/**` (alle Routen + Layout + fonts),
  `src/components/ui/*`, `src/components/site/*`,
  `src/lib/i18n/*`, `public/images/*`, `README.md`, `docs/*`.
- **Tests:** `npm run build` grün (16/16 Seiten, statisch),
  `npm run lint` grün; HTTP-Check aller 14 Routen = 200/404 korrekt;
  next/image-Optimierung für alle 8 Bilder = 200; Schrift-Auslieferung
  = 200; 27 Vitest-/jsDOM-Tests grün (Dictionary-Parität DE↔EN,
  Sprachwechsel + Persistenz, Theme light/dark/system + Persistenz +
  Live-OS-Wechsel, Dialog/Tabs/Dropdown/Toast/Input-Zustände).
- **Nicht möglich in dieser Umgebung:** Screenshot-/Layout-Prüfung im
  echten Browser (kein Chromium installierbar; CDN/Apt blockiert).
  Layout wurde statisch über Tailwind-Klassen (responsiv, kein
  horizontales Scrollen per Konstruktion) und Code-Review verifiziert.
- **Offen:** Jahrepreis festlegen (Gründer), echte Bilder/Video,
  Rechtstexte (Schritt 19/20), Konten ab Schritt 04.
- **Externe Abhängigkeiten:** keine neuen Laufzeit-Dependencies
  (nur self-hosted Font).
- **Nächster Schritt:** Schritt 03 (Restumfang öffentliche Website nach
  Freigabe) bzw. Freigabe durch Auftraggeber.

### Schritt 01 – Projekt-Fundament (✅ abgeschlossen 2026-09-20)

- **Ziel:** Lauffähige App-Basis + verbindliche Dokumentation.
- **Umgesetzt:**
  - Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 Scaffold.
  - Zentrales i18n (DE/EN, `src/lib/i18n`), Standard Deutsch.
  - Theme-System light/dark/system, persistent, ohne Lade-Blitzen.
  - Status-Startseite (Platzhalter, explizit kein finales Design).
  - Domain-Ordner A–J, `.env.example`, `/docs`-Spezifikation.
- **Geändert/erstellt:** `package.json`, `src/app/*`, `src/components/*`,
  `src/lib/i18n/*`, `src/domains/*`, `src/lib/auth|db/README.md`,
  `.env.example`, `docs/*.md`, `README.md`.
- **Tests:** Build + Lint grün; DE/EN- und Theme-Check im Rahmen von
  Schritt 02 vollständig nachgeholt (27 automatisierte Tests).
- **Offen:** – (abgeschlossen).
- **Externe Abhängigkeiten:** keine (bewusst ohne DB/Auth/Zahlung).
- **Nächster Schritt:** Schritt 02 (Designsystem & öffentliche Website).
