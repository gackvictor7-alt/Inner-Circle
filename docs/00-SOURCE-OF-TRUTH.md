# 00 – SOURCE OF TRUTH (INNER CIRCLE)

**Diese Datei ist der verbindliche Einstiegspunkt für jeden Menschen und jeden
KI-Agenten, der an diesem Repository arbeitet.**

- **Stand:** 2026-09-24 (Sprint 13 – **Profil: einheitliches Speichern & Foto-Upload** (Gründerauftrag):
  `/app/profile/edit` hat **einen** Speicherbutton für die ganze Seite – ein Klick speichert
  Profilfelder **und** Interessen & Ziele gemeinsam (`updateProfileAction` mit `saveInterests`-Marker,
  Success-Banner `?saved=all`, `beforeunload`-Schutz bei ungespeicherten Änderungen; die frühere
  zweite Interessen-Form `updateInterestsAction` ist entfernt). Dazu direkter **Foto-Upload**
  („Foto auswählen“, JPG/PNG/WebP, max. 5 MB, Magic-Byte-Prüfung in Browser **und** Server):
  Bilder liegen im R2-Bucket `inner-circle-media` (Binding `MEDIA`, Schlüssel
  `avatars/<userId>/<zufall>.<ext>`) und werden über `/api/media/<key>` bzw. optional
  `R2_PUBLIC_BASE_URL` ausgeliefert – **nie** als Base64 in D1 (`src/lib/media.ts`,
  `src/lib/storage.ts`, `media-validation.test.ts`, Browser-E2E 39/39,
  `tests/e2e/profile-save-upload.mjs`). Das URL-Feld bleibt als optionale Alternative.
  Deploy-Voraussetzung: R2-Bucket + Binding laut `09-deployment.md` §„Bildspeicher (R2)“
  (Wrangler-Provisioning legt den Bucket beim ersten Deploy automatisch an).
  Davor: Sprint 12 – **Private Beta & echtes Networking**:
  persönliche, einmalige Beta-Schlüssel (`/admin/beta`, gespeichert nur als
  HMAC) schalten nach normaler Registrierung + Verifizierung einen
  **separaten, zeitlich begrenzten Beta-Zugang** frei (Standard 30 Tage,
  verlängerbar/widerrufbar) – **keine** Mitgliedschaft, keine Zahlung, nur
  Networking (Mitglieder finden, Anfragen mit Nachricht, Annehmen, Chat mit
  bestätigten Kontakten). Serverseitig in der bestehenden Rechte-Matrix
  (`06-permissions.md` §3c, ADR-015/016), Datenschutz-Einstellungen im
  Networking erzwungen (§3d, K-06 behoben), keine Match-%/Kennzahlen/Trust in
  Discover, keine Demo-Ergänzung im echten Netzwerk, ein Chat pro Paar,
  Stripe-Webhook geprüft und korrigiert (`04-auth-membership.md` §4a),
  Migration `0002` (52 Tabellen). **Zweite Prüfrunde:** fehlender
  Businessziel-Filter in Discover ergänzt, Browser-E2E mit sechs Testkonten
  65/65 (Skript `tests/e2e/sprint12-browser.mjs`), CPU-Zeit lokal gemessen →
  Workers Paid Voraussetzung (K-24). Details §1c, §1i, K-22. Davor: Sprint 11 – **Discovery-Demo statt Discovery-Trial**:
  die 48-Stunden-Phase nach der Verifizierung ist jetzt eine klar
  gekennzeichnete Demo mit fiktiven Beispielprofilen/-angeboten und zeigt
  **keine** echten Mitglieder, Deals, Jobs oder Investments mehr; echte
  Kontakte/geschützte Funktionen nur mit serverseitig bestätigter
  Mitgliedschaft; echte veröffentlichte Events bleiben für verifizierte
  Nicht-Mitglieder lesbar, Anmeldung serverseitig gesperrt; sieben
  Kontozustände, Migrationsregel ohne Trial-Reset (Details §1c, §1d,
  `04-auth-membership.md` §3, `06-permissions.md` §3b,
  `tests/integration/discovery-demo.test.ts`); außerdem Teil A: dunkle
  Kernbereichs-Sektion der Startseite auf Desktop verbreitert
  (`10-design-freeze.md` 1.16). Davor: Sprint 10 – Live-Nachbesserungen nach PR #23:
  Zugangs-Audit mit sieben Kontozuständen → Seiten-Gating für Free/abgelaufenen
  Trial nachgezogen (`LockedArea`, Dashboard-Filter, Billing ohne tote
  Zahlungsbuttons; Details `06-permissions.md` 3a,
  `tests/integration/access-matrix.test.ts`), Mobile-Hero auf das
  freigegebene Alpine-Motiv, Desktop-Header mit Sprach-/Theme-Wahl ab 1280 px
  ohne Abschneiden, überholte „Registrierung startet später“-Texte korrigiert
  (Details `10-design-freeze.md` 1.15); davor: Sprint 9 – alternierende Ecosystem-Sektion der Public
Homepage (Desktop + Mobile) auf Basis des Checkpoints `arena/01a0ce9d`
finalisiert, Details `10-design-freeze.md` 1.14; davor: Incident-Fix post-Sprint-8: Produktions-500 auf
  `/app` durch rohe `Date`-Binds in `forYouItems()` unter D1 behoben +
  D1-Regressionstest, Details K-20 in
  [`11-known-issues.md`](11-known-issues.md); Sprint 8 – Mobile Public Homepage radikal verkürzt,
  Mobile Member App (Bottom Nav, Mobile-Chat, Mobile-Menü), Core Connection
  Loop vollständig (Discover → Profil → Connect mit Pflichtnachricht → Anfrage
  → Inbox → Annehmen/Ablehnen → Chat → Network), Start „Für dich“ mit echten
  Einträgen, Network-Views (Alle/Verbindungen/Anfragen), listbasierte
  Mobile-Karten für Deals/Jobs/Investments/Events; Sprint 7 – Network
  real+Demo-Kombination, Verbindungsstatus-Richtung (gesendet→Zurückziehen /
  erhalten→Annehmen+Ablehnen), Netzwerk-Filter (Suche/Rolle/Standort/Interesse),
  Demo-Profilansicht `/app/people/demo/[key]`; Sprint 6 – Struktur-Audit,
  Source-of-Truth-Härtung, Auth/Login/Register/Verify-Fixes,
  Language-Switcher-Korrektur, Deals funktional, Button-Audit, Events mit
  Bildern, Profile humanisiert, Demo-Beiträge, Inbox-Empty-States, kleine
  Visualisierungen, AI-Look-Reduktion; Sprint 5 – Mobile-UX der Startseite,
  Login-UX, Demo-Detail-Dialoge, Event-Bilder)
- **Technische Basis:** Abschlussbranch `arena/01a0d501-inner-circle`, auf dem
  gesicherten Sprint-12-Commit `6eebc3d` des Branches
  `arena/01a0d435-inner-circle`; ursprüngliche Basis `main` @
  `8a1b5ea` (Stand nach PR #25/Sprint 11) – Sprint 12 ist **noch nicht
  gemergt** (Review durch den Gründer ausstehend). Vorheriger dokumentierter
  Stand: Branch `arena/01a0d03a-inner-circle` auf `87a244a` (Sprint 11)
- **Sprint-6-Auftrag:** ausdrücklicher Gründerauftrag: bestehendes Projekt
  stabilisieren, strukturieren, funktional machen, humanisieren. Kein Rewrite.
  Keine funktionierende Logik löschen. Domain/Resend-Custom-Domain bewusst
  PAUSIERT. Naming/Logo nicht anfassen.
- **Gültigkeit:** Der **Code im Repository** ist die technische Wahrheit. Diese
  Dokumentation beschreibt, was dort tatsächlich steht – nicht, was geplant war.
- **Design-Status:** siehe [`10-design-freeze.md`](10-design-freeze.md) –
  **APPROVED / DO NOT REDESIGN WITHOUT EXPLICIT FOUNDER REQUEST**

## Sprint 12 – Abschlussprüfung (2026-09-24, kein neuer Sprint)

**WORKING, Review ausstehend; nicht gemergt.** Fortsetzung auf
`arena/01a0d501-inner-circle`, nachgewiesener Vorfahr
`6eebc3d5b8ec9619959ff5515ccf3f0d36171b68` (gesicherter Sprint-12-Stand).
Kein Neustart von main; keine Änderung an Anwendung, Schema, Homepage oder Design.

- Worker-Browser-E2E **82/82** mit sechs isolierten Testkonten; kompletter
  Zwei-Konten-Loop inkl. Registrierung, Verifizierung, Onboarding, Beta-Key,
  Discover/Profil, Anfrage mit Nachricht, Annahme und Nachrichtenaustausch.
- Session nach Onboarding bleibt erhalten (6/6 Konten, Secure/HttpOnly-Cookie
  unverändert, Hard-Reload). Kein reproduzierter Anwendungsfehler.
  **Testfehler korrigiert:** authentifizierter Browser-Linkcheck statt
  cookie-losem APIRequestContext über lokales HTTP; Login-Redirects gelten
  nicht länger als erfolgreicher Seitencheck. Details im Abschlussbericht.
- Tests **35 Dateien / 246 grün**, Typecheck, i18n-Keycheck, Cloudflare-Build,
  Wrangler-Dry-Run und frische lokale D1-Migration grün. **Lint nicht grün:**
  unverändert 5 Fehler / 7 Warnungen (Ausgabe identisch zur Ausgangsbasis, K-15).
- Echte Screenshots aktualisiert; Mobile-Beta-Key, -Profil und -Anfrage ergänzt.
- **Grenzen:** externer E-Mail-Versand/Stripe/Produktionsmigration/Edge-Last nicht
  geprüft; eigene bestehende Chats bleiben nach Beta-Ende lesbar (K-22),
  fremde Chats sind gesperrt. Keine Produktionsdaten verändert.

**Abschlussbericht:** [SPRINT-12-FINAL-REPORT.md](SPRINT-12-FINAL-REPORT.md) ·
**Screenshots:** [Galerie](../preview/sprint12/README.md) ·
**Einzelergebnisse:** [82 Prüfungen](../preview/sprint12/e2e-results-final.json).

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

- `/` – Startseite, **getrennte Informationsdichte je Viewport (Sprint 8)**:
  - **Mobile (`<lg`):** radikal verkürzt – Hero (Headline + EIN kurzer Satz +
    CTA „INNER CIRCLE entdecken“ + kleine Zeile „48h Discovery starten“,
    Facts-Liste ausgeblendet) → 3 Outcomes (je Titel + 1 kurze Zeile) →
    6 Kernbereiche als kompakte gestapelte editorial Rows auf Deep Navy
    (Bild → Nummer → Serif-Titel → 1–2 Sätze → „Entdecken →“, tappt auf die
    Unterseite; Sprint 9, ersetzt die Sprint-8-2×3-Übersicht) → Trust als
    kompakte 3-Punkte-Zeile (keine große Marketing-Section) → Membership
    kompakt (Titel + beide Preise in einer Zeile + CTA „48h Discovery
    starten“) → Footer (2-Spalten-Links unter `sm`). **Keine** Events-/
    Kapital-/Final-CTA-Sections auf Mobile.
  - **Desktop (`lg+`):** unverändert – Hero (beide Preise) → 3 Outcomes (volle
    Sätze) → 6 Kernbereiche als alternierende editorial Rows auf Deep Navy
    (Network → Business Deals → Jobs & Projekte → Investments → Events →
    Insights, CTA „Entdecken →“, `hidden lg:block`, Sprint 9) → Events →
    Kapital-Hinweis → Membership (2-Spalten) → Final-CTA.
  - Statisches Prerendering bleibt erhalten: keine Request-Time-Datenbankzugriffe.
- `/network`, `/business-deals`, `/investments`, `/marketplace`, `/events`, `/membership`, `/portfolio` – Preview-Seiten mit statischem Content, nicht aktive Funktionen als „Demnächst verfügbar".
- `/login`, `/register`, `/verify`, `/forgot-password`, `/reset-password` – Auth.
- `/member/[publicId]` – öffentliche Karten-Verifikation.
- `/imprint`, `/privacy`, `/terms` – Rechts-Platzhalter (PARTIAL).
- `/design` – internes Design-System.
- Header: Logo → 6 Preview-Links → Sprach-/Theme-Umschalter (Flagge + voller Name: 🇩🇪 Deutsch / 🇬🇧 English) → Login/Join oder „Zur App" (Präsenz-Flag `ic_presence`, keine Autorisierung). Sprint 10: Vollzeile ab `xl` (1280 px) mit kompakten Triggern (Globus + DE/EN, Theme-Icon; volle Labels im Menü), Wortmarke ab 1440 px, darunter kompakte Kopfzeile + Menü-Panel; `/app` prüft serverseitig (anonym → `/login?next=/app`, unverifiziert → `/verify`).

#### Member Navigation (6 Primärbereiche + 6 sekundäre Bereiche)

**Viewport-Trennung (Sprint 8):**

- **Desktop (`xl+`):** Desktop-Sidebar (unverändert) mit Primär- +
  Bereiche-Gruppe, Konto-Block und „Erstellen“-Button.
- **Mobile (`<xl`):** die Desktop-Sidebar ist **aus der normalen Ansicht
  entfernt** (nicht zusätzlich zur Bottom-Nav). Feste **Bottom Navigation**
  mit Icons + kurzen Labels: `Start · Discover · + · Inbox · Profil` –
  `+` öffnet das bestehende Erstellen-Sheet (kein neues Create-System).
  Oben eine kompakte Top-Bar (IC-Logo, Trial-Countdown, Inbox-Icon, Avatar).
  Der **Avatar öffnet das Konto-&-Bereiche-Menü** (Dialog), aus dem alle
  sekundären Bereiche (inkl. Academy `/app/learn`) sowie Konto-Punkte
  (Profil, Bearbeiten, Member Card, Mitgliedschaft, Trust, Einstellungen,
  Sprache, Abmelden) erreichbar sind – **keine zweite dauerhafte Navigation**.
  Weitere Bereiche sind zusätzlich über die Start-Karten und Unterseiten
  erreichbar.

**Primär (Desktop-Sidebar + Mobile Bottom-Nav):**

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

- **Preise:** 24,99 € / Monat (2499 ct) und 249,90 € / Jahr (24990 ct) – „2 Monate geschenkt" ≈ 17 % Vorteil (16,67 %, `annualSaving()` rundet auf 17 – so zeigt es die App). Quelle der Wahrheit: `src/lib/membership/plans.ts` (doppelt in `src/lib/env.ts` als `membershipPricing` – Risiko K-17).
- **48-h-Discovery-Demo (Sprint 11, ersetzt den „Discovery-Trial“ mit Leserechten):** serverseitig, genau einmal pro Konto (`startTrial()`, `Trial`-Tabelle unverändert), Start im Onboarding nach der Verifizierung, Ablauf lazy in `getAccessContext()`. Während der Demo gibt es **keine echten Mitgliederprofile, Kontaktvorschläge, Deals, Jobs oder Investments** – die Bereiche zeigen die zentral gepflegten, als „DEMO · Beispielprofil“/„DEMO · Beispiel“ gekennzeichneten Beispiele (`src/lib/demo`). Das Level `trial` hat dieselben Rechte wie `free` plus `demoAccess` (`src/lib/access/levels.ts`); Kontaktanfragen, Follows, Bewerbungen, Interessensbekundungen und Event-Anmeldungen werden serverseitig mit `membershipRequired` abgewiesen. Die simulierte Kontaktanfrage auf Demo-Profilen läuft rein clientseitig (`DemoConnectDialog`) und schreibt nichts. Echte veröffentlichte Events (Titel, Datum/Uhrzeit, Ort, Programm, freie Plätze aus realer Kapazität − Buchungen) bleiben lesbar; die Anmeldung ist Teil der Mitgliedschaft (Sperrkarte statt Formular, `applyToEventAction` → `membershipRequired`). Nach Ablauf: Konto/Profil bleiben, Level `free`, Demo nicht neu startbar (`already_used`), Mitgliedschafts-Screen (`LockedArea`/Billing).
- **Sieben Kontozustände (verbindlich):** 1 anonym (`visitor`) · 2 registriert, unverifiziert (kein `/app`) · 3 verifiziert, Discovery nicht gestartet (`free`, kein `Trial`-Datensatz; landet im Onboarding) · 4 aktive 48-h-Demo (`trial`, `demoAccess`) · 5 abgelaufene Demo ohne Mitgliedschaft (`free`, `Trial.status = expired`) · 6 aktive bestätigte Mitgliedschaft (`member`) · 7 Admin. Nachweis: `tests/integration/access-matrix.test.ts`, `tests/integration/discovery-demo.test.ts`.
- **Migrations-/Übergangsregel (Sprint 11, kein Schema-Change):** bestehende **aktive** Trials laufen bis zu ihrem ursprünglichen `expiresAt` weiter – ab dem Deploy unter Demo-Semantik (keine echten Daten mehr); bestehende **abgelaufene** Trials bleiben abgelaufen und werden **nie** zurückgesetzt; aktive Mitgliedschaften sind unberührt; Konten ohne `Trial`-Datensatz starten ihre Demo weiterhin genau einmal im Onboarding. Es gibt keine Datenmigration und keinen Reset-Pfad.
- **Private Beta (Sprint 12, verbindlich):** dritte, unabhängige Achse neben Level und Rolle – **kein** neues Level, **keine** Mitgliedschaft. Ein aktiver `BetaAccess` (`status = active` und `endsAt` in der Zukunft, `betaIsActive()` in `src/lib/access/server.ts`, bei jedem Request aus der DB) ergänzt für `free`/`trial` ausschließlich `networkDirectory`, `networkDiscover`, `connect`, `messaging`, `profileFull` (`withBetaGrant()` in `src/lib/access/levels.ts`); Deals, Jobs, Investments, Marketplace-Verkauf, Academy und Event-Anmeldung bleiben gesperrt. Tester zählen nie als zahlend (keine `Membership`-/`Invoice`-Zeile, kein Stripe). Schlüssel: `ICB-XXXX-XXXX-XXXX-XXXX` (80 Bit), einmalig, an das einlösende Konto gebunden, optional an eine E-Mail, Einlösen nur verifiziert, Rate-Limit 8/h pro Konto und 30/h pro IP, race-sicher. Ablauf/Widerruf: Konto, Profil, Kontakte und Verläufe bleiben; echte Mitgliedersuche, neue Anfragen und Nachrichten gesperrt (Chat nur lesbar); Re-Login verlängert nichts. Läuft die 48-h-Demo noch, sieht der Nutzer die Demo plus Ende-Hinweis. Lebenszyklus: `04-auth-membership.md` §4b; Rechte: `06-permissions.md` §3c; Tabellen: `05-database.md`.
- **Keine zusätzlichen Membership-Tiers.** Nur `free`, `trial`, `member`, `admin` (Level). Keine künstlichen Pakete. Der Beta-Zugang ist ein befristetes Entitlement, kein Tier.
- **Bezahlung:** Stripe Checkout + signierte Webhooks implementiert, aber BLOCKED (keine Schlüssel). **Sprint-12-Audit:** Signaturprüfung im Worker auf `constructEventAsync` umgestellt (die synchrone Variante hätte jeden Produktions-Webhook abgelehnt), Aktivierung nur bei `payment_status = paid`/`no_payment_required` bzw. `checkout.session.async_payment_succeeded`, unbezahlte/fehlgeschlagene Checkouts werden nur protokolliert, `subscription.deleted` ohne 500 (`04-auth-membership.md` §4a, `stripe-webhook-route.test.ts`). Dev-Aktivierung nur ohne Stripe und außerhalb Produktion (`ALLOW_DEV_MEMBERSHIP_ACTIVATION`), klar gekennzeichnet. **Auf dem Live-Worker (`NODE_ENV=production`, keine Stripe-Variablen in `wrangler.jsonc`) sind daher aktuell keine echten Zahlungen möglich und keine Mitgliedschaft aktivierbar**; `/app/billing` zeigt deshalb deaktivierte Plan-Buttons mit „Zahlung noch nicht freigeschaltet“ statt eines Checkout-Formulars ins Leere.
- **Free/abgelaufene Demo im `/app`-Bereich (Sprint 10/11):** Verzeichnis, Discover, Chancen, Jobs, Investments, Deal-/Investment-Details, fremde Profile und Demo-Profilseiten sind seitenweise gesperrt (`LockedArea`), das Dashboard zeigt statt Vollansicht ein Mitgliedschafts-Panel; erlaubt bleiben eigenes Profil/Einstellungen, Marketplace- und Event-Liste inkl. Event-Details (ohne Anmeldung), Inbox (Anfragen annehmen/ablehnen, Mitteilungen), Billing. Matrix und Nachweis: `06-permissions.md` §3/3a/3b.
- **Zahlungsstatus ehrlich:** `/app/billing` nennt den echten Stand („Keine Zahlung hinterlegt – es besteht keine aktive Mitgliedschaft. Eine Mitgliedschaft wird ausschließlich nach bestätigter Zahlung aktiviert – nie durch einen Klick, eine Demo-Aktion oder eine fehlgeschlagene Zahlung.“). Ohne Stripe-Schlüssel und mit `ALLOW_DEV_MEMBERSHIP_ACTIVATION=false` (Standard in `.env.example`) antwortet `/api/billing/checkout` mit `?error=stripeNotConfigured` und legt **keine** Mitgliedschaft an (`discovery-demo.test.ts`).
- **Mitgliedskarte:** Format `IC-<Jahr>-<5-stellige Nummer>`, öffentliche `publicId`, Status `active`/`expired`.

### 1d. Demo-Daten (verbindliche Regeln – Sprint 6 verschärft)

- **Quelle:** zentral `src/lib/demo/index.ts` (`DEMO_CONTENT_ENABLED` als Notausschalter) + `src/components/app/DemoSections.tsx`.
- **Gating (Sprint 12, ersetzt die Sprint-7-Ergänzung):** das **echte** Netzwerk (Mitglieder, Admins, aktive Beta-Tester) zeigt in `/app/network` und `/app/discover` **nur echte, sichtbare Mitglieder** – keine Demo-Profile als Auffüllung. Ist niemand passend, erscheint der ehrliche Leerzustand („Dein Netzwerk wächst. …“). `networkDemoSupplement()` ist DEPRECATED. `/app/profile` zeigt Demo-Beiträge weiterhin UNTER echten Beiträgen.
- **Discovery-Demo (Sprint 11, Level `trial`):** `/app/network`, `/app/discover`, `/app/opportunities`, `/app/jobs` und `/app/investments` rendern für die 48-h-Demo **ausschließlich** Demo-Inhalte – die Mitglieder-/Deal-/Investment-Abfragen werden gar nicht ausgeführt (kein Count, kein Teaser, nichts im RSC-Payload). Discover nutzt die **echten** Filter und das **echte** regelbasierte Ranking (`src/lib/demo/discover.ts` → `applyDiscoverFilters`/`rankCandidates`), sortiert nach den im Onboarding gewählten Interessen/Zielen; Demo-Profile tragen dafür Slugs der echten Taxonomie (`interestSlugs`/`goalSlugs`). Jede Demo-Seite trägt den Hinweis `DemoAreaNotice` („Discovery-Demo · …“), Mitglieder/Admins (`demoAccess=false`) sehen die Demo-Zweige nie (Gate: `demoAccess && !<echtes Entitlement>`).
- **Demo-Investments (Sprint 11):** drei fiktive, offene Beispiele (`DEMO_INVESTMENTS`) ohne Renditeversprechen, Ticket als „Beispiel-Ticket“, keine abgeschlossenen/„funded“ Zustände; Deals/Jobs analog ohne erfundene Erfolge.
- **Sichtbarkeit:** Badge „Demo"/„Beispiel"/„DEMO · Beispielprofil"/„DEMO · Beispiel"/„Beispiel-Event", Hinweistext `app.demo.notice`, Demo-Posts „Demo · keine echten Reaktionen"; keine technischen Begriffe („Mock“, „Seed“, „Placeholder“) in der Oberfläche.
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
- **Lesbar ohne Mitgliedschaft, Anmeldung nur mit Mitgliedschaft (Sprint 11):** verifizierte Konten (`free`/`trial`) sehen echte veröffentlichte Events (Titel, Datum **und Uhrzeit**, Ort, Beschreibung/Programm, Bild) in Liste und Detail; freie Plätze werden nur angezeigt, wenn `capacity` gesetzt ist (`capacity − Bewerbungen applied/confirmed/attended`), nie erfunden. Statt des Anmeldeformulars steht eine Sperrkarte („Anmeldung ist Teil der Mitgliedschaft“ + freie Plätze + CTA Billing); `applyToEventAction` prüft `eventsApply` serverseitig (`membershipRequired`). Bestehende Anmeldungen, Rückzug und Admin-Funktionen unverändert (`discovery-demo.test.ts` §4).

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

### 1i. Core Connection Loop (Sprint 8, vollständig funktionsfähig)

**Sprint 12 (verbindliche Ergänzungen):** Der Loop steht jetzt auch aktiven
Beta-Testern offen (serverseitig über `networkAccess`). Discover zeigt **keine**
Match-Prozente, Kennzahlen oder Trust-Werte mehr, nur nachprüfbare
Gemeinsamkeiten. Filter (kombinierbar, zurücksetzbar, deterministisch):
Rolle, Standort, Umkreis, Branche, Interesse, **Businessziel**, Ich suche,
Ich biete, Investmentinteresse, Typ. Geeignet sind nur aktive, verifizierte, onboardete,
sichtbare Nicht-Demo-Konten mit Netzwerkzugang (`src/lib/network/eligibility.ts`).
Gegenseitige Anfragen werden automatisch zu einer Verbindung, Selbst-/Doppel-/
gelöschte/blockierte Ziele werden abgewiesen, nach einer Ablehnung gilt eine
Wartezeit von 14 Tagen ohne Ablehnungs-Benachrichtigung. **Annehmen öffnet
sofort den Chat** mit der Anfragenachricht als erster Nachricht
(`/app/inbox?tab=messages&c=…`), **genau ein Chat pro Paar**
(`Conversation.directKey`, unique). Der Chat pollt alle 10 s, Ungelesen-Zähler
in der Inbox, keine Benachrichtigung pro Nachricht. Nicht-Teilnehmer können
keinen Chat lesen. Nachweis: `beta-networking.test.ts`,
`beta-network-d1.test.ts`, Browser-E2E (`08-testing.md` §3b).

Der zentrale Produkt-Loop ist Ende-zu-Ende implementiert und getestet:

```
Discover → Profil → Connect (Pflichtnachricht) → Anfrage → Inbox (Anfragen)
→ Annehmen / Ablehnen → bei Annahme: Chat + Business Connection → Network
```

- **Discover** (`/app/discover`): regelbasiertes Matching auf echten
  Profildaten (Interessen, Ziele, Branche, Ich suche/biete, Standort,
  gemeinsame Kontakte) – **kein AI-Matching, keine „AI“-Bezeichnung**.
  Match-Gründe werden als Chips gezeigt (z. B. „Ihr sucht beide: …“,
  „Gemeinsames Interesse: …“, „Gleicher Standort: …“). Mobile: kompakte
  Karte (Foto, Name, Rolle, Standort, 1–2 Tags, max. 2 Match-Gründe) +
  Daumen-Actions (Überspringen / Profil ansehen / Connect, Connect
  durchläuft beide Spalten).
- **Profil** (`/app/people/[handle]`): Avatar, Name, Handle, Rolle,
  Unternehmen, Standort, Bio, Interessen, Ich suche, Ich biete, Skills,
  Trust Score, Business Connections (Stats), Beiträge. **Zustandsabhängige
  Aktionen** (keine falschen Button-Zustände):
  - nicht verbunden → `Connect`
  - eigene Anfrage offen → `Anfrage gesendet` (deaktiviert) + `Zurückziehen`
  - eingegangene Anfrage → `Annehmen` / `Ablehnen`
  - verbunden → `Nachricht senden` (Messaging-Entitlement)
  Die doppelte MemberCard am Seitenende (stale State) wurde entfernt.
- **Connect** öffnet immer das `ConnectDialog` (Bottom Sheet/Dialog):
  Pflichtfeld „Warum möchtest du dich verbinden?“, 10–600 Zeichen
  (`CONNECTION_MESSAGE_MIN_LENGTH` / `CONNECTION_MESSAGE_MAX_LENGTH`),
  Zähler + Fehleranzeige. Server lehnt kürzere Nachrichten ab
  (`connectionMessageRequired`). Optionaler Prompt-Text, kein AI-Text.
- **Connection-States** (`ConnectionRequest.status`, serverseitig):
  `pending` → `accepted` | `declined` | `withdrawn`. Richtungsbewusst:
  Sender sieht „Anfrage gesendet“ + Zurückziehen, Empfänger Annehmen/Ablehnen.
- **Inbox → Anfragen** (`/app/inbox?tab=requests`, Sub-Tabs
  `requests`/`sent`/`connections`): eingehende Anfrage zeigt Profilbild,
  Name, Rolle, **Standort**, **persönliche Nachricht**, `Profil ansehen`,
  `Annehmen`, `Ablehnen`. Solange nicht angenommen: **kein Chat**.
- **Annehmen** (`respondConnectionRequestAction`, nur Empfänger):
  Request → `accepted`, beide werden Business Connection (`Connection`-Zeile),
  Chat wird freigeschaltet (für Konten mit Messaging-Entitlement),
  Sender erhält Notification mit Deep Link
  `/app/inbox?tab=requests&sub=connections`. **Kein automatisches Follow.**
- **Ablehnen** (nur Empfänger): Request → `declined`, keine Connection,
  kein Chat, keine Trust-Auswirkung, neutraler Hinweis an den Sender
  (`/app/inbox?tab=requests&sub=sent`). Trial-Slot wird freigegeben.
- **Zurückziehen** (nur Sender): Request → `withdrawn`, Trial-Slot frei.
- **Chat** (`/app/inbox?tab=messages&c=<id>`): 1:1, nur verbundene Konten
  (serverseitig `isConnected` + Participant-Check). Textnachrichten,
  Timestamp, eigene/fremde Bubbles unterscheidbar, Verlauf, Empty State,
  Send-Loading, Fehlerzustand, eigene Nachricht lösbar. **Noch keine**
  Bilder/Dateien/Voice/Video/Reactions/Typing. Mobile wie Messaging-App:
  Header mit Person + zurück zur Inbox, Messages im Hauptscreen,
  Composer unten fixiert (1 Zeile), Inbox-Chrome ausgeblendet.
  Neue Paare (ohne Konversation) werden per `ensureDirectConversation()`
  angelegt (kein Server-Action-during-Render → kein 500 mehr).
- **Network** (`/app/network`): View-Segmente **Alle / Verbindungen /
  Anfragen** (`?view=connections|requests`) unterscheiden Business
  Connections, offene Anfragen und andere Profile; Mitglieder mit
  Verbindung tragen das `Verbunden`-Badge, Karten zeigen je Richtung die
  passenden Actions. Demo-Profile erscheinen nur in „Alle“.
- **Demo-Profile** (TEIL T, Sprint 11 erweitert): erzeugen **nie** echte
  Daten – kein `ConnectionRequest`, keine Inbox-Einträge, kein Follow, kein
  Trust. „Kontakt anfragen“ auf einem Demo-Profil öffnet `DemoConnectDialog`
  mit simuliertem Nachrichten-Flow (min. 20 / max. 600 Zeichen) und dem
  Abschluss „So funktioniert eine Kontaktanfrage bei INNER CIRCLE. Dies war
  eine Demo – es wurde keine Nachricht an eine echte Person gesendet.“
  `sendConnectionRequestAction` blockiert zusätzlich DB-Demo-User
  serverseitig (`demoConnectBlocked`).
- **Kontaktanfragen nur für Mitglieder (Sprint 11):** `connect` ist für
  `trial` `"no"` → `membershipRequired`; der frühere Trial-Zähler
  (`TRIAL_CONNECTION_LIMIT`) wird von keiner Action mehr verbraucht.
  Rate-Limit `connect:<userId>` 30/h, `message:<userId>` 60/10 min.
- **Authorization** (serverseitig, `getAccessContext()`): nur eingeloggte
  Nutzer senden Connect; nur Empfänger antwortet; nur Sender zieht zurück;
  nur verbundene Nutzer chatten; fremde Chat-Verläufe nicht abrufbar
  (Participant-Check in `conversationMessages()`); Demo-Profile triggern
  keine echten Aktionen.
- **Notifications** (bestehende Infrastruktur, `notify()`): neue
  Connection-Anfrage, Connection angenommen, neue Chat-Nachricht.
  Deep Links zeigen auf die Inbox-Sub-Views.
- **Start „Für dich“** (`forYouItems()`): bis zu 5 **echte** Einträge in
  Priorität: offene Anfrage → ungelesene Nachricht → passendes Mitglied
  (gemeinsames Interesse, ohne offene Anfrage/Connection/Block) → neueste
  Chance → nächstes bestätigtes Event → neueste freigegebene
  Investment-Opportunity. Ohne echte Daten: ehrliche Navigations-Shortcuts.

### 1j. Follow vs. Business Connection (verbindlich, dokumentiert)

- **Follow** (`Follow`): einseitig, sofort, ohne Nachricht. Eigene
  Sichtbarkeit (Feed), keine Rechte, kein Chat.
- **Business Connection** (`Connection`): beidseitig, erst nach
  angenommener Anfrage. Schaltet 1:1-Chat frei (mit Messaging-Entitlement)
  und zählt als Kontakt (Stats, Network).
- **Kein automatisches Follow bei Connection** und kein automatischer
  Follow-Back – abgesichert durch `tests/integration/core-loop.test.ts`.

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
| Tests | Vitest: **24 Dateien / 134 Tests grün** (`npm test`, inkl. D1-Regressionstest `for-you-d1.test.ts`) |
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
| Startseite `/` – Conversion-Flow (Hero mit 3 Outcomes + Preis-Hinweis → schmales 20-%-Kapital-Band → Membership-Preis → 6 Kernbereiche → Events → CTA) | WORKING | `src/app/(site)/HomeContent.tsx`; Hero-Bild unverändert (Sprint 10: Mobile nutzt dasselbe `hero-alpine.jpg`), Hero nennt beide Preise (24,99 €/249,90 €); **statisch vorgeneriert** |
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
| 48-h-Discovery-Demo (serverseitig, einmalig, Ablauf, kein Neustart) | WORKING | `src/lib/trial/service.ts`, `tests/integration/trial.test.ts`, `tests/integration/discovery-demo.test.ts` |
| Demo-Semantik der Discovery-Phase (keine echten Mitglieder/Deals/Jobs/Investments, simulierte Anfrage ohne Datenbankschreibung, echte Events lesbar/Anmeldung gesperrt) | WORKING | `entitlementsFor("trial")` = free + `demoAccess`, `src/lib/demo/discover.ts`, `DemoConnectDialog`, `access-matrix.test.ts`, `discovery-demo.test.ts` |
| Trial-Kontaktanfragen-Zähler (`TRIAL_CONNECTION_LIMIT`) | PREPARED | Service + Test bleiben, wird seit Sprint 11 von keiner Action mehr verbraucht (Trial darf keine echten Anfragen senden) |
| Paid Membership (Monat/Jahr) über Service | WORKING | `src/lib/membership/service.ts`, `tests/integration/membership.test.ts` |
| Stripe-Checkout + signierte Webhooks | BLOCKED | Code vollständig (`/api/billing/checkout`, `/api/webhooks/stripe`, `webhook.test.ts`), aber kein Stripe-Konto/Schlüssel; Sprint 12: Worker-Signaturprüfung + Aktivierungsregeln korrigiert (`stripe-webhook-route.test.ts`, `stripe-worker-signature.test.ts`) |
| **Private Beta: Schlüssel einlösen → befristeter Beta-Zugang (Sprint 12)** | WORKING (lokal verifiziert) | `src/lib/beta/*`, `src/app/actions/beta.ts`, `/app/beta`, `beta-access.test.ts` (18), `beta-network-d1.test.ts`, Browser-E2E; Produktions-D1 braucht Migration `0002` (K-22) |
| Kundenportal (Kündigung/Zahlungsmittel) | PREPARED | `createBillingPortalSession()` vorhanden, keine Route/UI |
| Dev-Mitgliedschaftsaktivierung (klar gekennzeichnet) | WORKING | nur ohne Stripe und außerhalb Produktion (`ALLOW_DEV_MEMBERSHIP_ACTIVATION`) |
| Mitgliedskarte (Nummer + öffentliche Verifizierung) | WORKING | `issueCardIfNeeded`, `/member/[publicId]` |
| Paywall/Weiterleitung unterhalb des Levels | WORKING | `requireAccess()`, `/app/billing?paywall=…`; Sprint 10/11: Seiten-Locked-State `LockedArea` für Free/abgelaufene Demo, `tests/integration/access-matrix.test.ts` (26 Fälle, 7 Kontozustände) |
| Mitgliedsantrag mit manueller Prüfung | WORKING | `/app/membership-application`, Admin-Prüfung |
| Rechnungen (`Invoice`) | PREPARED | Tabelle + `recordInvoice()`, keine echten Rechnungen ohne Stripe |

### D. Member Profiles

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Profil ansehen/bearbeiten (Bio, Rolle, Firma, Links, **„Ich biete"**) | WORKING | `/app/profile`, `/app/profile/edit`; **LinkedIn aus UI entfernt und deprecated** (DB-Spalte für Datenintegrität erhalten); Instagram, X und Website sekundär; IC-Business-Identität priorisiert |
| **Profil als Hauptbereich** (Header + Tabs Übersicht/Aktivitäten/Performance/Angebote) | WORKING | `/app/profile?tab=…`; Profilfortschritt, Trust & Performance und Konto-Links (Member Card, Mitgliedschaft, Einstellungen) leben hier; Sprint 6: socialere Hierarchie (Avatar, Name, Handle, Bio, Rolle, Standort oben; kompakte Stats Follower/Folgt/Connections/Trust; Actions Bearbeiten/Teilen/Einstellungen; Vollständigkeit kompakt) |
| Interessen & Ziele (Onboarding-Taxonomie) | WORKING | `/onboarding/interests`, `completeOnboardingAction`, Apple-artiges UX-Design, strukturierte Gruppen, mind. 3 Pflicht, `onboarding.test.ts` |
| **Interessen & Ziele nach dem Onboarding ändern** | WORKING | Sprint 13: im selben Formular wie die Profilfelder (`updateProfileAction` mit `saveInterests=1`, Auswahl via `InterestGoalPicker`), dieselbe Taxonomie (`Interest`/`Goal`), `profile-preferences.test.ts` – die frühere Eigenaktion `updateInterestsAction` ist entfernt |
| Statistiken (Kontakte, Follower, Trust Score) | WORKING | `/app/profile`, `profileStats()`, `performanceCountsFor()` |
| **Sichtbarkeit einzelner Business-Zahlen** | WORKING | `PrivacySettings.metricsVisibilityJson` (7 Kennzahlen), `/app/settings`, erzwungen in `/app/profile?tab=performance` |
| Trust & Performance (eigene Sicht) | PARTIAL | `/app/profile?tab=performance` (+ `/app/trust` als Detailseite); Bewertungen können **nicht** abgegeben werden (Verifikations-Pipeline fehlt) |
| Öffentliche Mitgliedskarte verifizieren | WORKING | `/member/[publicId]` |
| Activity Feed (Posts) | WORKING | `Post`, `createPostAction`, Feed auf Dashboard; Sprint 6: 3-6 hochwertige Demo-Beiträge (Founder Update, neues Projekt, Suche Partner, Event-Erfahrung, neuer Service, Meilenstein) klar als Demo markiert, keine Metrik-Veränderung |
| Profilsichtbarkeit / Datenschutz-Einstellungen | WORKING (Networking) · PARTIAL (übrige Bereiche) | Sprint 12: im Networking erzwungen – unsichtbar = nicht gelistet/404, reduzierte Karte, Kontaktlinks nur für Kontakte, Standort verborgen, Kennzahlen nach Schalter (`src/lib/network/privacy.ts`, `06-permissions.md` §3d, `beta-networking.test.ts`); außerhalb des Networkings nicht ausgewertet (K-06) |
| Profil speichern (alle Felder, geführtes Beta-Onboarding mit Fortschritt) | WORKING | Sprint 12: falsche Formularschlüssel behoben (Website/X/Instagram wurden nicht gespeichert bzw. nicht geleert), nur http(s)-Links, `profile-save.test.ts`. **Sprint 13:** EIN Speichervorgang für Profilfelder + Interessen & Ziele + Foto (`saveInterests`-Marker, unveränderte Auswahl = no-op, Mindest-3-Interessen nur bei geänderter Auswahl), Erfolgsmeldung `?saved=all` |
| Profilfoto-Upload | WORKING | Sprint 13: „Foto auswählen“ (JPG/PNG/WebP, max. 5 MB) im einheitlichen Formular, Ablage im R2 `MEDIA`-Binding (`avatars/<userId>/…`), Auslieferung über `/api/media/<key>` (oder `R2_PUBLIC_BASE_URL`), Anzeige in Kopfzeile, Profil, Discover, Network, Inbox, Member Card; URL-Feld bleibt optional; Ersetzen/Löschen räumt alte Uploads ab – `media-validation.test.ts`, Browser-E2E `tests/e2e/profile-save-upload.mjs`. Cover-Upload weiterhin NOT IMPLEMENTED |

### E. Network

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Member Discovery (Verzeichnis mit Suche/Filter) | WORKING | `/app/network`, `listDirectoryMembers()`; Sprint 6 humanisiert: 20-35, Mix Founder/Unternehmer/Investor/Creator/Consultant/Operator/Freelancer, uneven Bios/Skills, Städte variabel; **Sprint 7: Filterleiste Suche + Rolle + Standort + Interesse** (Rolle via `jobTitle`/`rolesJson`); **Sprint 12:** nur echte, geeignete Mitglieder (keine Demo-Ergänzung mehr), Privatsphäre erzwungen, auch für aktive Beta-Tester |
| **Verbindungsstatus richtungsabhängig (Sprint 7)** | WORKING | eigene gesendete Anfrage → „Anfrage gesendet" + **Zurückziehen**; erhaltene Anfrage → **Annehmen / Ablehnen** direkt auf der Mitgliedskarte (`outgoingRequestId`/`incomingRequestId` aus `listDirectoryMembers()`); Follow-Button heißt „Nicht mehr folgen" (kein „Ablehnen" mehr, der nur für erhaltene Anfragen steht); `network-directory.test.ts` |
| **Demo-Profilansicht (Sprint 7, Sprint 11 erweitert)** | WORKING | „Profil ansehen" auf Demo-Karten → `/app/people/demo/[key]`: vollständige, eindeutig als „DEMO · Beispielprofil" gekennzeichnete Ansicht (Interessen, Businessziele aus der echten Taxonomie, Suche/Biete, Skills) ohne Mitglieder-DB-Zugriff; „Kontakt anfragen“ öffnet den simulierten Anfrage-Flow mit Pflichtnachricht und Abschluss „So funktioniert eine Kontaktanfrage bei INNER CIRCLE. Dies war eine Demo – es wurde keine Nachricht an eine echte Person gesendet.“ (`DemoConnectDialog`, keine Server-Action, keine DB-Zeile); nur für `demoAccess` oder Verzeichnis-Berechtigte, sonst `LockedArea` |
| **Discovery-Demo in Network/Discover (Sprint 11)** | WORKING | Level `trial` sieht in `/app/network` und `/app/discover` ausschließlich die acht Demo-Profile (echte Abfragen werden nicht ausgeführt), mit den echten Filtern (Rolle, Standort, Umkreis, Branche, Interesse, Investmentinteresse, Suche/Biete), aktiven Filtern + Zurücksetzen und ehrlichem Leerzustand; Sortierung nach eigenen Interessen/Zielen (`demoDiscoverResults`); `demo-discover.test.ts`, `discovery-demo.test.ts` |
| Follow | WORKING | `followAction` (nur Mitglieder; Trial → `membershipRequired`; bei Demo-Profilen nicht angeboten – keine echten Follower) |
| Connection Requests (senden/annehmen/ablehnen/zurückziehen) | WORKING | `network.ts`, `connection-request.test.ts`, `messaging-authorization.test.ts` |
| **Core Connection Loop (Sprint 8)** | WORKING | Discover → Profil (zustandsabhängige Aktionen) → Connect mit Pflichtnachricht → Anfrage in Inbox → Annehmen/Ablehnen → Chat (nur Mitglieder) + Business Connection → Network (`Alle/Verbindungen/Anfragen`). Details §1i; `core-loop.test.ts` (accept/decline/withdraw, Notification-Deep-Links, kein implizites Follow), `connection-request.test.ts`, `messaging-authorization.test.ts` |
| **Verbindungsanfrage nur mit Pflichtnachricht** (min. 10 Zeichen, max. 600) | WORKING | serverseitig in `sendConnectionRequestAction` (`CONNECTION_MESSAGE_MIN_LENGTH`/`CONNECTION_MESSAGE_MAX_LENGTH`), UI `ConnectDialog` (Zähler + Fehler), `connection-request.test.ts` |
| **Discover** (Business-Karten, Relevanz-Ranking, Filter) | WORKING | `/app/discover`, `DiscoverDeck`, `src/lib/discover/matching.ts`, `discover-matching.test.ts`; Sprint 6 humanisiert, keine 3-Skills-Zwang; **Sprint 12:** keine Match-%/Kennzahlen/Trust, Desktop-Zweispalter wiederhergestellt, ruhiger Platzhalter ohne Foto, **Businessziel-Filter** (`10-design-freeze.md` §1.17, `discover-matching.test.ts`) |
| Messaging (nur zwischen verbundenen Konten) | WORKING | `message-delivery`, `messaging-authorization` Tests; Sprint 12: für Mitglieder **und** aktive Beta-Tester, ein Chat pro Paar, Polling 10 s, Ungelesen-Zähler, nach Beta-Ende nur lesbar (`beta-networking.test.ts`, Browser-E2E) |
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
| Events ansehen (Mitgliederbereich) | WORKING | `/app/events`, `Event`-Tabelle; Sprint 6: Karten mit Bild (wiederverwendet aus Public), Titel, Demo-Badge, Stadt, Datum, kurzer Satz, „Event ansehen"; **Sprint 11:** Datum · Uhrzeit, für verifizierte Nicht-Mitglieder lesbar (Liste + Detail), freie Plätze nur aus echter Kapazität − Buchungen |
| Bewerben/Abbestätigen, Warteliste-Flag | WORKING (Datenmodell) | `applyToEventAction` (nur `eventsApply` = Mitglied/Admin, sonst `membershipRequired`; Detailseite zeigt Nicht-Mitgliedern eine Sperrkarte statt Formular), `cancelEventApplicationAction` |
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
| **Beta-Verwaltung (Sprint 12)** | WORKING (lokal verifiziert) | `/admin/beta`: Schlüssel erstellen (Klartext einmal), Status/Nutzer/Start/Ende, verlängern (+7/14/30/60 Tage), widerrufen, unbenutzte deaktivieren, Anzahl aktiver Tester; serverseitig `requireAdmin`, Audit ohne Schlüssel; `beta-access.test.ts` |

### L. Infrastructure

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Cloudflare-Worker-Konfiguration (OpenNext) | WORKING | `wrangler.jsonc`, `open-next.config.ts`; `npm run cf:build` läuft in dieser Session grün |
| D1-Anbindung + Migrationen (52 Tabellen) | WORKING (lokal) · Produktion ausstehend | `drizzle/0000_init.sql` … `0002_sprint12_private_beta.sql`, `cf:release`; `0002` bisher **nur lokal** angewendet (K-22) |
| Laufzeit-Treiberwechsel D1 ↔ libSQL | WORKING | `src/db/client.ts` |
| Deployment über Workers Builds (main → Produktion) | PARTIAL | dokumentierter Weg; letzter Merge nach `main` durch den Gründer zu prüfen (Dashboard) |
| Automatisierte Tests | WORKING | **246 Tests grün (35 Testdateien)** (Sprint 12), inkl. echter D1-Läufe (`for-you-d1`, `beta-network-d1`, workerd/Miniflare); Browser-E2E `tests/e2e/sprint12-browser.mjs` gegen den Worker-Preview **65/65** (nicht Teil von `npm test`, `08-testing.md` §3b) |
| Worker-Build + Dry-Run | WORKING | Sprint 12: `npm run cf:build` grün, `wrangler deploy --dry-run` grün – Upload 9287,12 KiB / gzip 1859,17 KiB, Bindings `DB`, `ASSETS`, `NEXTJS_ENV` |
| CPU-Zeit / Worker-Limits | PARTIAL (lokal gemessen) | Startphase 50 ms (Limit 1 s); Seiten 43–68 ms, Login ~0,6 s im lokalen workerd → über Free (10 ms), weit unter Paid (30 s) → **Workers Paid Voraussetzung** (K-24, `08-testing.md` §3c); auf Cloudflare nicht gemessen |
| CI (GitHub Actions) | NOT IMPLEMENTED | keine Workflows im Repo |
| Lint | PARTIAL | **12 bestehende Hinweise (5 Fehler, 7 Warnungen)** – vorbestehend, keine neuen Befunde (Sprint 12: 14 → 12, K-15) |
| Monitoring/Alerting | PREPARED | Observability im Worker aktiv, keine Alarme |

## 4a. Demo-Content (verbindliche Regeln)

- **Quelle:** alles Fiktive lebt zentral in `src/lib/demo/index.ts`
  (`DEMO_CONTENT_ENABLED` als Notausschalter) und wird über
  `src/components/app/DemoSections.tsx` gerendert.
- **Gating (Sprint 12):** das echte Netzwerk (Mitglieder, Admins, aktive
  Beta-Tester) zeigt **nie** Demo-Profile – auch nicht als Auffüllung kleiner
  Listen (die Sprint-7-Ergänzung ist entfernt, `networkDemoSupplement()`
  DEPRECATED). Demo-Konten erscheinen nie im echten Netzwerk.
- **Discovery-Demo (Sprint 11, Level `trial`):** Network, Discover, Chancen,
  Jobs und Investments zeigen **nur** Demo-Inhalte, echte Abfragen laufen nicht;
  Demo-Profile (8, `DEMO_PROFILES`) nutzen Slugs der echten Taxonomie, damit die
  echten Filter und das echte Ranking greifen (`src/lib/demo/discover.ts`);
  Avatare ausschließlich aus `public/images/avatars/*` oder neutraler
  Initialen-Avatar (`avatarUrl: null`), nie Mitgliederfotos; die simulierte
  Kontaktanfrage (`DemoConnectDialog`) erzeugt keine Anfrage, Nachricht,
  Benachrichtigung oder sonstige Zeile. Demo-Profilseiten sind nach Ablauf der
  Demo gesperrt (`LockedArea`). Die Demo-Profile nutzen
  dieselben Filter wie die echten (Suche, Rolle, Standort, Interesse) und werden
  in der Zählzeile separat als „… Demo-Profile (Beispiele – keine echten
  Mitglieder)" ausgewiesen. `/app/profile` blendet die Beispielbeiträge **unter**
  den echten Beiträgen ein.
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
| 1 | **Start** | `/app` | kompakte Kopfzeile (`Hallo, <Name>` + Trial-Chip + Inbox-Shortcut) und die sechs Kernbereichs-Karten als **2×3-Raster** (Desktop/Tablet große Cards, Mobile kompakte 2-spaltige Tiles mit 1 kurzer Zeile). **Sprint 8:** „Für dich“ zeigt bis zu 5 echte, aktuell relevante Einträge (`forYouItems()`, §1i) statt statischer Links; ohne Daten ehrliche Shortcuts |
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

**Sprint 12 (Private Beta) ist implementiert und lokal geprüft, aber noch nicht
gemergt.** Reihenfolge für den Gründer:
1. Review des Branches `arena/01a0d435-inner-circle` (Screenshots unter
   `preview/sprint12/`), danach PR gegen `main`.
2. Deploy mit `npm run cf:deploy` bzw. `cf:release` – **wendet Migration
   `0002` auf die Produktions-D1 an**; ohne Migration fehlen die Beta-Tabellen.
3. Admin-Konto prüfen (`npm run cf:admin`), unter `/admin/beta` die ersten
   Schlüssel erzeugen, persönlich weitergeben.
4. Stripe im Testmodus anbinden (`04-auth-membership.md` §4a,
   `07-integrations.md` §3.2) – erst danach echte Mitgliedschaften.
5. **Workers Paid** im Cloudflare-Dashboard bestätigen – Seitenaufbau und
   Login liegen über dem Free-Limit von 10 ms CPU (K-24).
6. Offene Punkte: K-22 (u. a. E-Mail-Benachrichtigungen, Foto-Upload,
   Schreiben an abgelaufene Tester – Gründerentscheidung), K-23.

Vorheriger Stand (Sprint 8):

**Sprint 8 ist abgeschlossen** (Mobile Public Homepage radikal verkürzt,
Mobile Member App (Bottom Nav / Mobile-Chat / Mobile-Menü), Core Connection
Loop vollständig, Start „Für dich“ mit echten Einträgen, Network-Views,
listbasierte Mobile-Karten). Offene Gründer-Schritte / nächste
Roadmap-Punkte:
1. **Eigene verifizierte E-Mail-Domain** für die Produktion (Resend-Domain
   anlegen, SPF/DKIM/DMARC im DNS konfigurieren, `EMAIL_FROM` auf die
   verifizierte Domain setzen). Details: [`07-integrations.md`](07-integrations.md)
   und [`12-roadmap.md`](12-roadmap.md) → Abschnitt NEXT.
2. **Profilbild-Upload / Object Storage** in einem separaten Sprint anbinden
   (R2/AVATARS/Datei-Upload war **nicht** Teil von Sprint 8).
3. **Chat-Erweiterungen** (Bilder/Dateien/Voice/Reactions/Typing-Indicator)
   – bewusst **nicht** in Sprint 8, Kern-Text-Chat zuerst stabil.
