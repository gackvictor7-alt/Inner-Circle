# 06 – Zugangsstufen, Rollen & Berechtigungen (Ist-Zustand)

**Stand:** 2026-09-30 (Sprint 18: Private-Beta-Plattformrechte – §3c; davor Sprint 12: Private Beta & echtes Networking – §3c/§3d; davor Sprint 11:
Discovery-Demo) · Quelle im Code: `src/lib/access/levels.ts` (Matrix, client-safe),
`src/lib/access/server.ts` (Durchsetzung, serverseitig) und
`src/lib/network/eligibility.ts` (wer zum echten Netzwerk gehört).
Ersetzt das frühere Zielbild in `06-access-roles.md`.

---

## 1. Zwei getrennte Achsen

1. **Mitgliedsstatus** (Zugangsstufe) – `visitor < free < trial < member < admin`.
2. **Aktivitätsfreigaben** – z. B. Verkäuferstatus (`SellerProfile.status`),
   Founding Member (nur Anerkennung, **kein** Recht), Admin-Rolle.
   Rollen in Profilen (`rolesJson`, `Profile.headline`) sind Selbstbeschreibung
   und **öffnen keine** Rechte.

3. **Private-Beta-Freigabe** – ein separater, zeitlich begrenzter Grant
   (`BetaAccess`), **keine** Zugangsstufe und **keine** Mitgliedschaft: Er
   ergänzt `free`/`trial` um ausdrücklich ausgewählte Plattform-Rechte (§3c).
   Beta-Tester bleiben `free`/`trial`, zählen nie als zahlend und erhalten nie
   Admin-Rechte.

**Grundregel:** Eine Rolle ist keine Berechtigung. Die einzige Ausnahme ist
`User.role = "admin"`.

**Follow vs. Business Connection (Sprint 8, dokumentiert):** Follow
(`Follow`) ist einseitig und sofort, eine Business Connection (`Connection`)
entsteht beidseitig erst nach **angenommener** Anfrage. Eine angenommene
Connection erzeugt **kein automatisches Follow** (und kein Follow-Back) –
die Konzepte sind getrennt (abgesichert durch `core-loop.test.ts`).

## 2. Zugangsstufen

| Stufe | Code | Voraussetzung | Kernrechte |
| ----- | ---- | ------------- | ---------- |
| Besucher | `visitor` | keine | öffentliche Seiten/Previews, Login, Registrierung |
| Registriert (frei) | `free` | Konto, unabhängig von Verifizierung: **Bereich `/app` erst nach Verifizierung** | Dashboard, eigene Profil-/Einstellungs­seiten, Verbindungen ansehen, Benachrichtigungen, Marketplace- und Event-Liste, Billing |
| Discovery-Demo | `trial` | verifiziert + gestartete 48-h-Demo (einmalig) | **wie `free`** plus `demoAccess`: Network/Discover/Chancen/Jobs/Investments zeigen ausschließlich gekennzeichnete Demo-Inhalte, simulierte Kontaktanfrage ohne Datenbankschreibung, echte Events lesbar (keine Anmeldung); **keine** echten Mitgliederprofile, Kontakte, Follows, Bewerbungen, Interessensbekundungen, Nachrichten, Beiträge, Verkäufe, kein Vollprofil, keine Trust-Sicht |
| Mitglied | `member` | aktive, aus dem Membership-Service stammende Mitgliedschaft | zusätzlich Messaging, Posten, Chancen anlegen, Verkaufen, Vollkurse, Investments einreichen, Mitgliedskarte, Vollprofil |
| Admin | `admin` | `User.role = "admin"` | alles aus `member` + Admin-Konsole, Prüfungen, Sperren, Audit, Dev-Postausgang |
| *Beta-Zugang (Grant, keine Stufe)* | `free`/`trial` + `access.beta.active` | verifiziertes Konto + eingelöster persönlicher Beta-Schlüssel, `BetaAccess.status = active` und `endsAt` in der Zukunft | ausgewählte echte Plattformbereiche inkl. Network, Follow, Beiträge, Opportunities/Jobs, Investments und Marketplace-Browsing; Creator-/Seller-/Payment-/Adminrechte bleiben gesperrt (§3c) |

**Ableitung** in `getAccessContext()` (einzige Wahrheit, pro Request gecacht):

```
admin            wenn User.role === "admin"
member           wenn Membership aktiv (status active/trialing, kein endedAt, currentPeriodEnd in der Zukunft)
trial            wenn Trial.status === "active" (lazy Ablaufprüfung, serverzeit-basiert) – seit Sprint 11 eine Demo (free + demoAccess)
free             sonst (angemeldet)
visitor          kein gültiges Session-Cookie

+ Beta-Grant     wenn BetaAccess.status === "active" und endsAt > jetzt (Serverzeit) und Stufe < member:
                 entitlements = withBetaGrant(entitlementsFor(stufe)); networkAccessSource = "beta"
networkAccess    = admin | member | aktiver Beta-Grant (Quelle: access.networkAccessSource)
```

Der Beta-Status wird bei **jedem** Request aus der Datenbank gelesen – Ablauf
und Widerruf wirken sofort, ein neuer Login oder eine neue Session verlängert
nichts (`tests/integration/beta-access.test.ts` §5).

## 3. Berechtigungsmatrix (implementiert)

Zeichen: ✅ erlaubt · ➖ nicht erlaubt · ⚠️ eingeschränkt (siehe Fußnote) ·
🔒 nur mit Admin-Rolle.

| Bereich / Aktion | Visitor | Free | Trial | Member | Admin |
| ---------------- | ------- | ---- | ----- | ------ | ----- |
| Öffentliche Seiten/Previews sehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mitgliederverzeichnis sehen | ➖ | ➖ | ➖ (stattdessen 8 Demo-Profile) | ✅ | ✅ |
| Discovery nutzen (dichte Kartenliste, Sprint IA/UX) | ➖ | ➖ | ➖ (Demo-Discover über Demo-Profile, echte Filter/Ranking) | ✅ | ✅ |
| Profil eines Mitglieds sehen | public Preview-Seite `/member/[publicId]` | ➖ | ➖ (nur Demo-Profilseiten `/app/people/demo/[key]`) | ✅ voll | ✅ voll |
| Eigenes Profil bearbeiten | ➖ | ✅ (Free-Basisfelder) | ✅ (wie Free) | ✅ | ✅ |
| Follow | ➖ | ➖ | ➖ (`membershipRequired`) | ✅ | ✅ |
| Kontaktanfrage senden | ➖ | ➖ (`networkAccessRequired`) | ➖ echte Anfrage (`networkAccessRequired`); simulierte Demo-Anfrage ohne Datenbankschreibung | ✅ unbegrenzt | ✅ |
| Anfragen annehmen | ➖ | ➖ (`networkAccessRequired`, Sprint 12) | ➖ | ✅ | ✅ |
| Anfragen ablehnen / eigene zurückziehen | ➖ | ✅ (Empfänger bzw. Absender) | ✅ | ✅ | ✅ |
| Blockieren | ➖ | ✅ | ✅ | ✅ | ✅ |
| Nachrichten senden | ➖ | ➖ (`networkAccessRequired`) | ➖ | ✅ (nur bestätigte Verbindung) | ✅ |
| Eigenen Nachrichtenverlauf lesen | ➖ | ✅ (nur Teilnehmer; schreibgeschützt) | ✅ (schreibgeschützt) | ✅ | ✅ |
| Beiträge erstellen (Feed) | ➖ | ➖ | ➖ | ✅ | ✅ |
| Mitteilungen lesen | ➖ | ✅ (eigene) | ✅ | ✅ | ✅ |
| Business-Chancen lesen | Preview `/business-deals` | ➖ | ➖ (Demo-Deals) | ✅ | ✅ |
| Chance anlegen/verwalten | ➖ | ➖ | ➖ | ✅ | ✅ |
| Auf Chance bewerben | ➖ | ➖ | ➖ (`membershipRequired`) | ✅ | ✅ |
| Bewerbungen als Owner beantworten | ➖ | ➖ | ➖ | ✅ | ✅ |
| Marktplatz-Listings lesen | Preview `/marketplace` | ✅ (Liste) | ✅ | ✅ | ✅ |
| Listing erstellen (verkaufen) | ➖ | ➖ | ➖ | ✅ (Verkäuferfreigabe noch nicht erzwungen, K-07b) | ✅ |
| Produkt/Service kaufen | ➖ | ➖ | ➖ | **nicht implementiert** | – |
| Kurse: Preview-Lektionen | ➖ | ✅ | ✅ | ✅ | ✅ |
| Kurse: vollständiger Zugang + Enrollment | ➖ | ➖ | ➖ | ✅ | ✅ |
| Investments lesen | Preview `/investments` | ➖ | ➖ (3 Demo-Beispiele) | ✅ | ✅ |
| Investment einreichen | ➖ | ➖ | ➖ | ✅ (Freigabe durch Admin nötig) | ✅ |
| Absichtserklärung abgeben | ➖ | ➖ | ➖ (`membershipRequired`) | ✅ | ✅ |
| Vertrauliche Deal-Dokumente | ➖ | ➖ | ➖ | ➖ (`dealDocuments` immer false) | ➖ |
| Verbindungsanfrage senden | ➖ | ➖ (`networkAccessRequired`) | ➖ (`networkAccessRequired`) | ✅ | ✅ |
| **Verbindungsanfrage ohne persönliche Nachricht** | ➖ | ➖ | ❌ `connectionMessageRequired` | ❌ | ❌ |
| Events lesen/bewerben | Preview `/events` | ✅ Liste + Detail (Datum · Uhrzeit, Ort, Programm, freie Plätze aus echter Kapazität) / ➖ Anmeldung (Sperrkarte, `membershipRequired`) | ✅ lesen / ➖ Anmeldung (wie Free) | ✅ | ✅ |
| **Events anlegen/bearbeiten (Mitglieder)** | ❌ | ❌ | ❌ | ❌ **bewusst nicht implementiert** | 🔒 Admin/IC-Team (keine Route, keine Action) |
| Tickets/Check-in | ➖ | ➖ | ➖ | **nicht implementiert** | – |
| Trust & Performance (eigene Sicht) | ➖ | ➖ | ➖ | ✅ | ✅ |
| **Verifizierte Bewertung abgeben** (Sprint 16) | ➖ | ➖ | ➖ | ✅ nur bei nachweisbarer Zusammenarbeit | ✅ dito (Demo-Konten: ❌ `trustDemoBlocked`) |
| Mitgliedskarte erhalten/anzeigen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Eigene Karte öffentlich prüfen lassen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing/Planwahl | ➖ | ✅ | ✅ | ✅ | ✅ |
| Mitgliedsantrag stellen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Buchhaltung/Rechnungen sehen | ➖ | ➖ | ➖ | ✅ (Daten nur mit Provider) | ✅ |
| Admin-Konsole öffnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Nutzer sperren / Founding Member setzen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Investments freigeben/ablehnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Mitglieds-/Löschanträge bearbeiten | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Trust-Bewertung entfernen/wiederherstellen (Sprint 16) | ➖ | ➖ | ➖ | ➖ | 🔒 (`/admin/reviews`) |
| Audit-Log einsehen (implizit über Admin-Ansichten) | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Dev-Postausgang `/dev/outbox` | ➖ | ➖ | ➖ | ➖ | 🔒 (zusätzlich `ENABLE_DEV_OUTBOX=true`) |

**Beta:** Die Tabellen-Spalte Free/Trial ist nur die Mitgliedsstufe, nicht der
zusätzliche Grant. Bei aktivem Beta-Zugang gelten die ausdrücklich in §3c
aufgeführten Plattformrechte; sie sind kein Membership-Ersatz und schalten
weder bezahlte Kurszugänge noch Creator-, Seller-, Zahlungs- oder Adminrechte
frei.

**Trial-Mengenbegrenzungen:** entfallen seit Sprint 11 (`TRIAL_VISIBLE`
wurde aus `levels.ts` entfernt) – die Demo zeigt keine begrenzte Auswahl
echter Daten mehr, sondern ausschließlich Demo-Inhalte (§3b).

**Event-Erstellung (Sprint 3 bestätigt):** `Entitlements` enthält nur
`eventsBrowse` und `eventsApply` – **keine** Erstellungs-Freigabe auf keiner
Stufe. Es existiert weder eine Route (`/app/events/new` → 404) noch eine
Server-Action mit `insert`/`update`/`delete` auf `events`. Der Create-Eintrag
in der `AppShell` ist deaktiviert und verlinkt nichts. Abgesichert durch
`tests/unit/event-permissions.test.ts`.

### 3a. Seitenweise Durchsetzung für Free/abgelaufenen Trial (Zugangs-Audit nach PR #23)

Ein Audit mit sieben getrennten Konten (anonym, unverifiziert, frei ohne Trial,
aktiver Trial, abgelaufener Trial, Mitglied, Admin) ergab: Server Actions und
API-Routen waren korrekt gesperrt, aber fünf **Seiten** lieferten für `free`
Inhalte, die laut Matrix erst ab `trial` vorgesehen sind. Ist-Zustand seit dem
Audit-Fix (`tests/integration/access-matrix.test.ts`, 25 Fälle):

| Seite | Free / abgelaufener Trial | Trial | Member/Admin |
| ----- | ------------------------- | ----- | ------------ |
| `/app/network` (Verzeichnis) | Locked-State (`NetworkLocked`, Sprint 12: Hinweis „geschlossene Beta“ + „Beta-Zugang aktivieren“), keine Daten geladen | Demo-Zweig (8 Demo-Profile, echte Abfrage läuft nicht) | ✅ (auch aktive Beta-Tester) |
| `/app/discover` | Locked-State (`NetworkLocked`; bis Sprint 11: Redirect `/app/billing?paywall=trial`) | Demo-Deck über Demo-Profile | ✅ (auch aktive Beta-Tester) |
| `/app/opportunities`, `/app/jobs`, `/app/investments` | Locked-State (außer aktiver Beta-Grant) | Demo-Zweig nur ohne Beta (`DemoAreaNotice` + Beispiele; keine echten Abfragen) | ✅; Beta ebenfalls ✅ mit den §3c-Rechten |
| `/app/opportunities/[id]` | Locked-State (Owner ausgenommen) | Locked-State | ✅ |
| `/app/investments/[id]` | Locked-State | Locked-State | ✅ |
| `/app/people/[handle]` | Locked-State (`NetworkLocked`; eigenes Profil ausgenommen) | Locked-State (eigenes Profil ausgenommen) | ✅ nur für echte, sichtbare Teilnehmer, mit Privatsphäre-Regeln (§3d); Beta-Tester ebenso |
| `/app/people/demo/[key]` | Locked-State | ✅ Demo-Profil | ✅ (Verzeichnis-Berechtigte) |
| `/app/events`, `/app/events/[slug]` | ✅ lesen; Sperrkarte statt Anmeldeformular | ✅ lesen; Sperrkarte | ✅ inkl. Anmeldung |
| `/app` (Dashboard) | sechs Kernbereichs-Karten (keine „Für dich“-Personalisierung mehr); gesperrte Bereiche bleiben als Karte mit Badge „Mitgliedschaft erforderlich“ sichtbar, Daten laden erst hinter der jeweiligen Bereichsroute; statt Vollansicht ein Mitgliedschafts-Panel („Deine Discovery-Demo ist beendet“ bzw. „Mitgliedschaft erforderlich“) + Events | Demo-Panel („Willkommen in deiner 48-stündigen Discovery-Demo“) + Kernbereiche mit „Demo“-Kennzeichnung | ✅ |
| `/app/billing` | ✅ – Planwahl-Buttons sind **deaktiviert**, solange weder Stripe konfiguriert noch Dev-Aktivierung erlaubt ist („Zahlung noch nicht freigeschaltet“); Paywall-Hinweis beschreibt den echten Kontostand (Trial-Text nur für aktiven Trial) | ✅ | ✅ |

`LockedArea` (`src/components/app/LockedArea.tsx`) ist der gemeinsame
Locked-State: Er ersetzt den Seiteninhalt vollständig (kein „Teaser“ mit
echten Daten), unterscheidet abgelaufenen Trial und Free und verlinkt auf
`/app/billing`. Die Entscheidung fällt weiterhin serverseitig über
`access.entitlements.*`; ein Client-Umweg gibt es nicht.

**Nicht verändert:** Registrierung, Verifizierung, Trial-Start (einmalig in
`completeOnboardingAction`) und Trial-Ablauf (lazy expiry über
`getAccessContext()`), Admin-Konsole.

### 3b. Discovery-Demo (Sprint 11) – Demo/Echt-Trennung

Die 48-Stunden-Phase ist eine **Demo**, kein eingeschränkter Echtzugang:

- **Entitlements:** `entitlementsFor("trial")` = `free` + `demoAccess: true`
  (zusätzlich `marketplaceBrowse`/`eventsBrowse` wie Free). `member`/`admin`
  haben `demoAccess: false`; jeder Demo-Zweig ist mit
  `demoAccess && !<echtes Entitlement>` gegated, damit Mitglieder nie
  versehentlich Demo sehen.
- **Datentrennung:** Demo-Inhalte stammen ausschließlich aus `src/lib/demo`
  (keine DB-Zeilen, IDs mit Präfix `demo:`); in den Demo-Zweigen werden die
  Mitglieder-/Deal-/Investment-Abfragen nicht ausgeführt – auch nicht als
  Zähler oder Teaser, nichts landet im RSC-Payload. Nachweis:
  `access-matrix.test.ts` (Trial-Render-Test prüft den Elementbaum auf
  echte Handles), `discovery-demo.test.ts` (Seiten, Actions, Datenbank vorher/
  nachher), HTTP-Prüfung der Seiten inkl. `RSC: 1`-Payload im Sprint-11-Bericht.
- **Server Actions für `trial`:** `sendConnectionRequestAction`,
  `followAction`, `applyToOpportunityAction`, `expressInvestmentInterestAction`,
  `applyToEventAction` → `membershipRequired`; Demo-IDs (`demo:…`) sind für
  keine Action gültig. Die simulierte Anfrage (`DemoConnectDialog`) ruft
  keine Action auf.
- **Echte Events:** lesbar (Liste, Detail, Datum · Uhrzeit, Ort, Programm,
  freie Plätze = `capacity − applied/confirmed/attended`, nur bei gesetzter
  Kapazität); Anmeldung ausschließlich mit `eventsApply` (Mitglied/Admin).
- **Nach Ablauf (Zustand 5):** `free` + `Trial.status = expired`; `startTrial()`
  → `already_used`; Demo-Seiten (inkl. `/app/people/demo/[key]`) zeigen den
  Mitgliedschafts-Screen; Konto, Profil, Profilbearbeitung, Inbox, Events
  (lesend), Marketplace-Liste, Billing bleiben.
- **Zahlung:** `activateMembership()` wird nur vom Membership-Service/Webhook
  bzw. der ausdrücklich erlaubten Dev-Aktivierung aufgerufen; mit
  `ALLOW_DEV_MEMBERSHIP_ACTIVATION=false` und ohne Stripe legt
  `/api/billing/checkout` **keine** Mitgliedschaft an
  (`discovery-demo.test.ts` §6).

### 3c. Private Beta (Abnahme 2026-09-30) – Plattformzugang ohne Mitgliedschaft

**Ausgangszustand vor dieser gezielten Anpassung (2026-09-30):** Der aktive
Beta-Grant öffnete nur echte Mitglieder-Suche/Discover, Vollprofile im Rahmen
der Privatsphäre, Kontaktanfragen und Chat. Follow, Feed/Beiträge, reale
Business-/Job-/Investmentbereiche und Event-Anmeldungen blieben gesperrt.
Marketplace zeigte trotz `marketplaceBrowse` nur Demo-Angebote; Real-Listing-
und Detailseiten prüften zusätzlich direkt `hasMemberAccess(level)`. Bei aktivem
48-h-Trial blieb `demoAccess = true`, sodass ein Beta-Tester weiterhin die
Discovery-Demo im Dashboard bzw. den Business-Demo-Seiten sah. Academy-Katalog
und Vorschau waren erreichbar, vollständige Kurse nicht. Der bestehende
Integrationstest bestätigte damals nur Netzwerk-Rechte; diese Beschreibung hält
den vorgefundenen Zustand fest, nicht den Zielzustand.

**Modell:** Ein Admin erstellt persönliche Beta-Schlüssel (`/admin/beta`).
Der Tester registriert sich normal, bestätigt seine E-Mail und löst den
Schlüssel unter Profil/Mitgliedschaft → **Beta-Zugang** (`/app/beta`) ein.
Dadurch entsteht ein `BetaAccess`-Datensatz (Standard 30 Tage ab Einlösung,
pro Schlüssel 1–365 Tage). Keine Mitgliedschaft, kein Stripe, keine Zahlung,
keine Rollenänderung. Die Beta bleibt eine eigene Achse; `level` bleibt `free`
oder `trial` und der Konto-/Zahlstatus wird nicht verändert.

**Präzedenz (getrennte Achsen):** Ein aktiver Beta-Grant gilt auch nach Ablauf
der 48-h-Discovery-Demo und unterdrückt während seiner Laufzeit `demoAccess`.
Ohne Beta bleibt ein aktiver Trial Demo-only. Nach Ablauf/Widerruf von Beta
fallen Nicht-Mitglieder auf Free-Regeln zurück – selbst wenn der Discovery-
Timer technisch noch nicht abgelaufen ist; die Trial-Zeile wird dadurch nicht
in eine Membership umgeschrieben. Aktive Membership bleibt `member` (und
konvertiert einen alten Trial), `User.role = admin` bleibt `admin`; beide haben
Vorrang vor Beta. Admin-Routen prüfen die Rolle separat – Beta kann nie
Admin-Rechte erteilen. Abgedeckt durch `tests/integration/beta-access.test.ts`
(A–G) sowie `tests/unit/beta-grant.test.ts`.

| Fähigkeit / Bereich | **Aktiver Beta-Zugang** | Beta abgelaufen/widerrufen | Member/Admin | Einschränkung im Beta-Grant |
| ------------------- | ---------------------- | -------------------------- | ------------ | --------------------------- |
| Start, Dashboard, Trial-Hinweis | ✅ echte Plattformbereiche; Demo-/Trial-Banner wird unterdrückt | Free-Dashboard, Ende-Hinweis | ✅ | kein Membership-Badge, keine Zahlung |
| Discover, Network, Vollprofile | ✅ echte Mitglieder, Privatsphäre §3d gilt | ➖ neue Suche/Profile; eigene Kontakte/Verläufe bleiben | ✅ | kein Umgehen von Privatsphäre/Blockierungen |
| Follow | ✅ | ➖ | ✅ | nur normale Follow-Funktion |
| Connection Requests | ✅ senden/annehmen; persönliche Nachricht bleibt erforderlich | ➖ neue Anfragen/annehmen; ablehnen/zurückziehen bleibt gemäß Basispolicy | ✅ | kein Umgehen der Teilnehmer-/Block-Prüfung |
| Inbox/Messaging | ✅ Chat mit bestätigten Kontakten | ➖ neue Nachrichten; bestehende eigene Verläufe lesbar | ✅ | keine fremden Unterhaltungen/kein Gruppenchat |
| Profil, Feed und normale eigene Beiträge | ✅ eigenes Profil pflegen, Feed lesen, normale Posts inkl. Bild erstellen | eigenes Profil/Beiträge bleiben; keine neuen Posts/kein fremder Feed | ✅ | kein Trust-Detail/keine Mitgliedskarte |
| Business Opportunities und Jobs/Projekte | ✅ echte Listings lesen, Details öffnen, bewerben | echte Bereiche gesperrt (kein Trial-Demo-Rückfall) | ✅ | keine Opportunities/Jobs erstellen oder verwalten; Deal-Management bleibt Membership-Gate |
| Investments | ✅ Opportunities lesen und unverbindliches Interesse bekunden | echter Investmentbereich gesperrt | ✅ | keine Investment-Einreichung/Publisher-Funktion |
| Marketplace | ✅ reale Listings und Details lesen | nur normale Free-Preview/Demo | ✅ | kein Verkauf, Checkout/Kauf derzeit nicht implementiert |
| Academy | ✅ Kurskatalog, Vorschaulektionen und bereits erteilte Enrollment-Zugänge | Vorschau/bestehendes Enrollment gemäß Free-Regeln | ✅ | kein Vollzugang zu Membership-/zahlungspflichtigen Kursen, kein Kursverkauf |
| Events | ✅ kuratierte reale Events lesen | reale Events lesbar | ✅ | Anmeldung/Tickets bleiben Membership-Gate bzw. nicht implementiert |
| Billing/Payments | Billing-Info wie Free; Checkout nur nach bestehender Payment-Konfiguration | Free-Regeln | ✅ | Beta allein aktiviert weder Subscription noch Checkout/Zahlung |
| Admin-/interne Funktionen | ➖ | ➖ | 🔒 nur Admin-Rolle | keinerlei Admin-Rechte |

**Schlüssel (serverseitig, `src/lib/beta/*`, `src/app/actions/beta.ts`):**
80 Bit Zufall (Crockford-Base32, `ICB-XXXX-XXXX-XXXX-XXXX`), gespeichert nur
als HMAC-SHA-256 mit `AUTH_SECRET`, Klartext genau einmal für den Admin;
einmalig nutzbar und an das einlösende Konto gebunden, optional an eine
E-Mail-Adresse; optionales Einlöse-Enddatum; Einlösung race-sicher über ein
bedingtes `UPDATE … WHERE status = 'active' RETURNING` (kein zweites Konto
kann denselben Schlüssel verbrauchen) und ein bedingtes Upsert (kein
Stapeln auf aktivem Zugang, sonst Rollback); Brute-Force-Schutz 8 Versuche/
Stunde/Konto und 30/Stunde/Netzwerkherkunft (gehashte IP); verständliche
Fehler `betaKeyInvalid`/`betaKeyUsed`/`betaKeyDisabled`/`betaKeyExpired`/
`betaKeyWrongAccount`/`betaAlreadyActive`/`betaNotNeeded`; Mitglieder/Admins
verbrauchen keinen Schlüssel; jede Admin-Aktion und jeder Fehlversuch wird
auditiert (ohne Klartext). **Nach Ablauf/Widerruf:** Die Kontaktliste liegt in der Inbox (Anfragen →
Kontakte), der Verlauf bleibt lesbar. Aktive Kontakte (Mitglieder, Tester)
können einem abgelaufenen Tester weiterhin schreiben – er liest, antwortet aber
nicht (gleiches, vorbestehendes Verhalten wie Mitglied ↔ Free-Kontakt; eine
Sperre würde zahlende Mitglieder einschränken). Ob der Absender einen Hinweis
sehen oder das Schreiben gesperrt werden soll, ist eine offene
Gründerentscheidung (K-22). **Achtung:** Wird `AUTH_SECRET` rotiert, passen die
gespeicherten Hashes nicht mehr – alle **noch nicht eingelösten** Schlüssel
werden ungültig (laufende Beta-Zugänge bleiben unberührt) und müssen neu
ausgestellt werden.

**Admin (nur `User.role = "admin"`, `requireAdmin()` + `requireAdminActor()`
in jeder Beta-Action):** Schlüssel erstellen (Notiz, E-Mail-Bindung, Dauer,
Einlöse-Enddatum), Einlösestatus + verknüpftes Konto + Zeitraum sehen,
verlängern (+7/+14/+30/+60 Tage; abgelaufene/widerrufene ab heute),
vorzeitig beenden, ungenutzte Schlüssel deaktivieren, Anzahl aktiver Tester.

**Wer ist im echten Netzwerk?** (`listedMemberSql`/`realParticipantSql`):
aktives, nicht-Demo-, verifiziertes Konto mit abgeschlossenem Onboarding
**und** aktuellem Netzwerkzugang (Admin, aktive Mitgliedschaft oder aktiver
Beta-Zugang), `discoverable = true`, keine Blockierung in irgendeiner
Richtung. Dieselbe Regel entscheidet, wer **Anfragen empfangen** kann –
Anfragen an Free-/Demo-/abgelaufene Konten, an sich selbst, an gelöschte
oder unbekannte IDs sowie über Blockierungen werden serverseitig abgewiesen
(`memberUnavailable`, `selfAction`, `demoConnectBlocked`).

### 3d. Privatsphäre-Einstellungen (Sprint 12 – K-06 geschlossen)

Durchgesetzt **serverseitig vor dem Rendern** (`src/lib/network/privacy.ts`,
Profilseite `src/app/(app)/app/people/[handle]/page.tsx`, Listen-Abfragen):

| Einstellung | Wirkung |
| ----------- | ------- |
| `discoverable = false` | nicht in Verzeichnis, Discover, „Für dich“; Profil nur für Kontakte/offene Anfragen erreichbar (sonst 404) |
| `profileVisibility = connections \| private` | Fremde sehen nur die Kopfkarte (Name, Foto, Rolle/Firma) + „Kontakt anfragen“; volles Profil für Kontakte und für Personen, denen das Mitglied selbst eine Anfrage gesendet hat |
| `contactVisibility` (Standard `connections`) | Website/X/Instagram nur gemäß Einstellung; E-Mail und Telefon werden nie angezeigt |
| `showLocation = false` | Standort nirgends angezeigt und vom Standortfilter nicht gefunden |
| `performanceVisibility` | Trust-Block nur für Betrachter mit `trustView` (Mitglieder) und gemäß Einstellung; Detailansicht und Bewertungsliste folgen derselben Regel |
| `allowConnectionRequests = false` | keine Anfragen möglich (`memberUnavailable`), neutraler Hinweis statt Button |
| `Post.visibility` (`public`/`members`/`connections`) | `userPosts()` filtert fremde Profilposts; `/api/media/posts/...` prüft die referenzierende, nicht gelöschte Post-Zeile und dieselbe Stufe/Verbindung serverseitig. Post-Bilder erhalten `private, no-store`; eigene Beiträge bleiben für den Autor sichtbar. |

### 3e. Manuelle administrative Mitgliedschaft (Konsolidierungs-Sprint 2026-09-28)

`/admin/users` (Rolle `admin`, serverseitig geprüft) steuert pro Konto die
**vollständige Mitgliedschaft manuell** – getrennt von Founding Member und
Private Beta:

- **Aktivieren** legt eine `Membership`-Zeile mit `provider = 'admin'` an
  (`activateMembershipByAdmin`). Die Level-Berechnung ist unverändert: aktive
  Membership-Zeile ⇒ Level `member` ⇒ exakt dieselben Gates wie bei Zahlung
  (Deals/Chancen, Jobs & Projekte, Investments, Marketplace, Academy, Events,
  Netzwerk/Messaging, Member Card, Trust-Detail). Keine Stripe-Anfrage, keine
  Rechnung, kein Zahlungstatus – `priceCents = 0` und das Billing-Badge
  „Administrativ aktiviert“ sind die ehrliche Kennzeichnung.
- **Entziehen** beendet nur die Membership-Zeile und die Karte
  (`revokeMembershipByAdmin`). Konto, Profil, Nachrichten, Kontakte,
  Trust-Daten, Beta-Zugang und Founding-Member bleiben unberührt; Beta bleibt
  eine eigene Achse (der Entzug ändert nichts an `BetaAccess`).
- Jede Aktion schreibt `AdminAuditLog` (`membership.admin_activated` /
  `membership.admin_revoked`, Actor = Admin) und ist demo-geschützt
  (Demo-Konten erhalten keine Membership).

## 4. Wo die Durchsetzung passiert (niemals nur in der UI)

| Ort | Mechanismus |
| --- | ----------- |
| `src/app/(app)/app/layout.tsx` | `requireUser()` + Verifizierungs-Redirect nach `/verify` |
| `src/app/admin/layout.tsx` (Sprint 12 verschoben – vorher lag das Layout außerhalb des Routenbaums und griff nicht), jede `/admin/*`-Seite | `requireAdmin()` |
| Networking-Actions (`network.ts`, `messages.ts`) | Verifizierung + `entitlements.connect/messaging` + Empfänger-Teilnahmeprüfung (`loadNetworkTarget`) + bedingte Schreibzugriffe (race-sicher) |
| Beta-Actions (`beta.ts`) | Einlösen: Session-Konto, Verifizierung, Rate-Limit; Admin-Aktionen: `requireAdminActor()` + `audit()` |
| Seiten | `requireUser()`, `requireVerifiedUser()`, `requireAccess("member")` oder `entitlements.*` → Redirect/Locked-State/`notFound()` |
| Server Actions | `getAccessContext()` in **jeder** Action, danach Eigentums-/Verbindungsprüfung |
| Eigentumsprüfungen | z. B. Opportunity-Owner, Nachrichten nur zwischen verbundenen Konten, Notifications/Applications nur mit passender `userId` |
| Blockierungen | `Block` wird in Kontakt- und Nachrichtenaktionen geprüft |
| Admin-Aktionen | `requireAdmin()` **und** `audit()`-Eintrag |
| Trust-Bewertung (`src/app/actions/trust.ts`, Sprint 16) | angemeldet **und** `entitlements.trustView` **und** nicht `isDemo`; `subjectId !== authorId`; Zielkonto aktiv und nicht `isDemo`; keine Blockierung in beide Richtungen; **Grundlage serverseitig nachgewiesen** (`hasCollaboration()` in `src/lib/trust/contexts.ts`); `stars` strikt `1`–`5`; keine Doppelbewertung derselben Grundlage (Vorprüfung **und** Unique Index `trust_review_basis_unique`); Rate-Limit 10/h; `rating10`/`contextLabel`/`verifiedContext` werden **abgeleitet**, nie aus dem Payload gelesen |

### 4a. Trust-Regeln im Detail (Sprint 16)

| Regel | Umsetzung |
| ----- | --------- |
| Score = Durchschnitt aller gültigen verifizierten Bewertungen | `computeTrustScore()` (`src/lib/trust/score.ts`): nur `status = 'published'`, `verifiedContext = true`, `isDemo = false`; ohne solche Zeilen `score10 = null` (**nie** 5,0) |
| Andere Signale verändern den Sterne-Score nicht | `src/lib/trust/reputation.ts` wird von `computeTrustScore()` nicht gelesen; nur eigene Anzeige |
| Eine Bewertung je Bewertendem, Bewertetem und Zusammenarbeit | Unique Index `trust_review_basis_unique` (`drizzle/0003_sprint16_trust_reviews.sql`) + Vorprüfung für eine verständliche Fehlermeldung |
| Grundlage ist nachweisbar | `hasCollaboration()` prüft `OpportunityApplication.status='accepted'`, `Enrollment.completedAt`, `InvestmentInterest` oder (neu) `DealRecord.status='confirmed'` – **serverseitig**, ein `contextId` aus dem Browser ist nur ein Zeiger |
| Ein **bestätigter Deal** ist ein Trust-Kontext | Kontext `deal` – die strengste der vier Grundlagen. Erfordert **beidseitige** Bestätigung; ein veröffentlichtes Angebot, eine Bewerbung, ein `applied`-Status oder ein einseitiger `DealRecord` erhöhen den Score **nie**. Neues Aggregatsignal `verified_deals` (nur bei `status='confirmed'`) |
| Demo-Daten sind keine Reputation | `isDemo`-Reviews zählen nie; `submitTrustReviewAction` lehnt Demo-Konten und Demo-Ziele ab; der Seed leitet seinen Cache aus denselben Regeln ab |
| Öffentlich sind nur aggregierte Zahlen | Angezeigt werden Score, Anzahl Bewertungen, Kategorie und Jahr – **kein** Titel, keine Gegenseite, kein Betrag (`contextLabel` ist ein Kategoriecode) |
| Entfernen wirkt sofort | `moderateTrustReviewAction` setzt `status='hidden'` und ruft `refreshTrustSummaryFor()`; Cache und Anzeige fallen im selben Schritt auf `null` |

### 3f. Deal-Bedingungen, Deal-Meldung und Gegenseitige Bestätigung (Deal-Fee-Sprint)

| Regel | Umsetzung |
| ----- | --------- |
| Deal-Typen brauchen eine Zustimmung, bevor sie veröffentlicht werden | `requireDealTermsConsent()` in `src/app/actions/deals.ts`, aufgerufen aus `createOpportunityAction()`. Ohne `dealTermsAccepted` → `fieldErrors.dealTermsAccepted = 'termsConsentRequired'`, **nichts wird geschrieben** |
| Die angezeigte Fassung ist verbindlich | Der Server prüft zusätzlich `dealTermsVersion` gegen `DEAL_TERMS_VERSION`. Ein Formular, das über eine Aktualisierung hinweg offen blieb, wird abgelehnt statt still neu zugeordnet |
| Die Fee-Stufe wird serverseitig bestimmt | `feeTierId`/`feeRateBps` werden aus dem **gespeicherten Volumen** neu berechnet (`calculateDealFee()`), nie aus dem Browser übernommen |
| Nicht jeder Create-Flow ist betroffen | `opportunityTypeSubjectToDealFee()`: nur `joint_venture`, `strategic_partnership`, `co_founder`, `other`. `job`, `freelance`, `customers`, `investment` bleiben unverändert |
| Marketplace ist **nicht** betroffen | `MARKETPLACE_FEE_POLICY.subjectToDealFee = false`; bestehende Preis- und Enrolment-Logik unverändert. Investments ebenso (`investmentSubjectToDealFee()`) |
| Nur Beteiligte sehen einen Deal | Jede Query in `src/lib/deals/records.ts` filtert auf `declaredById`/`counterpartyId`. `listDealsFor()` liefert für Dritte eine **leere** Liste; es existiert keine „alle Deals"-Abfrage |
| Nur Beteiligte können bestätigen | `confirmDeal()` prüft die Rolle und liefert `{ ok: false, reason: 'forbidden' }`; es wird **keine** `DealConfirmation`-Zeile geschrieben |
| Ein Deal zählt erst nach beidseitiger Bestätigung | `status` wird erst `confirmed`, wenn beide Seiten bestätigt haben; `pending_confirmation` und `disputed` zählen **nirgends** |
| Ablehnen ist immer möglich und folgenlos | `disputeDealAction()` → `status = 'disputed'`. Der Deal wird nicht gezählt. **Keine** Strafe, **kein** erfundener Vertragsschaden |
| Keine erfundenen Rechtsfolgen | `DealTermsAcceptance` ist ein **technischer Nachweis**, kein Vertrag: keine Vertragsstrafe, keine Haftungsfreistellung, keine steuerliche Aussage |

**Regel für neue Arbeit:** Eine Berechtigung wird in `src/lib/access/levels.ts`
ergänzt, serverseitig geprüft und **dieses Dokument aktualisiert**. UI-Prüfungen
allein sind ungültig.

### 3g. Vereinheitlichte Profile, Tab-Gating und direkte Badge-Vergabe (Sprint 2026-10-02)

Eigenes Profil (`/app/profile`) und Fremdprofil (`/app/people/[handle]`) teilen
sich die Komponente `ProfileView`; **alle** Unterschiede werden serverseitig in
den Page-Server-Components entschieden (nie im Client):

| Regel | Umsetzung |
| ----- | --------- |
| Tab-Gating nach Beziehung | `?tab=` wird serverseitig gegen die erlaubte Tab-Liste geprüft (`parseProfileTab`): fremde Profile erhalten Performance/Angebote nur bei bestehender Verbindung/offener Anfrage/admin; Interessen fremd nur, wenn das Ziel `interests` nicht auf privat steht; unbekannter Tab-Parameter fällt auf den Standard-Tab zurück |
| Privatsphäre bleibt serverseitig | Kennzahlen (`badgeNumbers`, `performance`, …) über `metricsVisibility`/`src/lib/network/privacy.ts` (§3d); `interestGroupsFor()` liefert fremd nur freigegebene Gruppen; begrenzte Profile (`limited`) rendern Rumpf ohne Stats/Tabs/Badges/Bio |
| Aktionen je Profil | Eigen: Bearbeiten/Teilen/Einstellungen + Post-Verwaltung (Footer-Render-Prop der eigenen Page). Fremd: Folgen, Nachricht, Kontakt anfragen – dieselben Server-Actions und Prüfungen wie vor dem Sprint |
| Badge-Sichtbarkeit | Öffentlich sind nur verifizierte, nicht widerrufene Badges (`reputationBadgesFor` mit `isNotNull(verifiedAt)`); Founding Member zusätzlich nur mit echter Nummer 1–50 (`hasPublicFoundingMemberBadge`) |
| Admin „Badge direkt vergeben" | `grantBadgeByAdminAction` in `src/app/actions/badges.ts`: `getAccessContext()` → nur `role=admin`; Ziel per Handle/E-Mail; Schwellen-Badges (z. B. `deal-volume-1m`) weiterhin nur bei erfüllter Progression (`reputationProgressFor`); Demo-Ziele werden abgelehnt; **eigenes Admin-Konto ist als Ziel erlaubt** (explizite Vergabe, kein Antragsflow) |
| Audit-Pflicht | Jede direkte Vergabe schreibt `AdminAuditLog` (`action = 'badge.granted'`, `entityId = UserBadge.id`, `metaJson` mit `userId`, `badgeSlug`, `internalReason`, `periodLabel`) über `audit()` in `src/lib/admin/audit.ts` |
| Selbstgenehmigungs-Schutz unverändert | Im **Antragsflow** (`reviewBadgeApplicationAction`) darf der eigene Antrag weiterhin nicht selbst genehmigt/abgelehnt werden (`selfAction`); die direkte Vergabe ist ein davon getrennter, expliziter Admin-Pfad |

Nachweis: `tests/integration/badge-admin-direct-grant.test.ts` (Selbst-Vergabe
inkl. Auditlog-Zeile, Schwellen-Guard, Nicht-Admin → `forbidden`,
Selbstgenehmigung → `selfAction`) und `tests/unit/profile-unified.test.tsx`
(identische Header-/Tab-Struktur eigen vs. fremd).

## 5. Rollen, die (noch) nicht existieren

| Rolle | Zustand |
| ----- | ------- |
| Verkäufer (Freigabe vor Verkauf) | Datenmodell `SellerProfile` vorhanden, Prüfung im Verkaufsflow fehlt (K-07b) |
| Creator/Partner (Referrals) | nicht implementiert |
| Investment-Publisher | faktisch „Mitglied darf einreichen + Admin gibt frei" |
| Qualifizierter Investor | nicht implementiert (Rechtsprüfung offen) |
| Gruppen-Admin / Firmen-Admin | nicht implementiert (keine Gruppen-/Firmentabellen) |
| Moderator / Support / Finanzen / Super-Admin | nicht implementiert – nur `user` \| `admin` |
| Founding Member | Anerkennung ohne Rechte (Feld + Admin-Aktion vorhanden) |


## Sprint-12-Abschlussnachweis (2026-09-24)

Keine Rechteänderung in dieser Fortsetzung. Bestehende Server-Matrix erneut
geprüft: 246 Unit-/Integrationstests inkl. Beta-Races und D1, plus 82
Worker-Browserchecks. Free-Demo kann weder fremden Chat noch private
Profildaten über direkten Seiten-/RSC-Aufruf abrufen; Beta schaltet keine
Membership-Zeile und keine Admin-Rolle frei; Member braucht keinen Key;
Admin-Routen verweigern Testern/Mitgliedern den Zugang (10/10).
Wichtig: das bestehende Leserecht für **eigene** frühere Chats nach Beta-Ende
ist kein Zugriff auf fremde Nachrichten und wurde bewusst beibehalten
(K-22, Gründerentscheidung zur weiteren Zustellung noch offen).
Nachweis: `preview/sprint12/e2e-results-final.json` und
[Abschlussbericht](SPRINT-12-FINAL-REPORT.md).
