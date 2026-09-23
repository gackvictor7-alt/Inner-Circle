# 06 – Zugangsstufen, Rollen & Berechtigungen (Ist-Zustand)

**Stand:** 2026-09-24 (Sprint 11: Discovery-Demo) · Quelle im Code: `src/lib/access/levels.ts` (Matrix,
client-safe) und `src/lib/access/server.ts` (Durchsetzung, serverseitig).
Ersetzt das frühere Zielbild in `06-access-roles.md`.

---

## 1. Zwei getrennte Achsen

1. **Mitgliedsstatus** (Zugangsstufe) – `visitor < free < trial < member < admin`.
2. **Aktivitätsfreigaben** – z. B. Verkäuferstatus (`SellerProfile.status`),
   Founding Member (nur Anerkennung, **kein** Recht), Admin-Rolle.
   Rollen in Profilen (`rolesJson`, `Profile.headline`) sind Selbstbeschreibung
   und **öffnen keine** Rechte.

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

**Ableitung** in `getAccessContext()` (einzige Wahrheit, pro Request gecacht):

```
admin            wenn User.role === "admin"
member           wenn Membership aktiv (status active/trialing, kein endedAt, currentPeriodEnd in der Zukunft)
trial            wenn Trial.status === "active" (lazy Ablaufprüfung, serverzeit-basiert) – seit Sprint 11 eine Demo (free + demoAccess)
free             sonst (angemeldet)
visitor          kein gültiges Session-Cookie
```

## 3. Berechtigungsmatrix (implementiert)

Zeichen: ✅ erlaubt · ➖ nicht erlaubt · ⚠️ eingeschränkt (siehe Fußnote) ·
🔒 nur mit Admin-Rolle.

| Bereich / Aktion | Visitor | Free | Trial | Member | Admin |
| ---------------- | ------- | ---- | ----- | ------ | ----- |
| Öffentliche Seiten/Previews sehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mitgliederverzeichnis sehen | ➖ | ➖ | ➖ (stattdessen 8 Demo-Profile) | ✅ | ✅ |
| Swipe-Discovery nutzen | ➖ | ➖ | ➖ (Demo-Discover über Demo-Profile, echte Filter/Ranking) | ✅ | ✅ |
| Profil eines Mitglieds sehen | public Preview-Seite `/member/[publicId]` | ➖ | ➖ (nur Demo-Profilseiten `/app/people/demo/[key]`) | ✅ voll | ✅ voll |
| Eigenes Profil bearbeiten | ➖ | ✅ (Free-Basisfelder) | ✅ (wie Free) | ✅ | ✅ |
| Follow | ➖ | ➖ | ➖ (`membershipRequired`) | ✅ | ✅ |
| Kontaktanfrage senden | ➖ | ➖ | ➖ echte Anfrage (`membershipRequired`); simulierte Demo-Anfrage ohne Datenbankschreibung | ✅ unbegrenzt | ✅ |
| Anfragen annehmen/ablehnen | ➖ | ✅ (Empfänger) | ✅ | ✅ | ✅ |
| Blockieren | ➖ | ✅ | ✅ | ✅ | ✅ |
| Nachrichten senden | ➖ | ➖ | ➖ | ✅ (nur bestätigte Verbindung) | ✅ |
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
| Verbindungsanfrage senden | ➖ | ➖ | ➖ (`membershipRequired`) | ✅ | ✅ |
| **Verbindungsanfrage ohne persönliche Nachricht** | ➖ | ➖ | ❌ `connectionMessageRequired` | ❌ | ❌ |
| Events lesen/bewerben | Preview `/events` | ✅ Liste + Detail (Datum · Uhrzeit, Ort, Programm, freie Plätze aus echter Kapazität) / ➖ Anmeldung (Sperrkarte, `membershipRequired`) | ✅ lesen / ➖ Anmeldung (wie Free) | ✅ | ✅ |
| **Events anlegen/bearbeiten (Mitglieder)** | ❌ | ❌ | ❌ | ❌ **bewusst nicht implementiert** | 🔒 Admin/IC-Team (keine Route, keine Action) |
| Tickets/Check-in | ➖ | ➖ | ➖ | **nicht implementiert** | – |
| Trust & Performance (eigene Sicht) | ➖ | ➖ | ➖ | ✅ | ✅ |
| Bewertungen abgeben | ➖ | ➖ | ➖ | ➖ | ➖ (Pipeline fehlt) |
| Mitgliedskarte erhalten/anzeigen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Eigene Karte öffentlich prüfen lassen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing/Planwahl | ➖ | ✅ | ✅ | ✅ | ✅ |
| Mitgliedsantrag stellen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Buchhaltung/Rechnungen sehen | ➖ | ➖ | ➖ | ✅ (Daten nur mit Provider) | ✅ |
| Admin-Konsole öffnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Nutzer sperren / Founding Member setzen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Investments freigeben/ablehnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Mitglieds-/Löschanträge bearbeiten | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Audit-Log einsehen (implizit über Admin-Ansichten) | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Dev-Postausgang `/dev/outbox` | ➖ | ➖ | ➖ | ➖ | 🔒 (zusätzlich `ENABLE_DEV_OUTBOX=true`) |

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
| `/app/network` (Verzeichnis) | Locked-State (`LockedArea`), keine Daten geladen | Demo-Zweig (8 Demo-Profile, echte Abfrage läuft nicht) | ✅ |
| `/app/discover` | Redirect `/app/billing?paywall=trial` | Demo-Deck über Demo-Profile | ✅ |
| `/app/opportunities`, `/app/jobs`, `/app/investments` | Locked-State | Demo-Zweig (`DemoAreaNotice` + Beispiel-Sektionen, keine echten Abfragen) | ✅ |
| `/app/opportunities/[id]` | Locked-State (Owner ausgenommen) | Locked-State | ✅ |
| `/app/investments/[id]` | Locked-State | Locked-State | ✅ |
| `/app/people/[handle]` | Locked-State (eigenes Profil ausgenommen) | Locked-State (eigenes Profil ausgenommen) | ✅ |
| `/app/people/demo/[key]` | Locked-State | ✅ Demo-Profil | ✅ (Verzeichnis-Berechtigte) |
| `/app/events`, `/app/events/[slug]` | ✅ lesen; Sperrkarte statt Anmeldeformular | ✅ lesen; Sperrkarte | ✅ inkl. Anmeldung |
| `/app` (Dashboard) | Kennzahlen/„Für dich“ nur für freigegebene Bereiche; statt Vollansicht ein Mitgliedschafts-Panel („Deine Discovery-Demo ist beendet“ bzw. „Mitgliedschaft erforderlich“) + Events | Demo-Panel („Willkommen in deiner 48-stündigen Discovery-Demo“) + Kernbereiche mit „Demo“-Kennzeichnung | ✅ |
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

## 4. Wo die Durchsetzung passiert (niemals nur in der UI)

| Ort | Mechanismus |
| --- | ----------- |
| `src/app/(app)/app/layout.tsx` | `requireUser()` + Verifizierungs-Redirect nach `/verify` |
| `src/app/(app)/admin/layout.tsx`, jede `/admin/*`-Seite | `requireAdmin()` |
| Seiten | `requireUser()`, `requireVerifiedUser()`, `requireAccess("member")` oder `entitlements.*` → Redirect/Locked-State/`notFound()` |
| Server Actions | `getAccessContext()` in **jeder** Action, danach Eigentums-/Verbindungsprüfung |
| Eigentumsprüfungen | z. B. Opportunity-Owner, Nachrichten nur zwischen verbundenen Konten, Notifications/Applications nur mit passender `userId` |
| Blockierungen | `Block` wird in Kontakt- und Nachrichtenaktionen geprüft |
| Admin-Aktionen | `requireAdmin()` **und** `audit()`-Eintrag |

**Regel für neue Arbeit:** Eine Berechtigung wird in `src/lib/access/levels.ts`
ergänzt, serverseitig geprüft und **dieses Dokument aktualisiert**. UI-Prüfungen
allein sind ungültig.

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
