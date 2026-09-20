# Entwicklungsfortschritt

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
