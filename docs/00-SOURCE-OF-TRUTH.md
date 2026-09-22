# 00 – SOURCE OF TRUTH (INNER CIRCLE)

**Diese Datei ist der verbindliche Einstiegspunkt für jeden Menschen und jeden
KI-Agenten, der an diesem Repository arbeitet.**

- **Stand:** 2026-09-22 (Sprint 6 – Struktur-Audit, Source-of-Truth-Härtung,
  Auth/Login/Register/Verify-Fixes, Language-Switcher-Korrektur, Deals funktional,
  Button-Audit, Events mit Bildern, Profile humanisiert, Demo-Beiträge,
  Inbox-Empty-States, kleine Visualisierungen, AI-Look-Reduktion; Sprint 5 – Mobile-UX
  der Startseite, Login-UX, Demo-Detail-Dialoge, Event-Bilder)
- **Technische Basis:** Branch `arena/01a0c9c0-inner-circle`, Basis `main` @
  `a563999`. Vorheriger dokumentierter Stand: `c211e20` (Sprint 5)
- **Sprint-6-Auftrag:** ausdrücklicher Gründerauftrag: bestehendes Projekt
  stabilisieren, strukturieren, funktional machen, humanisieren. Kein Rewrite.
  Keine funktionierende Logik löschen. Domain/Resend-Custom-Domain bewusst
  PAUSIERT. Naming/Logo nicht anfassen.
- **Gültigkeit:** Der **Code im Repository** ist die technische Wahrheit. Diese
  Dokumentation beschreibt, was dort tatsächlich steht – nicht, was geplant war.
- **Design-Status:** siehe [`10-design-freeze.md`](10-design-freeze.md) –
  **APPROVED / DO NOT REDESIGN WITHOUT EXPLICIT FOUNDER REQUEST**

---

## 1. Was INNER CIRCLE ist

Ein digitales Business-Ökosystem für Gründer, Unternehmer, Investoren, Creator,
Freelancer, Berater und Unternehmen. Leitprinzip: **Zugang schafft Chancen.**
Vier Säulen: **Netzwerk · Geschäfte · Wissen · Kapitalzugang (+ Erlebnisse).**

### 1a. Produkt-Kernbereiche (verbindlich)

| # | Kernbereich | Kurz-Beschreibung | Primär-Route (Member) | Public Preview |
|---|-------------|-------------------|------------------------|----------------|
| 1 | **Network** | Mitgliederverzeichnis, Follow, Connect mit Pflichtnachricht, Block | `/app/network` | `/network` |
| 2 | **Discover** | Relevanz-Ranking (Interessen, Ziele, Branche, Ich suche/biete), Filter, Umkreis | `/app/discover` | – (nur Member) |
| 3 | **Business Deals / Chancen** | Chancen anlegen, browsen, bewerben, Owner antwortet | `/app/opportunities` | `/business-deals` |
| 4 | **Jobs & Projekte** | Gefilterte Sicht auf Deal-Typ `job`/`freelance` | `/app/jobs` | Teil von Business-Deals |
| 5 | **Investments** | Investment Opportunities (Mitglieder reichen ein, Admin prüft, freigegebene sichtbar) + Absichtserklärung | `/app/investments` | `/investments` |
| 6 | **Marketplace** | Produkte, Services, Listings (ohne Bezahlung, nur Discovery) | `/app/marketplace` | `/marketplace` |
| 7 | **Academy** | Kurse (Module, Lektionen), Enrollment, Fortschritt | `/app/learn` | Teil von Marketplace |
| 8 | **Events** | Kuratierte INNER-CIRCLE-Events, Bewerben/Abbestätigen, Warteliste | `/app/events` | `/events` |
| 9 | **Inbox** | Nachrichten (nur verbundene Konten), Anfragen (eingehend/ausgehend/Verbindungen), Benachrichtigungen | `/app/inbox` (Tabs) | – |
| 10 | **Profile** | Business Identity (Header, Stats, Actions, Vollständigkeit, Tabs Beiträge/Übersicht/Performance/Angebote) | `/app/profile` | `/member/[publicId]` (Karten-Verifikation) |
| 11 | **Membership** | Pläne, Billing, Paywall, Mitgliedsantrag, Rechnungen (vorbereitet) | `/app/billing`, `/app/membership-application`, `/app/card` | `/membership` |
| 12 | **Trust** | Trust Score Anzeige (leer ohne echte Bewertungen), Performance Records, Badges, Founding Member | `/app/profile?tab=performance`, `/app/trust` | – |
| 13 | **INNER CIRCLE Portfolio** | Strategische Zielallokation 20% → 25% Netzwerk / 75% extern = 5%/15%; kein Fonds, keine Renditeversprechen | `/app/investments` (untere Sektion) + `/portfolio` | `/portfolio` |

Details: [`01-product.md`](01-product.md)

### 1b. Navigation – klar getrennt

#### Public Navigation (statisch, keine DB, kein getAccessContext)

- `/` – Startseite: Hero (beide Preise 24,99€/249,90€) → 3 Outcomes kompakt → 6 Kernbereiche als klickbare Übersicht → Membership → Footer (KI-Hinweis im Footer). Desktop behält reiche Bild-Text-Sektionen (`hidden lg:block`).
- `/network`, `/business-deals`, `/investments`, `/marketplace`, `/events`, `/membership`, `/portfolio` – Preview-Seiten mit statischem Content, nicht aktive Funktionen als „Demnächst verfügbar".
- `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` – Auth.
- `/member/[publicId]` – öffentliche Karten-Verifikation.
- `/imprint`, `/privacy`, `/terms` – Rechts-Platzhalter (PARTIAL).
- `/design` – internes Design-System.
- Header: Logo → 6 Preview-Links → Sprach-/Theme-Umschalter (Flagge + voller Name: 🇩🇪 Deutsch / 🇬🇧 English) → Login/Join oder „Zur App" (Präsenz-Flag `ic_presence`, keine Autorisierung).

#### Member Navigation (6 Primärbereiche + 6 sekundäre Bereiche)

**Primär (Sidebar + Bottom-Bar):**

| # | Label | Route | Inhalt |
|---|-------|-------|--------|
| 1 | Start | `/app` | Hallo <Name> + Trial-Chip + Inbox-Shortcut + 6 Kernbereichs-Karten (2×3 Desktop) |
| 2 | Discover | `/app/discover` | Business-Karten, Pflicht-Connect-Nachricht, Ranking, Filterleiste + „Mehr Filter" + Chips + „Filter zurücksetzen" |
| 3 | Erstellen | Create-Sheet | Business Deal · Job/Projekt · Investment · Marketplace-Angebot · Kurs · Beitrag (Events bewusst NICHT erstellbar durch Member) |
| 4 | Inbox | `/app/inbox` | Segmented Control: Nachrichten · Anfragen · Benachrichtigungen; ersetzt `/app/messages`, `/app/connections`, `/app/notifications` (Umleitungen) |
| 5 | Events | `/app/events` | Kommende Events mit Bild, Bewerbungen, eigene Teilnahme – kuratiert von INNER CIRCLE |
| 6 | Profil | `/app/profile` | Identity-Header, Stats-Zeile, Action-Zeile, Vollständigkeit, Tabs Beiträge (Standard, echte Posts oben + Demo unten) · Übersicht · Performance · Angebote |

**Sekundär (zweite Sidebar-Gruppe „Bereiche" + Karten auf Start):**

- `/app/network` – Verzeichnis
- `/app/opportunities` – Chancen
- `/app/jobs` – Jobs & Projekte
- `/app/investments` – Investments (Opportunities + Portfolio)
- `/app/marketplace` – Marketplace
- `/app/learn` – Academy

**Konto-Block (über `/app/profile` + Konto-Sheet):** Member Card, Mitgliedschaft, Mitgliedsantrag, Trust & Performance, Einstellungen (Darstellung, Sprache, Datenschutz, Benachrichtigungen).

### 1c. Membership (aktueller Stand – verbindlich)

- **Preise:** 24,99 € / Monat (2499 ct) und 249,90 € / Jahr (24990 ct) – „2 Monate geschenkt" = 16% Vorteil. Quelle der Wahrheit: `src/lib/membership/plans.ts` (doppelt in `src/lib/env.ts` als `membershipPricing` – Risiko K-17).
- **48h Discovery Trial:** serverseitig, genau einmal pro Konto, 3 Kontaktanfragen (`TRIAL_CONNECTION_LIMIT`), Leserechte, kein Messaging/Posten/Verkaufen/Vollprofil. Ablauf lazy in `getAccessContext()`.
- **Keine zusätzlichen Membership-Tiers.** Nur `free`, `trial`, `member`, `admin` (Level). Keine künstlichen Pakete.
- **Bezahlung:** Stripe Checkout + signierte Webhooks implementiert, aber BLOCKED (keine Schlüssel). Dev-Aktivierung nur ohne Stripe und außerhalb Produktion (`ALLOW_DEV_MEMBERSHIP_ACTIVATION`), klar gekennzeichnet.
- **Mitgliedskarte:** Format `IC-<Jahr>-<5-stellige Nummer>`, öffentliche `publicId`, Status `active`/`expired`.

### 1d. Demo-Daten (verbindliche Regeln – Sprint 6 verschärft)

- **Quelle:** zentral `src/lib/demo/index.ts` (`DEMO_CONTENT_ENABLED` als Notausschalter) + `src/components/app/DemoSections.tsx`.
- **Gating:** echte Daten verdrängen Demo. `/app/network` zeigt Demo-Profile nur wenn echte Liste leer; `/app/profile` zeigt Demo-Beiträge UNTER echten Beiträgen.
- **Sichtbarkeit:** Badge „Demo"/„Beispiel"/„DEMO-PROFIL"/„Beispiel-Event", Hinweistext `app.demo.notice`, Demo-Posts „Demo · keine echten Reaktionen".
- **Verboten (hart):**
  - keine echten Statistiken verändern
  - keinen Trust erzeugen
  - keine echten Deals erzeugen
  - keine echten Connections erzeugen
  - keine echten Umsätze erzeugen
  - keine echten Investments darstellen
  - keine DB-Schreibvorgänge, keine erfundenen Bewertungen, keine Engagement-Zahlen
- **Bilder:** `public/images/demo/*` und `public/images/avatars/*` sind provisorische KI-Platzhalter (kein reales Mitglied, kein Event-Nachweis), klar gekennzeichnet.
- **Zweisprachig:** jedes Demo-Profil hat `en`-Variante je Freitextfeld; neue Demo-Texte immer DE+EN (Parity-Test).
- **Humanisierung (Sprint 6):** Demo-Profile weniger perfekt, unterschiedliche Bio-Längen, Skills 2-4 variabel, Städte gemischt, Completion 54-100% uneven, mehr männliche Profile (Kernzielgruppe männlich) aber gemischt/international, keine stereotypen Rollen. Zielgruppe 20-35: Founder, Unternehmer, Investor, Creator, Consultant, Operator, Freelancer.

### 1e. Events (verbindlich)

- **Öffentliche INNER-CIRCLE-Events werden kuratiert bzw. von INNER CIRCLE/Admin erstellt.** Quelle: `Event`-Tabelle, `state` = `confirmed`/`concept`/`past`/`demo`.
- **Normale Mitglieder dürfen keine öffentlichen Events erstellen.** Keine Route `/app/events/new`, keine Server-Action mit `insert`/`update`/`delete` auf `events`, Create-Sheet-Eintrag deaktiviert mit Hinweis „kuratiert von INNER CIRCLE". Abgesichert durch `tests/unit/event-permissions.test.ts`.
- **Member Eventkarte (Sprint 6):** Bild (wiederverwendet aus Public-Assets), Titel, Demo-/Beispiel-Badge falls nötig, Stadt, Datum/geplanter Zeitraum, kurzer Satz, `Event ansehen`.
- **Detailansicht:** Bild, Beschreibung, Location, geplantes Format, Zielgruppe, CTA (Bewerben/Abbestätigen).
- **Public Events-Seite:** ehrlicher Leerzustand, keine erfundenen Termine.

### 1f. Investments – klare Trennung (verbindlich)

- **Investment Opportunities für Mitglieder:** Mitglieder reichen ein (`/app/investments/submit`), Admin prüft (`/admin/investments` → `approved`/`rejected` + Notiz), nur freigegebene sichtbar (`/app/investments` + Detail `/app/investments/[id]`), Absichtserklärung (`expressInvestmentInterestAction`). Beträge ohne Renditeversprechen, regulierte Abläufe (Zeichnung, Zahlung, Verträge) NOT IMPLEMENTED, Rechtsprüfung nötig.
- **INNER CIRCLE Portfolio (IC selbst):** strategische Zielallokation der Plattform-Einnahmen, **keine echten Zahlen, keine Renditeversprechen, keine Vermischung** mit Member-Opportunities. Darstellung: `/app/investments` untere Sektion + `/portfolio` (Public) mit 100-€-Beispiel.
- **UI-Trennung:** zwei getrennte Sektionen mit eigenen Headings, Portfolio als Ziel/Demo gekennzeichnet.

### 1g. Portfolio-Zielmodell (verbindlich)

- **Geplante Allokation:**
  - 20 % der Plattform-Einnahmen → Investmentbudget (Ziel, nach Steuern/Kosten/Rücklagen/Rechtsprüfung)
  - davon:
    - 25 % des Investmentbudgets → Unternehmen / Projekte aus dem Netzwerk
    - 75 % → externe Investments
  - entspricht:
    - 5 % der Gesamteinnahmen → Netzwerk-Unternehmen / Projekte
    - 15 % → externe Investments
- **Visualisierung (Sprint 6):** kleine CSS-only Allocation-Bar (5% electric, 15% forest, Rest muted), 100-€-Beispiel (100€ → 20€ → 5€/15€), klar als Zielmodell gekennzeichnet (`PORTFOLIO_ALLOCATION`, `PORTFOLIO_EXAMPLE_EUR`).
- **Regeln:**
  - Keine Renditeversprechen.
  - Nicht als Hedgefonds bezeichnen.
  - Kein Fonds, keine Vermögensverwaltung.
  - Transparenz: bezahlende Mitglieder sollen später nachvollziehen können, wie viel, in welche Kategorien, welche IC-Unternehmen, warum – öffentlich nur ausgewählte Infos.

### 1h. Branding (verbindlich)

- Aktueller Name **INNER CIRCLE** ist Arbeits-/Bestandsname.
- Rebranding kommt später, **nicht jetzt ändern**.
- Logo, Farben (Midnight Navy #10151E, Electric Blue #366CF5, Forest Green #12805C, Sand #CBB694, Off White #F7F8FA), Typografie (Inter self-hosted) bleiben eingefroren (`10-design-freeze.md`).
- Kein neues Logo, kein neuer Name in diesem Sprint.

## 2. Technische Kurzfassung

| Frage | Antwort |
| ----- | ------- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript (strict) |
| Styling | Tailwind CSS v4 + eigene Design-Tokens in `src/app/globals.css` |
| Datenbank | SQLite-Familie: **Cloudflare D1** (`DB`-Binding) in Produktion, **libSQL** lokal/Tests |
| ORM | Drizzle ORM (`src/db/schema.ts`, Migrationen in `drizzle/`) |
| Auth | **Eigene** Session-/Passwort-/OTP-Implementierung (scrypt, SHA-256-Session-Token, httpOnly-Cookie `ic_session`). Kein Auth.js. |
| Hosting | **Cloudflare Workers** über den OpenNext-Adapter |
| Deployment | Build `npm run cf:build` · Deploy `npm run cf:release` · Production-Branch `main` |
| Datenbank (Produktion) | D1 `inner-circle-db`, Binding `DB`, Migrationen in `drizzle/` |
| i18n | Eigenes Wörterbuch `src/lib/i18n` (DE = Standard, EN vollständig) |
| Tests | Vitest: **20 Dateien / 106 Tests grün** (`npm test`) |
| App-Navigation | **6 Primärbereiche**: Start · Discover · Erstellen · Inbox · Events · Profil |

## 3. Status-Legende (verbindlich)

| Status | Bedeutung |
| ------ | --------- |
| **WORKING** | Im Code vollständig implementiert **und** durch Tests oder nachvollziehbare manuelle Verifikation bestätigt. |
| **PARTIAL** | Teilweise implementiert, im Alltag noch nicht vollständig nutzbar. |
| **PREPARED** | Datenmodell/UI/Architektur existiert, die Funktion ist aber nicht aktiv. |
| **BLOCKED** | Code existiert, eine externe Abhängigkeit fehlt (Schlüssel, Konto, Anbieter, Recht). |
| **NOT IMPLEMENTED** | Noch nicht umgesetzt. |
| **DEPRECATED** | Nicht mehr verwenden. |

**Regel:** Eine Funktion ist **niemals** WORKING, nur weil eine UI dafür
existiert. Backend + Daten + Berechtigungen + Nachweis gehören dazu.

## 4. Statusübersicht der Produktbereiche

### A. Public Website – WORKING

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Startseite `/` – Conversion-Flow (Hero mit 3 Outcomes + Preis-Hinweis → schmales 20-%-Kapital-Band → Membership-Preis → 6 Kernbereiche → Events → CTA) | WORKING | `src/app/(site)/HomeContent.tsx`; Hero-Bild unverändert, Hero nennt beide Preise (24,99 €/249,90 €); **statisch vorgeneriert** |
| Preview-Seiten `/network`, `/business-deals`, `/investments`, `/marketplace`, `/events` | WORKING | statische Inhalte, nicht aktivierte Funktionen als „Demnächst verfügbar\" gekennzeichnet; **statisch vorgeneriert** |
| `/portfolio` – INNER CIRCLE Portfolio (Arbeitstitel) | WORKING | `src/app/(site)/portfolio/`; 20-%-/25-%-/75-%-Modell (bezogen auf 100 %: 5 % IC / 15 % extern) + 100-€-Beispiel; **kein Fonds, keine Renditeversprechen**; transparent als geplante strategische Zielallokation; **statisch vorgeneriert** |
| `/membership` (Preise, Leistungen) | WORKING | 24,99 €/Monat **und** 249,90 €/Jahr („2 Monate geschenkt\"); K-03 gelöst, Checkout weiter Dev-Aktivierung bis Stripe scharf ist |
| Auth-Seiten `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` | WORKING | siehe Bereich B |
| Rechts-Platzhalter `/imprint`, `/privacy`, `/terms` | PARTIAL | bewusst Platzhalter, kein geprüfter Rechtstext |
| `/design` (internes Design-System) | WORKING | nur Styleguide, kein Produktfeature |
| 404 | WORKING | `src/app/(site)/not-found.tsx` |

### B. Authentication & Identity

| Funktion | Status | Nachweis / Einschränkung |
| -------- | ------ | ------------------------ |
| Registrierung E-Mail + Passwort | WORKING | `registerAction`, `tests/integration/auth-flow.test.ts`; Felder bleiben bei Validierungsfehler erhalten, Feldfehler inline |
| Passwort-Hashing (scrypt, OWASP-Parameter) | WORKING | `tests/unit/auth-crypto.test.ts` |
| Login | WORKING | `loginAction`, Integrationstest; bei falschem Passwort bleibt E-Mail erhalten, kein Reload, Meldung „E-Mail-Adresse oder Passwort nicht korrekt." |
| Logout (Session-Widerruf serverseitig) | WORKING | `logoutAction`, `/api/auth/logout` |
| Sessions (30 Tage, httpOnly, gehasht) | WORKING | `src/lib/auth/session.ts`; zusätzlich nicht-httpOnly-Präsenz-Flag `ic_presence` in Lockstep mit `ic_session` (nur für den „Zur App\"-CTA der öffentlichen Seiten, keine Identität, keine Autorisierung) |
| E-Mail-Verifizierung (Code-Erzeugung, Hash, Ablauf, Versuche) | WORKING | `src/lib/auth/otp.ts`, `onboarding.test.ts` |
| **Echter E-Mail-Versand (Resend)** | **WORKING / PARTIAL (DNS offen)** | `RESEND_API_KEY` aktiv; responsive Multipart-Templates (HTML+Text DE/EN); offene Produktionsabhängigkeit: eigene verifizierte Domain (SPF/DKIM/DMARC) gegen Spamfilter der Test-Domain `resend.dev`; **Custom Domain in diesem Sprint bewusst PAUSIERT** |
| Verifizierung im Dev-Postausgang | WORKING | `ENABLE_DEV_OUTBOX` + Admin-Rolle, Testabdeckung `message-delivery.test.ts` |
| SMS-Verifizierung (Twilio) | BLOCKED | kein Twilio-Konto/Schlüssel |
| Registrierung per Telefonnummer | NOT IMPLEMENTED | UI-Umschalter existiert, Übermittlung schlägt fehl (Known Issue K-05) |
| Google OAuth | NOT IMPLEMENTED | Button zeigt „Einrichtung erforderlich\", Route `/api/auth/oauth/google` existiert **nicht** |
| Apple OAuth | NOT IMPLEMENTED | wie Google |
| Passwort vergessen/zurücksetzen | PARTIAL | Mechanik + Token + Session-Widerruf WORKING; Versandweg ohne Provider = Dev-Postausgang oder gar nicht |
| Rollen (`user` / `admin`) | WORKING | `User.role`, `requireAdmin()` |
| 2FA (`login_2fa`) | PREPARED | Enum-Wert im Schema, keine UI/Logik |

### C. Trial & Membership

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Free-Account (Status `free`) | WORKING | `entitlementsFor(\"free\")` |
| 48-h-Discovery-Trial (serverseitig, einmalig, Ablauf) | WORKING | `src/lib/trial/service.ts`, `tests/integration/trial.test.ts` |
| Trial-Einschränkungen (3 Kontaktanfragen, nur lesend) | WORKING | `TRIAL_CONNECTION_LIMIT`, `entitlements` |
| Paid Membership (Monat/Jahr) über Service | WORKING | `src/lib/membership/service.ts`, `tests/integration/membership.test.ts` |
| Stripe-Checkout + signierte Webhooks | BLOCKED | Code vollständig (`/api/billing/checkout`, `/api/webhooks/stripe`, `webhook.test.ts`), aber kein Stripe-Konto/Schlüssel |
| Dev-Mitgliedschaftsaktivierung (klar gekennzeichnet) | WORKING | nur ohne Stripe und außerhalb Produktion (`ALLOW_DEV_MEMBERSHIP_ACTIVATION`) |
| Mitgliedskarte (Nummer + öffentliche Verifizierung) | WORKING | `issueCardIfNeeded`, `/member/[publicId]` |
| Paywall/Weiterleitung unterhalb des Levels | WORKING | `requireAccess()`, `/app/billing?paywall=…` |
| Mitgliedsantrag mit manueller Prüfung | WORKING | `/app/membership-application`, Admin-Prüfung |
| Rechnungen (`Invoice`) | PREPARED | Tabelle + `recordInvoice()`, keine echten Rechnungen ohne Stripe |

### D. Member Profiles

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Profil ansehen/bearbeiten (Bio, Rolle, Firma, Links, **„Ich biete"**) | WORKING | `/app/profile`, `/app/profile/edit`; **LinkedIn aus UI entfernt und deprecated** (DB-Spalte für Datenintegrität erhalten); Instagram, X und Website sekundär; IC-Business-Identität priorisiert |
| **Profil als Hauptbereich** (Header + Tabs Übersicht/Aktivitäten/Performance/Angebote) | WORKING | `/app/profile?tab=…`; Profilfortschritt, Trust & Performance und Konto-Links (Member Card, Mitgliedschaft, Einstellungen) leben hier; Sprint 6: socialere Hierarchie (Avatar, Name, Handle, Bio, Rolle, Standort oben; kompakte Stats Follower/Folgt/Connections/Trust; Actions Bearbeiten/Teilen/Einstellungen; Vollständigkeit kompakt) |
| Interessen & Ziele (Onboarding-Taxonomie) | WORKING | `/onboarding/interests`, `completeOnboardingAction`, Apple-artiges UX-Design, strukturierte Gruppen, mind. 3 Pflicht, `onboarding.test.ts` |
| **Interessen & Ziele nach dem Onboarding ändern** | WORKING | `/app/profile/edit` → „Interessen & Ziele", `updateInterestsAction`, dieselbe Taxonomie (`Interest`/`Goal`), `profile-preferences.test.ts` |
| Statistiken (Kontakte, Follower, Trust Score) | WORKING | `/app/profile`, `profileStats()`, `performanceCountsFor()` |
| **Sichtbarkeit einzelner Business-Zahlen** | WORKING | `PrivacySettings.metricsVisibilityJson` (7 Kennzahlen), `/app/settings`, erzwungen in `/app/profile?tab=performance` |
| Trust & Performance (eigene Sicht) | PARTIAL | `/app/profile?tab=performance` (+ `/app/trust` als Detailseite); Bewertungen können **nicht** abgegeben werden (Verifikations-Pipeline fehlt) |
| Öffentliche Mitgliedskarte verifizieren | WORKING | `/member/[publicId]` |
| Activity Feed (Posts) | WORKING | `Post`, `createPostAction`, Feed auf Dashboard; Sprint 6: 3-6 hochwertige Demo-Beiträge (Founder Update, neues Projekt, Suche Partner, Event-Erfahrung, neuer Service, Meilenstein) klar als Demo markiert, keine Metrik-Veränderung |
| Profilsichtbarkeit / Datenschutz-Einstellungen | PARTIAL | Werte werden gespeichert (`PrivacySettings`), aber nicht überall in Queries erzwungen |
| Avatar-/Cover-Upload | NOT IMPLEMENTED | nur URL-Feld; kein Storage-Anbieter (S3/R2) angebunden |

### E. Network

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Member Discovery (Verzeichnis mit Suche/Filter) | WORKING | `/app/network`, `listDirectoryMembers()`; Sprint 6 humanisiert: 20-35, Mix Founder/Unternehmer/Investor/Creator/Consultant/Operator/Freelancer, uneven Bios/Skills, Städte variabel |
| Follow | WORKING | `followAction` |
| Connection Requests (senden/annehmen/ablehnen/zurückziehen) | WORKING | `network.ts`, `connection-request.test.ts`, `messaging-authorization.test.ts` |
| **Verbindungsanfrage nur mit Pflichtnachricht** (min. 10 Zeichen) | WORKING | serverseitig in `sendConnectionRequestAction` (`CONNECTION_MESSAGE_MIN_LENGTH`), UI `ConnectDialog`, `connection-request.test.ts` |
| **Discover** (Business-Karten, Relevanz-Ranking, Filter) | WORKING | `/app/discover`, `DiscoverDeck`, `src/lib/discover/matching.ts`, `discover-matching.test.ts`; Sprint 6 humanisiert, keine 3-Skills-Zwang |
| Messaging (nur zwischen verbundenen Konten) | WORKING | `message-delivery`, `messaging-authorization` Tests |
| Blockieren | WORKING | `Block`, `blockMemberAction` |
| Notifications (in-App, i18n, Dedupe) | WORKING | `Notification`, `notify()` |
| E-Mail-Benachrichtigungen | BLOCKED | hängt am E-Mail-Provider |
| Gruppen/Communities | NOT IMPLEMENTED | Schema hat keine Gruppen-Tabellen |

### F. Business

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Business Opportunities anlegen/verwalten | WORKING | `/app/opportunities/new`, `createOpportunityAction` |
| Bewerbungen + Antwort (annehmen/ablehnen/zurückziehen) | WORKING | `applyToOpportunityAction`, `respondApplicationAction` |
| Jobs & Projekte (gefilterte Chancen-Ansicht) | WORKING | `/app/jobs` |
| Deal Detailansicht (Sprint 6) | WORKING | `/app/opportunities/[id]` + Demo-Detail-Dialog in `DemoSections.tsx`; jeder „Deal ansehen"-CTA öffnet Detail oder Demo-Detail (Titel, Demo-Badge, Kategorie, Branche, Standort, Beschreibung, gesucht, angeboten, Deal-Struktur, Größe, Ansprechpartner, CTA; bei Demo Hinweis „Dies ist ein Beispiel-Deal.") |
| Deal Rooms (private Räume, Dokumente, Meilensteine) | NOT IMPLEMENTED | keine Tabellen, keine UI |
| Provisions-Engine | NOT IMPLEMENTED | – |
| Vertraulichkeitsstufen über „standard\" hinaus | PREPARED | `BusinessOpportunity.confidentiality` existiert, Logik fehlt |

### G. Marketplace & Academy

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Listings anlegen/publizieren (Services, Produkte, Kurse) | WORKING | `/app/marketplace/new`, `createListingAction` |
| Listings browsen/Detailseite | WORKING | `/app/marketplace`, `/app/marketplace/[id]`; Sprint 6: kein Dead Button, CTA öffnet Detail oder Demo-Dialog |
| Kurse: Struktur (Module, Lektionen), Enrollment, Fortschritt | WORKING | `Course`/`CourseModule`/`Lesson`/`Enrollment`/`LessonProgress` |
| **Kauf/Bezahlung** von Produkten, Services, Kursen | NOT IMPLEMENTED | kein Checkout, keine Bestell-/Zahlungstabellen; Kurszugang wird als „gewährt\" ohne Zahlung protokolliert |
| Verkäuferprofile/Freigabe-Workflow | PARTIAL | `SellerProfile`-Tabelle + Admin-Freigabeaktion; keine UI zum Beantragen |
| Zertifikate, Video, Buchungen | NOT IMPLEMENTED | – |

### H. Investments

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Opportunities einreichen (Mitglied) | WORKING | `/app/investments/submit`, `submitInvestmentAction` |
| Admin-Prüfung (approved/rejected + Notiz) | WORKING | `/admin/investments`, `reviewInvestmentAction` |
| Listings + Detailseite (nur freigegebene sichtbar) | WORKING | `/app/investments`, `/app/investments/[id]` |
| Unterstruktur: „Investment Opportunities\" (Mitglieder) + „INNER CIRCLE Portfolio\" (IC selbst) | WORKING | `/app/investments`; zwei getrennte Sektionen; Portfolio als strategische Zielallokation (20 % → 25 % IC / 75 % extern = 5 % / 15 %), **keine echten Zahlen, keine Renditeversprechen**, keine Vermischung; kleine Allocation-Visualisierung (CSS-only) |
| Absichtserklärungen (Interesse ausdrücken) | WORKING | `expressInvestmentInterestAction` |
| Regulierte Abläufe (Zeichnung, Zahlung, Verträge, Dokumente) | NOT IMPLEMENTED | bewusst offen, Rechtsprüfung nötig |

### I. Events

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Events ansehen (Mitgliederbereich) | WORKING | `/app/events`, `Event`-Tabelle; Sprint 6: Karten mit Bild (wiederverwendet aus Public), Titel, Demo-Badge, Stadt, Datum, kurzer Satz, „Event ansehen" |
| Bewerben/Abbestätigen, Warteliste-Flag | WORKING (Datenmodell) | `applyToEventAction`, `cancelEventApplicationAction` |
| Tickets, QR-Check-in, Attendance | NOT IMPLEMENTED | Bewerbungen existieren, keine Ticket-/Check-in-Tabellen |
| Events anlegen (Mitglieder) | **NOT IMPLEMENTED – bewusst** | INNER CIRCLE kuratiert Events selbst; kein Create-Eintrag, keine Route, keine Server-Action – abgesichert durch `event-permissions.test.ts` |
| Öffentliche Events-Seite mit echten Daten | PARTIAL | `/events` ist eine öffentliche Preview mit ehrlichem Leerzustand |

### J. Trust & Performance

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Trust-Score-Anzeige (leer, ohne erfundene Werte) | PARTIAL | `TrustScoreSummary`, `/app/profile?tab=performance` und `/app/trust`; **kein eigener Navigationspunkt mehr**; ohne verifizierte Bewertungen bleibt der Score leer |
| Bewertungen abgeben | NOT IMPLEMENTED | bewusst nicht aktiv (Verifikationskontext fehlt) |
| Performance-Records (Kennzahlen) | PREPARED | Tabelle + Admin-freie Anzeige, keine Eingabemaske |
| Badges | PARTIAL | `Badge`/`UserBadge` + Taxonomie vorhanden, Zuweisung nur per Seed/DB |
| Founding Member | PREPARED | Felder + Admin-Aktion vorhanden |

### K. Administration

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Admin-Konsole (Kennzahlen) | WORKING | `/admin` |
| Nutzerverwaltung (Sperren, Founding Member) | WORKING | `/admin/users`, `admin.ts` |
| Investment-Prüfung | WORKING | `/admin/investments` |
| Mitgliedsanträge prüfen | WORKING | `/admin/applications` |
| Löschanträge bearbeiten | WORKING | `processDeletionRequestAction` |
| Audit-Log | WORKING | `AdminAuditLog`, `audit()` |
| Moderations-Queue (`Report`) | PREPARED | Tabelle vorhanden, keine UI/Aktion |
| Rollenstufen (Support/Moderation/Finanzen) | NOT IMPLEMENTED | nur `user` \| `admin` |
| Dev-Postausgang (`/dev/outbox`) | WORKING | nur mit `ENABLE_DEV_OUTBOX=true` und Rolle `admin` |

### L. Infrastructure

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Cloudflare-Worker-Konfiguration (OpenNext) | WORKING | `wrangler.jsonc`, `open-next.config.ts`; `npm run cf:build` läuft in dieser Session grün |
| D1-Anbindung + Migrationen (50 Tabellen) | WORKING | `drizzle/0000_init.sql`, `cf:release` |
| Laufzeit-Treiberwechsel D1 ↔ libSQL | WORKING | `src/db/client.ts` |
| Deployment über Workers Builds (main → Produktion) | PARTIAL | dokumentierter Weg; letzter Merge nach `main` durch den Gründer zu prüfen (Dashboard) |
| Automatisierte Tests | WORKING | **106 Tests grün (20 Testdateien)** |
| CI (GitHub Actions) | NOT IMPLEMENTED | keine Workflows im Repo |
| Lint | PARTIAL | **13 bestehende Hinweise (5 Fehler, 8 Warnungen)** – vorbestehend, keine neuen Befunde |
| Monitoring/Alerting | PREPARED | Observability im Worker aktiv, keine Alarme |

## 4a. Demo-Content (verbindliche Regeln)

- **Quelle:** alles Fiktive lebt zentral in `src/lib/demo/index.ts`
  (`DEMO_CONTENT_ENABLED` als Notausschalter) und wird über
  `src/components/app/DemoSections.tsx` gerendert.
- **Gating:** echte Daten verdrängen Demo-Daten. `/app/network` zeigt die
  Beispielprofile nur, wenn die echte Mitgliederliste leer ist; `/app/profile`
  blendet die Beispielbeiträge **unter** den echten Beiträgen ein.
- **Sichtbarkeit:** Badge „Demo\"/„Beispiel\"/„DEMO-PROFIL\", Hinweistext
  `app.demo.notice` bzw. `app.profile.activityLead`; Demo-Posts tragen
  „Demo · keine echten Reaktionen".
- **Verboten:** keine DB-Schreibvorgänge, keine erfundenen Umsätze, Trust-Scores,
  Bewertungen, Verifizierungen oder Engagement-Zahlen; Demo-Profile werden nie
  in Statistiken gezählt. Zusätzlich Sprint-6-Regel: Demo darf keine echten
  Statistiken verändern, keinen Trust erzeugen, keine echten Deals/Connections/Umsätze/Investments darstellen.
- **Bilder:** `public/images/demo/*` und `public/images/avatars/*` sind
  provisorische, KI-generierte Platzhalter (kein reales Mitglied, kein
  Event-Nachweis) und bleiben als solche gekennzeichnet.
- **Zweisprachig:** Demo-Profile tragen eine englische Variante je Freitextfeld
  (`DemoProfile.en`); neue Demo-Texte immer DE **und** EN (i18n-Parity-Test).
- **Humanisierung:** unterschiedliche Bio-Längen, Interessen, Skills (2-4), Städte,
  Ziele, Completion uneven, mehr männliche Profile okay (Kernzielgruppe), aber
  gemischt/international, keine stereotypen Rollen.

---

## 4b. Informationsarchitektur ab Sprint 3

**Public-Website-Performance (Incident-Fix 2026-09-21, Error 1102):** Die
öffentlichen Marketing-Seiten (`/`, `/network`, `/business-deals`,
`/investments`, `/portfolio`, `/marketplace`, `/events`, `/membership`, `/register`) sind
**statisch vorgerendert** (`○` im Build-Route-Manifest) und führen **keine**
Request-Time-Datenbankzugriffe und **kein** `getAccessContext()` mehr aus.
Die ehemalige Statistik-Sektion der Homepage („Was durch das Netzwerk
entsteht") wurde durch einen kompakten Portfolio-Teaser ersetzt;
`src/app/(site)/home-metrics.ts` / `StatsSection` werden von der Homepage
nicht mehr verwendet (bleiben bis zur ausdrücklichen Ausmusterung erhalten). Der Header-„Zur App\"-CTA basiert auf dem nicht-httpOnly-Flag
`ic_presence` (in Lockstep mit `ic_session`), das **nichts autorisiert**.
Details: @see `docs/09-deployment.md` (Fehlerzeile 1102).

**Primärnavigation (Desktop-Sidebar und Mobile Bottom-Bar) – exakt sechs
Bereiche:**

| # | Bereich | Route | Inhalt |
| - | ------- | ----- | ------ |
| 1 | **Start** | `/app` | kompakte Kopfzeile (`Hallo, <Name>` + Trial-Chip + Inbox-Shortcut) und die sechs Kernbereichs-Karten als **2×3-Raster auf Desktop** (Tablet ebenfalls 2-spaltig, Mobile 1-spaltig) – größere, ruhigere Cards |
| 2 | **Discover** | `/app/discover` | Business-Karten mit Pflicht-Connect-Nachricht, Relevanz-Ranking, **kompakte Filterleiste** (Standort, Umkreis, Rolle, Branche) + „Mehr Filter“ (Interesse, Typ, Ich suche, Ich biete, Investmentinteressen), aktive Filter als entfernbare Chips, „Filter zurücksetzen“, ehrliche Leerzustände – echte Treffer haben Vorrang, Demonstration nur im Leerzustand (`DiscoverDemoSection`) |
| 3 | **Erstellen** | Create-Sheet (Desktop-Button / Mobile `+`) | Business Deal · Job/Projekt · Investment · Marketplace-Angebot · Kurs · Beitrag |
| 4 | **Inbox** | `/app/inbox` | Nachrichten · Anfragen · Benachrichtigungen (Segmented Control) |
| 5 | **Events** | `/app/events` | kommende Events, Bewerbungen, eigene Teilnahme – kuratiert von INNER CIRCLE |
| 6 | **Profil** | `/app/profile` | Business Identity: kompakten Header (Avatar, Name, Handle, Positionierung), Statistikzeile (Follower · Folgt · Business Connections · Trust Score), separate Action-Zeile (Profil bearbeiten · Profil teilen · Einstellungen), schmaler Profilfortschritt, Tabs Beiträge · Übersicht · Performance · Angebote zentriert (Beiträge = Standard, echte Posts oben, darunter klar markierte Beispielbeiträge); Interessen & Ziele und sekundäre Infos als Accordions (eingeklappt) |

**UX-Follow-up (2026-09-21, ausdrücklicher Gründerauftrag):** Start zeigt die
sechs Kernbereiche jetzt als **2×3-Raster** (Desktop/Tablet 2 Spalten, Mobile
1 Spalte) mit größeren, ruhigeren Cards. Discover erhält eine kompakte
Filterleiste mit aktiven Filter-Chips, „Mehr Filter“ und „Filter
zurücksetzen“; neu sind Umkreis (ehrlich: nur für Städte der gebündelten
Offline-Tabelle `CITY_COORDINATES`, sonst exakte Suche mit Hinweis), „Ich
suche“, „Ich biete“ und Investmentinteressen (kuratierter Taxonomie-Subset
`INVESTMENT_INTEREST_SLUGS`). Das Profil ist komprimiert: Identity-Header,
Statistikzeile, Action-Zeile, schmaler Fortschritt, zentrierte
Tab-Navigation, Interessen & Ziele sowie sekundäre Informationen als Accordions
(native `<details>`, kein Client-JS). Der CPU-Incident-Fix (PR #10, statische
öffentliche Seiten) wurde **nicht** angerissen; Auth, Resend, Trial,
Membership und öffentliche Homepage sind unverändert.

**Unter geordnet (nicht gelöscht):** Netzwerk, Chancen, Jobs & Projekte,
Investments, Marketplace, Academy erscheinen als zweite Sidebar-Gruppe
„Bereiche" und als Karten auf Start. Member Card, Mitgliedschaft,
Mitgliedsantrag, Trust & Performance und Einstellungen sind über
`/app/profile` (Konto-Block) bzw. das Konto-Sheet erreichbar – nicht mehr als
eigene Navigationspunkte.

**Umleitungen für bestehende Deep Links:** `/app/messages` →
`/app/inbox?tab=messages`, `/app/connections?tab=x` →
`/app/inbox?tab=requests&sub=x`, `/app/notifications` →
`/app/inbox?tab=notifications`. Alle Query-Parameter (`?c=`, `?to=`) bleiben
erhalten.

**Trust & Performance** ist kein Start- oder Navigationsbereich mehr, sondern
`/app/profile?tab=performance` (Trust Score, Bewertungen, verifizierte
Kennzahlen, Badges) plus die Detailseite `/app/trust`.

**Theme:** `/app/settings` → „Darstellung\" mit Hell / Dunkel / System,
gespeichert über die bestehende `ThemeProvider`-Infrastruktur (localStorage +
FOUC-freies Init-Skript). Es wurde **keine** zweite Theme-Engine gebaut.

**Layout:** Der App-Bereich nutzt `.ic-app-main` (max. 120rem, zentriert) mit
einem 12-Spalten-Raster (`.ic-grid`, `.ic-span-4/6/8/12`) und Textmaßen
`.ic-measure` / `.ic-measure-wide`. Dadurch füllt die App 1280–1920 px aus und
lässt auf 2560 px symmetrische Ränder statt einer toten rechten Fläche.

## 5. Dokumentenindex

| Datei | Inhalt |
| ----- | ------ |
| [`00-SOURCE-OF-TRUTH.md`](00-SOURCE-OF-TRUTH.md) | Diese Datei – Einstieg, Statusübersicht, Reihenfolge |
| [`01-product.md`](01-product.md) | Produktvision, Geschäftsmodell, MVP-Umfang, Produktbereiche |
| [`02-architecture.md`](02-architecture.md) | Technische Architektur im Ist-Zustand, Verzeichnisstruktur, Schichten |
| [`03-routes.md`](03-routes.md) | vollständige Route-Map + Server Actions + API-Routen + Route-Matrix |
| [`04-auth-membership.md`](04-auth-membership.md) | Auth-Flow, Verifizierung, Trial, Membership, Onboarding, Fehlerzustände |
| [`05-database.md`](05-database.md) | Datenmodell: 50 Tabellen gruppiert, Beziehungen, aktiv vs. vorbereitet |
| [`06-permissions.md`](06-permissions.md) | Zugangsstufen, Berechtigungsmatrix (Ist-Zustand), Rollen |
| [`07-integrations.md`](07-integrations.md) | externe Dienste, Status, Gründer-Aufgaben |
| [`08-testing.md`](08-testing.md) | Testmatrix (automatisiert/manuell/offen) + Definition of Done |
| [`09-deployment.md`](09-deployment.md) | Cloudflare-Deployment-Runbook, Betrieb, häufige Fehler |
| [`10-design-freeze.md`](10-design-freeze.md) | **Design Freeze** – geschützte visuelle Bereiche, erlaubte Ausnahmen |
| [`11-known-issues.md`](11-known-issues.md) | bekannte Probleme mit Ursache und Status |
| [`12-roadmap.md`](12-roadmap.md) | Roadmap ab dem aktuellen Stand (NEXT/SOON/LATER/LEGAL) |
| [`13-decisions.md`](13-decisions.md) | Architektur- und Produktentscheidungen (ADRs) |
| [`14-environment.md`](14-environment.md) | **die eine Wahrheit** zu Umgebungsvariablen und Secrets |
| [`archive/04-progress-log.md`](archive/04-progress-log.md) | historisches Fortschrittsprotokoll – **DEPRECATED als Statusquelle** |
| [`../AGENTS.md`](../AGENTS.md) | Startanweisung für KI-Agenten |
| [`../README.md`](../README.md) | Einstieg für Menschen (Setup, Struktur) |

## 6. Was niemals ohne ausdrücklichen Auftrag geändert werden darf

1. **Das Design** – siehe [`10-design-freeze.md`](10-design-freeze.md):
   Startseite, Bilder, Farben, Typografie, Layout, Navigation, Mobile-Richtung,
   Mitgliederbereich-Visuals.
2. **Bestehende, funktionierende Funktionen** (Bereiche A–L oben, Status
   WORKING) – nicht neu schreiben, nicht „verbessern", nicht umbenennen.
3. **Sicherheitsmechanismen**: serverseitige Autorisierung, Session-Handling,
   Webhook-Signaturprüfung, Dev-Postausgang (admin-only + Allowlist),
   Rate-Limits, „kein stiller Nachrichtenverlust".
4. **Die Berechtigungslogik** in `src/lib/access/*` ohne Aktualisierung von
   [`06-permissions.md`](06-permissions.md).
5. **Das Datenbankschema** ohne Migration (`drizzle/`) und ohne Aktualisierung
   von [`05-database.md`](05-database.md).
6. **Branding/Name/Logo** – INNER CIRCLE bleibt Arbeitsname, Rebranding später.
7. **Domain/Resend Custom Domain** – in diesem Sprint bewusst PAUSIERT, nicht einrichten.

## 7. Projektregeln (Kurzfassung, verbindlich)

1. **Keine Dead Buttons / keine Fake Features** – jeder sichtbare Button
   funktioniert, ist deaktiviert oder klar als „Demnächst verfügbar\" /
   „Einrichtung erforderlich\" gekennzeichnet. Keine UI darf eine Funktion
   behaupten, die das Backend nicht hat. Siehe
   [`11-known-issues.md`](11-known-issues.md) für die aktuell bekannten
   Abweichungen.
2. **Ehrliche Zustände** – kein Erfolg ohne echte Wirkung (Nachrichten:
   `provider` / `dev` / `none`; Zahlungen: nur per signiertem Webhook).
3. **Keine erfundenen Nutzer, Umsätze oder Erfolgsgeschichten.**
4. **Secrets nur in Umgebungsvariablen**, niemals im Repository
   ([`14-environment.md`](14-environment.md)).
5. **Deutsch und Englisch** über `src/lib/i18n`, kein Hardcodetext in
   Komponenten; Light und Dark immer prüfen.
6. **Ein Auftrag, ein Scope** – siehe Change Protocol in
   [`../AGENTS.md`](../AGENTS.md).
7. **Dokumentation ist Teil der Lieferung:** jede größere Änderung aktualisiert
   diese Datei und das betroffene Detaildokument.
8. **Demo-Regel (Sprint 6):** Demo-Inhalte dürfen keine echten Statistiken
   verändern, keinen Trust erzeugen, keine echten Deals/Connections/Umsätze/Investments
   darstellen – Badge + Hinweis Pflicht.

## 8. Nächster empfohlener Schritt

**Stabilisierung → Struktur → Funktional → Humanisierung (Sprint 6).**
Danach: eigene verifizierte E-Mail-Domain für die Produktion (Resend-Domain anlegen,
SPF/DKIM/DMARC im DNS konfigurieren, `EMAIL_FROM` auf die verifizierte Domain
setzen, um Spam-Filterung der Resend-Sandbox `resend.dev` vollständig zu
beseitigen). Details: [`07-integrations.md`](07-integrations.md) und
[`12-roadmap.md`](12-roadmap.md) → Abschnitt NEXT.
