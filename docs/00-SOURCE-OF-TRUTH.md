# 00 – SOURCE OF TRUTH (INNER CIRCLE)

**Diese Datei ist der verbindliche Einstiegspunkt für jeden Menschen und jeden
KI-Agenten, der an diesem Repository arbeitet.**

- **Stand:** 2026-09-21
- **Technische Basis:** Branch `main`, Commit `f22c19e` ("fix(auth): honest
  delivery states, protected dev outbox, working 48h trial start")
- **Gültigkeit:** Der **Code im Repository** ist die technische Wahrheit. Diese
  Dokumentation beschreibt, was dort tatsächlich steht – nicht, was geplant war.
- **Design-Status:** siehe [`10-design-freeze.md`](10-design-freeze.md) –
  **APPROVED / DO NOT REDESIGN WITHOUT EXPLICIT FOUNDER REQUEST**

---

## 1. Was INNER CIRCLE ist

Ein digitales Business-Ökosystem für Gründer, Unternehmer, Investoren, Creator,
Freelancer, Berater und Unternehmen. Leitprinzip: **Zugang schafft Chancen.**
Vier Säulen: **Netzwerk · Geschäfte · Wissen · Kapitalzugang (+ Erlebnisse).**

Details: [`01-product.md`](01-product.md)

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
| Tests | Vitest: 12 Dateien / **56 Tests grün** (`npm test`) |

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
| Startseite `/` (Hero, Säulen, Stats, Events, Membership, FAQ, CTA) | WORKING | `src/app/(site)/HomeContent.tsx`, Build + manueller Smoke |
| Preview-Seiten `/network`, `/business-deals`, `/investments`, `/marketplace`, `/events` | WORKING | statische Inhalte, nicht aktivierte Funktionen als „Demnächst verfügbar" gekennzeichnet |
| `/membership` (Preise, Leistungen) | WORKING | 24,99 €/Monat aktiv; Jahrespreis im Marketing noch als „folgt" (siehe Known Issue) |
| Auth-Seiten `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify` | WORKING | siehe Bereich B |
| Rechts-Platzhalter `/imprint`, `/privacy`, `/terms` | PARTIAL | bewusst Platzhalter, kein geprüfter Rechtstext |
| `/design` (internes Design-System) | WORKING | nur Styleguide, kein Produktfeature |
| 404 | WORKING | `src/app/(site)/not-found.tsx` |

### B. Authentication & Identity

| Funktion | Status | Nachweis / Einschränkung |
| -------- | ------ | ------------------------ |
| Registrierung E-Mail + Passwort | WORKING | `registerAction`, `tests/integration/auth-flow.test.ts` |
| Passwort-Hashing (scrypt, OWASP-Parameter) | WORKING | `tests/unit/auth-crypto.test.ts` |
| Login | WORKING | `loginAction`, Integrationstest |
| Logout (Session-Widerruf serverseitig) | WORKING | `logoutAction`, `/api/auth/logout` |
| Sessions (30 Tage, httpOnly, gehasht) | WORKING | `src/lib/auth/session.ts` |
| E-Mail-Verifizierung (Code-Erzeugung, Hash, Ablauf, Versuche) | WORKING | `src/lib/auth/otp.ts`, `onboarding.test.ts` |
| **Echter E-Mail-Versand (Resend)** | **WORKING / PARTIAL (DNS offen)** | `RESEND_API_KEY` aktiv; responsive Multipart-Templates (HTML+Text DE/EN); offene Produktionsabhängigkeit: eigene verifizierte Domain (SPF/DKIM/DMARC) gegen Spamfilter der Test-Domain `resend.dev` |
| Verifizierung im Dev-Postausgang | WORKING | `ENABLE_DEV_OUTBOX` + Admin-Rolle, Testabdeckung `message-delivery.test.ts` |
| SMS-Verifizierung (Twilio) | BLOCKED | kein Twilio-Konto/Schlüssel |
| Registrierung per Telefonnummer | NOT IMPLEMENTED | UI-Umschalter existiert, Übermittlung schlägt fehl (Known Issue K-05) |
| Google OAuth | NOT IMPLEMENTED | Button zeigt „Einrichtung erforderlich", Route `/api/auth/oauth/google` existiert **nicht** |
| Apple OAuth | NOT IMPLEMENTED | wie Google |
| Passwort vergessen/zurücksetzen | PARTIAL | Mechanik + Token + Session-Widerruf WORKING; Versandweg ohne Provider = Dev-Postausgang oder gar nicht |
| Rollen (`user` / `admin`) | WORKING | `User.role`, `requireAdmin()` |
| 2FA (`login_2fa`) | PREPARED | Enum-Wert im Schema, keine UI/Logik |

### C. Trial & Membership

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Free-Account (Status `free`) | WORKING | `entitlementsFor("free")` |
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
| Profil ansehen/bearbeiten (Bio, Rolle, Firma, Links) | WORKING | `/app/profile`, `/app/profile/edit`; **LinkedIn aus UI entfernt und deprecated** (DB-Spalte für Datenintegrität erhalten); Instagram, X und Website sekundär; IC-Business-Identität priorisiert |
| Interessen & Ziele (Onboarding-Taxonomie) | WORKING | `/onboarding/interests`, `completeOnboardingAction`, Apple-artiges UX-Design, strukturierte Gruppen, mind. 3 Pflicht, `onboarding.test.ts` |
| Statistiken (Kontakte, Follower, Posts) | WORKING | `/app/profile`, `profileStats()` |
| Trust & Performance (eigene Sicht) | PARTIAL | Ansicht + Datenmodell vorhanden; Bewertungen können **nicht** abgegeben werden (Verifikations-Pipeline fehlt) |
| Öffentliche Mitgliedskarte verifizieren | WORKING | `/member/[publicId]` |
| Activity Feed (Posts) | WORKING | `Post`, `createPostAction`, Feed auf Dashboard |
| Profilsichtbarkeit / Datenschutz-Einstellungen | PARTIAL | Werte werden gespeichert (`PrivacySettings`), aber nicht überall in Queries erzwungen |
| Avatar-/Cover-Upload | NOT IMPLEMENTED | nur URL-Feld; kein Storage-Anbieter (S3/R2) angebunden |

### E. Network

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Member Discovery (Verzeichnis mit Suche/Filter) | WORKING | `/app/network`, `listDirectoryMembers()` |
| Follow | WORKING | `followAction` |
| Connection Requests (senden/annehmen/ablehnen/zurückziehen) | WORKING | `network.ts`, `messaging-authorization.test.ts` |
| Swipe Discovery | WORKING | `/app/discover`, `DiscoverDeck` |
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
| Deal Rooms (private Räume, Dokumente, Meilensteine) | NOT IMPLEMENTED | keine Tabellen, keine UI |
| Provisions-Engine | NOT IMPLEMENTED | – |
| Vertraulichkeitsstufen über „standard" hinaus | PREPARED | `BusinessOpportunity.confidentiality` existiert, Logik fehlt |

### G. Marketplace & Academy

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Listings anlegen/publizieren (Services, Produkte, Kurse) | WORKING | `/app/marketplace/new`, `createListingAction` |
| Listings browsen/Detailseite | WORKING | `/app/marketplace`, `/app/marketplace/[id]` |
| Kurse: Struktur (Module, Lektionen), Enrollment, Fortschritt | WORKING | `Course`/`CourseModule`/`Lesson`/`Enrollment`/`LessonProgress` |
| **Kauf/Bezahlung** von Produkten, Services, Kursen | NOT IMPLEMENTED | kein Checkout, keine Bestell-/Zahlungstabellen; Kurszugang wird als „gewährt" ohne Zahlung protokolliert |
| Verkäuferprofile/Freigabe-Workflow | PARTIAL | `SellerProfile`-Tabelle + Admin-Freigabeaktion; keine UI zum Beantragen |
| Zertifikate, Video, Buchungen | NOT IMPLEMENTED | – |

### H. Investments

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Opportunities einreichen (Mitglied) | WORKING | `/app/investments/submit`, `submitInvestmentAction` |
| Admin-Prüfung (approved/rejected + Notiz) | WORKING | `/admin/investments`, `reviewInvestmentAction` |
| Listings + Detailseite (nur freigegebene sichtbar) | WORKING | `/app/investments`, `/app/investments/[id]` |
| Absichtserklärungen (Interesse ausdrücken) | WORKING | `expressInvestmentInterestAction` |
| Regulierte Abläufe (Zeichnung, Zahlung, Verträge, Dokumente) | NOT IMPLEMENTED | bewusst offen, Rechtsprüfung nötig |

### I. Events

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Events ansehen (Mitgliederbereich) | WORKING | `/app/events`, `Event`-Tabelle |
| Bewerben/Abbestätigen, Warteliste-Flag | WORKING (Datenmodell) | `applyToEventAction`, `cancelEventApplicationAction` |
| Tickets, QR-Check-in, Attendance | NOT IMPLEMENTED | Bewerbungen existieren, keine Ticket-/Check-in-Tabellen |
| Events anlegen (Admin/Veranstalter) | NOT IMPLEMENTED | `AppShell`-Eintrag bewusst deaktiviert |
| Öffentliche Events-Seite mit echten Daten | PARTIAL | `/events` ist eine öffentliche Preview mit ehrlichem Leerzustand |

### J. Trust & Performance

| Funktion | Status | Nachweis |
| -------- | ------ | -------- |
| Trust-Score-Anzeige (leer, ohne erfundene Werte) | PARTIAL | `TrustScoreSummary`, `/app/trust`; ohne verifizierte Bewertungen bleibt der Score leer |
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
| Automatisierte Tests | WORKING | 61 Tests grün (13 Testdateien) |
| CI (GitHub Actions) | NOT IMPLEMENTED | keine Workflows im Repo |
| Lint | PARTIAL | 15 bestehende Hinweise (5 Fehler, 10 Warnungen) – verbessert von 21/7 |
| Monitoring/Alerting | PREPARED | Observability im Worker aktiv, keine Alarme |

## 5. Dokumentenindex

| Datei | Inhalt |
| ----- | ------ |
| [`00-SOURCE-OF-TRUTH.md`](00-SOURCE-OF-TRUTH.md) | Diese Datei – Einstieg, Statusübersicht, Reihenfolge |
| [`01-product.md`](01-product.md) | Produktvision, Geschäftsmodell, MVP-Umfang, Produktbereiche |
| [`02-architecture.md`](02-architecture.md) | Technische Architektur im Ist-Zustand, Verzeichnisstruktur, Schichten |
| [`03-routes.md`](03-routes.md) | vollständige Route-Map + Server Actions + API-Routen |
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

## 7. Projektregeln (Kurzfassung, verbindlich)

1. **Keine Dead Buttons / keine Fake Features** – jeder sichtbare Button
   funktioniert, ist deaktiviert oder klar als „Demnächst verfügbar" /
   „Einrichtung erforderlich" gekennzeichnet. Keine UI darf eine Funktion
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

## 8. Nächster empfohlener Schritt

**Eigene verifizierte E-Mail-Domain für die Produktion** (Resend-Domain anlegen,
SPF/DKIM/DMARC im DNS konfigurieren, `EMAIL_FROM` auf die verifizierte Domain
setzen, um Spam-Filterung der Resend-Sandbox `resend.dev` vollständig zu
beseitigen). Details: [`07-integrations.md`](07-integrations.md) und
[`12-roadmap.md`](12-roadmap.md) → Abschnitt NEXT.
