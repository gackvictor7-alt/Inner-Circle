# 13 – Entscheidungen (ADR-Log)

**Stand:** 2026-09-24 (Sprint 12: ADR-015/ADR-016) · Format: **Kontext → Entscheidung → Konsequenz.**
Annahmen sind als solche markiert; geänderte Geschäftsregeln nur mit
Gründer-Freigabe.

**Wichtig:** Einige frühe ADRs beschreiben das ursprüngliche Zielbild und sind
durch spätere Entscheidungen **überholt**. Überholte ADRs bleiben als Historie
stehen, sind aber unten ausdrücklich als ersetzt markiert – der **Code** und
[`00-SOURCE-OF-TRUTH.md`](00-SOURCE-OF-TRUTH.md) sind maßgeblich.

| ADR | Thema | Status heute |
| --- | ----- | ------------ |
| ADR-001 | Next.js-Monolith | **gültig** |
| ADR-002 | PostgreSQL + Prisma | **ersetzt durch ADR-008** (SQLite/D1 + Drizzle) |
| ADR-003 | Auth.js / NextAuth | **ersetzt** (eigene Auth in `src/lib/auth`) – siehe ADR-006-Kontext und `04-auth-membership.md` |
| ADR-004 | Stripe für Abos, Connect-Kandidat | **gültig** (noch nicht produktiv aktiv) |
| ADR-005 | Eigenes i18n statt next-intl | **gültig** |
| ADR-006 | Eigenes Theme-Modul | **gültig** |
| ADR-007 | Vercel als Hosting | **ersetzt durch ADR-008** |
| ADR-008 | Cloudflare Workers + D1 | **gültig** |
| ADR-009 | Kein stiller Nachrichtenverlust / Dev-Postausgang | **gültig** |
| ADR-010 | Design Freeze | **gültig** (neu, 2026-09-21) |
| ADR-011 | Dokumentationsstruktur als Source of Truth | **gültig** (neu, 2026-09-21) |
| ADR-012 | Öffentliche Bild-Assets nicht ungesehen ersetzen | **gültig** (neu, 2026-09-21) |
| ADR-013 | Bildrichtung regeneriert, Demo-Content im Member-Bereich | **gültig** (Demo-Content seit ADR-014 nur noch in der Discovery-Demo) |
| ADR-014 | 48-h-Discovery-Phase ist eine Demo | **gültig** (Sprint 11) |
| ADR-015 | Private Beta als separater, zeitlich begrenzter Networking-Grant | **gültig** (Sprint 12) |
| ADR-016 | Echtes Networking: ein Direktchat je Paar, Polling statt Realtime, keine Mitteilung je Nachricht | **gültig** (Sprint 12) |

## ADR-001: Next.js-Monolith statt Microservices (2026-09-20, Schritt 01)

- **Kontext:** Solo-Gründer ohne Programmiererfahrung, Budget < 500 €,
  KI-gestützte Entwicklung, Web-first.
- **Entscheidung:** Eine Next.js-App (App Router, TypeScript) mit
  Server-Actions/API-Routen, relationale DB, managed Hosting.
- **Konsequenz:** Minimale Betriebskomplexität, eine Codebasis, später
  horizontal skalierbar; kein verteilter System-Overhead.

## ADR-002: PostgreSQL + Prisma ab Schritt 04 (2026-09-20, Schritt 01) – ⚠️ ERSETZT durch ADR-008

- **Kontext:** Komplexes relationales Modell (Mitglieder, Deals,
  Provisionen), Portabilität wichtig.
- **Entscheidung:** Managed PostgreSQL (Free-Tier, z. B. Neon) + Prisma
  mit versionierten Migrationen.
- **Konsequenz:** Schritt 01–03 ohne DB lauffähig; Schema wächst
  phasengerecht (Plan in `02-architecture.md`).

## ADR-003: Auth.js, keine eigene Krypto (2026-09-20, Schritt 01) – ⚠️ ERSETZT (eigene Auth-Implementierung umgesetzt)

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

## ADR-007: Vercel als Hosting-Ziel (2026-09-20, Schritt 01) – ⚠️ ERSETZT durch ADR-008

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

## ADR-010: Design Freeze – der freigegebene visuelle Stand wird eingefroren (2026-09-21)

- **Kontext:** Das aktuelle Design (Startseite, Bildsprache, Farbwelt,
  Typografie, Navigation, Mobile-Richtung, Mitgliederbereich) ist vom Gründer
  freigegeben und gefällt ihm. In früheren Sessions wurden visuelle Elemente
  mehrfach überarbeitet; ohne verbindliche Regel besteht das Risiko, dass
  zukünftige Aufträge (Features, Bugfixes, „Aufräumen") den freigegebenen Stand
  unbeabsichtigt verändern.
- **Entscheidung:** Der visuelle Stand wird als **APPROVED / DO NOT REDESIGN
  WITHOUT EXPLICIT FOUNDER REQUEST** festgeschrieben
  ([`10-design-freeze.md`](10-design-freeze.md)). Geschützt sind Startseite,
  Bilder, Farb-Tokens, Typografie (Inter), Navigation, Grundlayout,
  Dark/Light-System, DE/EN sowie die visuelle Sprache des Mitgliederbereichs.
  Erlaubt bleiben technische Responsive- und Barrierefreiheits-Fixes ohne
  Änderung der Gestaltungsrichtung.
- **Konsequenz:** Jede sichtbare Änderung braucht einen ausdrücklichen
  Designauftrag und einen Eintrag in `10-design-freeze.md`. Feature-Arbeit
  verwendet ausschließlich die bestehenden Bausteine
  (`src/components/ui/*`, `src/components/site/*`).

## ADR-011: Dokumentationsstruktur als Source of Truth (2026-09-21)

- **Kontext:** Die Dokumentation war über zehn Dateien verteilt, beschrieb
  teils überholte Zielbilder (Auth.js, Prisma/Postgres, Vercel) und war als
  Einstieg für neue Agenten nicht eindeutig. Es gab Referenzen auf nicht
  existierende Dateien.
- **Entscheidung:** `docs/00-SOURCE-OF-TRUTH.md` wird der verbindliche
  Einstieg mit Statusübersicht aller Produktbereiche
  (WORKING/PARTIAL/PREPARED/BLOCKED/NOT IMPLEMENTED/DEPRECATED). Detaildokumente
  `01`–`14` decken Produkt, Architektur, Routen, Auth/Membership, Datenbank,
  Rechte, Integrationen, Tests, Deployment, Design Freeze, Known Issues,
  Roadmap, ADRs und Umgebungsvariablen ab. Das historische Fortschrittsprotokoll
  liegt als `docs/archive/04-progress-log.md` und ist **keine Statusquelle**
  mehr. `AGENTS.md` im Wurzelverzeichnis verweist Agenten zuerst auf
  `docs/00-SOURCE-OF-TRUTH.md`.
- **Konsequenz:** Künftige Änderungen aktualisieren immer `00-SOURCE-OF-TRUTH.md`
  und das betroffene Detaildokument. Widersprüchliche alte Dokumente wurden
  gelöscht bzw. archiviert, nicht parallel weitergeführt.

## ADR-012: Öffentliche Bild-Assets werden nicht ungesehen ersetzt (2026-09-21, Demo-Content Sprint)

- **Kontext:** Der Sprint verlangt ein Audit der Bildsprache auf den
  Public-Unterseiten (Network, Business Deals, Investments, Marketplace,
  Events; Menschen 20–40, international, modern, keine Old-Money-/Holz-/
  Gold-Optik, keine 50+, keine Fake-Handshakes). Der Design-Freeze
  (`docs/10-design-freeze.md`) erlaubt `public/images/**`-Ersetzungen nur bei
  ausdrücklichem Auftrag, und in der Ausführungsumgebung stand keine
  Bild-Vision zur Sichtprüfung zur Verfügung.
- **Entscheidung:** Bestehende Bilder werden in diesem Sprint **nicht**
  getauscht, um einen guten Hero/Section-Look nicht zu verschlechtern.
  Stattdessen wird die Bild-Text-Ausrichtung (Punkt 19) korrigiert –
  Zweispalter nutzen `h-auto w-full` (Mobile: Bild über Text, keine
  Crop-Probleme) statt der bisherigen `h-full`-Streckung – und die betroffenen
  Assets werden konkret als „später zu ersetzen" dokumentiert:
  `public/images/business.jpg`, `network.jpg`, `investments.jpg`,
  `marketplace.jpg`, `events-networking.jpg`, `events-vision.jpg`.
- **Konsequenz:** Keine neuen Bild-Assets, kein Risiko für Build-/CPU-Bilanz.
  Die Ersetzung erfolgt als separater, ausdrücklich beauftragter Schritt mit
  Sichtprüfung und geänderten `imageAlt`-Texten.
- **Status:** durch **ADR-013 aufgelöst** (2026-09-21) – beauftragter Tausch ist
  erfolgt.

## ADR-013: Bildrichtung regeneriert, Demo-Content im Member-Bereich ergänzt (2026-09-21)

- **Kontext:** Der Gründer hat die Bildsprache ausdrücklich neu beauftragt
  (Menschen 20–35, internationale Gesichter, Architektur aus Glas/Beton/Stein,
  kein Old Money, kein Loft/Ziegel/Holz, keine Fake-Handshakes, Site bleibt im
  bisherigen Dark-Premium-Look) und zusätzlich verlangt, dass der
  Mitgliederbereich gefüllte, glaubwürdige Demo-Ansichten zeigt.
- **Entscheidung:**
  - `public/images/{network,business,investments,marketplace,membership,events-vision}.jpg`
    wurden ersetzt und komprimiert (16:9, 1376×768, ≤ 202 KB). `hero-home.jpg`
    und `hero.jpg` bleiben unverändert (Design Freeze).
  - Neue Avatare/Demo-Bilder: `public/images/avatars/avatar-7.jpg` und
    `public/images/demo/{demo-event,demo-office,demo-project,demo-cover}.jpg`.
    Sie sind **provisorische, KI-generierte Platzhalter** und ausschließlich
    Demo-/Marketingbild – kein Mitglieder-Foto, kein realer Eventnachweis.
  - Alle Demo-Profile bekommen eine englische Variante pro Freitextfeld
    (`DemoProfile.en`) und ein `completion`-Feld; das Startprofil ist ein
    Gründer (Julian Weiss) statt der vorherigen „Lena"-Persona.
  - Bildkompositionen vermeiden die Lesart „Frau erklärt Mann etwas":
    Präsentieren/Empfangen ist über die Bilder gemischt (z. B.
    `marketplace.jpg` zeigt einen Mann, der einer Frau ein Laptop zeigt).
- **Konsequenz:** ADR-012 ist erledigt. Weitere Bildtauschen oder -regenerations-
  schritte brauchen erneut einen ausdrücklichen Gründungsauftrag; Alt-Texte
  (`imageAlt*` in `src/lib/i18n/dictionaries.ts`) müssen mitziehen.

## ADR-014: Die 48-Stunden-Discovery-Phase ist eine Demo, kein eingeschränkter Echtzugang (2026-09-24, Sprint 11)

- **Kontext:** Bis Sprint 10 gab der Trial begrenzte Leserechte auf echte
  Mitglieder, Deals, Jobs und Investments (12/6/3 Positionen) und erlaubte
  drei echte Kontaktanfragen. Der Gründerauftrag für Sprint 11 verlangt, dass
  echte Kontakte und geschützte Inhalte ausschließlich mit serverseitig
  bestätigter Mitgliedschaft erreichbar sind, ohne Registrierung,
  Verifizierung, Login, Profilbearbeitung, Datenbank oder die bestehende
  Membership-Logik zu verändern.
- **Entscheidung:**
  - Das Level `trial` bleibt bestehen (Datenmodell `Trial`, `startTrial()`,
    einmaliger Start im Onboarding, lazy Ablauf unverändert), erhält aber die
    Rechte von `free` plus ein neues Entitlement `demoAccess`. `TRIAL_VISIBLE`
    entfällt.
  - Seiten mit Demo-Zweig gaten mit `demoAccess && !<echtes Entitlement>`;
    Mitglieder/Admins (`demoAccess=false`) sehen nie Demo. Demo-Inhalte kommen
    ausschließlich aus `src/lib/demo` (keine DB-Zeilen, IDs `demo:…`), echte
    Abfragen werden im Demo-Zweig nicht ausgeführt.
  - Demo-Discover nutzt die **bestehenden** Filter und das bestehende
    regelbasierte Ranking (`src/lib/demo/discover.ts`) – kein zweites
    Matching, keine neue Engine. Demo-Profile tragen dafür Slugs der echten
    Taxonomie.
  - Die simulierte Kontaktanfrage ist ein reiner Client-Dialog mit dem
    vorgegebenen Abschlusstext; sie ruft keine Server Action auf.
  - Echte veröffentlichte Events bleiben für verifizierte Konten lesbar
    (Datum · Uhrzeit, Ort, Programm, freie Plätze nur aus realer Kapazität);
    die Anmeldung ist an `eventsApply` gebunden.
  - Migration ohne Schema-Change: aktive Trials laufen bis `expiresAt` unter
    Demo-Semantik weiter, abgelaufene bleiben abgelaufen, kein Reset.
  - Zahlung bleibt ehrlich: keine Mitgliedschaft ohne bestätigte Zahlung;
    `.env.example` setzt `ALLOW_DEV_MEMBERSHIP_ACTIVATION=false`.
- **Konsequenz:** `registerTrialConnectionRequest()` wird von keiner Action
  mehr verwendet (Service/Tests bleiben, K-21). Tests, die früher Trial-Konten
  für echte Anfragen nutzten, verwenden Mitglieds-Fixtures. Dokumentation:
  `00` §1c/§1d/§1e, `04` §3, `06` §3b, `08`, `11` K-21.

## ADR-015: Private Beta als separater, zeitlich begrenzter Networking-Grant (2026-09-24, Sprint 12)

- **Kontext:** 10–30 eingeladene Tester sollen das echte Networking
  (entdecken → anfragen → annehmen → chatten) nutzen, bevor Stripe produktiv
  ist. Vorgaben des Gründers: kein Bezahlstatus, keine fiktiven
  Stripe-Transaktionen, keine zweite Mitgliederverwaltung, kein zweites
  Auth-System, serverseitige Durchsetzung, andere kostenpflichtige Bereiche
  bleiben gesperrt, Registrierung + E-Mail-Verifizierung unverändert.
- **Entscheidung:**
  - Neue Tabellen `BetaInvite` (Schlüssel, nur als HMAC-SHA-256 mit
    `AUTH_SECRET` gespeichert) und `BetaAccess` (ein Zugang je Konto,
    `startsAt`/`endsAt`/`status`). **Keine** Änderung an `Membership`,
    `User.role` oder `Trial`.
  - `getAccessContext()` liest den Zugang bei jedem Request (mit dem
    Nutzerkontext in derselben Abfrage) und ergänzt für `free`/`trial` über
    `withBetaGrant()` genau fünf Entitlements: `networkDirectory`,
    `networkDiscover`, `connect`, `messaging`, `profileFull`. Die Stufe bleibt
    `free`/`trial` → Beta-Tester zählen nirgends als Mitglied und erreichen
    keine anderen Bezahlbereiche. `networkAccess`/`networkAccessSource`
    beschreiben die Herkunft (`admin`/`member`/`beta`).
  - Wer zum echten Netzwerk gehört, entscheidet eine einzige SQL-Regel
    (`src/lib/network/eligibility.ts`), die Listen **und** Aktionen nutzen.
  - Einlösung: an das eingeloggte, verifizierte Konto gebunden, race-sicher
    über bedingte Updates, Rate-Limit je Konto und Herkunft, Audit ohne
    Klartext. Standarddauer 30 Tage ab Einlösung; der Admin kann verlängern
    oder vorzeitig beenden.
  - Einstieg für Tester über die bestehende Navigation (Profil/Mitgliedschaft
    → „Beta-Zugang aktivieren“, `/app/beta`) – keine eigene Registrierung.
- **Konsequenz:** Die Discovery-Demo bleibt für alle ohne Schlüssel
  unverändert (plus ein ruhiger Hinweis auf die geschlossene Beta). Nach
  Ablauf/Widerruf bleiben Konto, Profil, Kontakte und Chatverläufe erhalten,
  geschützte Aktionen liefern `betaExpired`. Doku: `00`, `05`, `06` §3c,
  `03`, `04` §4b, `08`, `11` K-22.

## ADR-016: Echtes Networking – ein Direktchat je Paar, Polling statt Realtime, keine Mitteilung je Nachricht (2026-09-24, Sprint 12)

- **Kontext:** Der Kern-Flow muss für echte Tester zuverlässig sein:
  keine doppelten Chats, keine doppelten oder widersprüchlichen
  Mitteilungen, korrekte Zähler, gleichzeitige Aktionen ohne Fehlzustand,
  und das Ganze auf Cloudflare Workers/D1 (keine Transaktionen, keine
  dauerhaften Verbindungen im Worker).
- **Entscheidung:**
  - `Conversation.directKey` (`<userId klein>:<userId groß>`, unique) – ein
    Direktchat je Paar; gleichzeitiges Anlegen endet über
    `ON CONFLICT DO NOTHING` beim selben Datensatz. Ältere Chats werden
    beim nächsten Zugriff übernommen.
  - Annahme öffnet den Chat sofort und übernimmt die Anfrage-Nachricht als
    erste Nachricht; gegenseitige Anfragen werden automatisch zur
    Verbindung. Nach einer Ablehnung gilt eine Wartezeit von 14 Tagen für
    neue Anfragen (`CONNECTION_REQUEST_COOLDOWN_DAYS`); der Absender erhält
    keine Ablehnungs-Mitteilung.
  - Neue Nachrichten erzeugen **keine** Mitteilung mehr: ungelesen =
    `Message.createdAt > ConversationParticipant.lastReadAt`. Der Inbox-Badge
    = ungelesene Nachrichten + ungelesene Mitteilungen; der Anfragen-Zähler
    = offene eingehende Anfragen.
  - Neue Nachrichten im offenen Chat kommen per Polling
    (`CHAT_POLL_INTERVAL_MS` = 10 s, nur bei sichtbarem Tab) – bewusst
    **kein** WebSocket/Durable Object.
- **Konsequenz:** Migration `0002` markiert alte ungelesene
  `message`-Mitteilungen als gelesen. Echtzeit-Zustellung und E-Mail-
  Benachrichtigungen bleiben offen (K-22).
