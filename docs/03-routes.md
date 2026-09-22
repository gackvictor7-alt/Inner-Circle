# 03 – Route Map, Server Actions & API-Routen

**Stand:** 2026-09-22 (Sprint 6) · Basis: Branch `arena/01a0c9c0-inner-circle`
(Basis `main` @ `a563999`).
Quelle: `src/app/**` plus Build-Ausgabe von `npm run cf:build`
(58 Einträge: 57 dynamische Routen + `/_not-found`).

**Zugriffsstufen:** `public` · `free` (registriert) · `trial` · `paid`
(Mitglied) · `admin` · `registered-unverified` (Konto ohne bestätigte
E-Mail/Telefon).
Details zur Rechteableitung: [`06-permissions.md`](06-permissions.md).

**Sprint 6 – Route-Matrix:** siehe Abschnitt 8 unten – vollständige Matrix
mit Route, Public/Auth, Zweck, echte Daten vs Demo, CTA, Status, Permission,
offene Probleme. Keine Route wurde gelöscht; doppelte Routen dokumentiert,
nur konsolidiert wenn Verhalten 100% erhalten bleibt.

---

## 1. A – Public Website

| URL | Zweck | Zugriff | Status | Daten | Berechtigungen / Hinweise |
| --- | ----- | ------- | ------ | ----- | ------------------------- |
| `/` | Startseite – **verkürzt**: Hero → Was ist INNER CIRCLE? → sechs Bereiche → Proof (Stats) → Membership-CTA | public | WORKING | liest `PlatformMetric` aus D1 (Fehler ⇒ Statistik-Sektion entfällt) | `force-dynamic`; Layout liest Access-Level für Header-CTA |
| `/network` | Preview Netzwerk | public | WORKING | keine DB; Inhalte aus i18n | Konto-CTAs verlinken auf `/register`; nicht aktive Teile als „Demnächst verfügbar" |
| `/business-deals` | Preview Business Deals | public | WORKING | keine DB | `ComingSoonPanel` für Deal-Räume |
| `/investments` | Preview Investments | public | WORKING | keine DB | Hinweis „Discovery, keine Ausführung"; kein Rendite-Wording |
| `/marketplace` | Preview Marktplatz & Academy | public | WORKING | keine DB | Tabs Marktplatz/Academy |
| `/events` | Preview Events | public | WORKING | keine DB | ehrlicher Leerzustand, keine erfundenen Termine |
| `/membership` | Preismodell 24,99 €/Monat und 249,90 €/Jahr, Leistungen, Trust-Rechtliches | public | WORKING | keine DB | Checkout läuft über Dev-Aktivierung, Stripe scharf = Roadmap S-1 |
| `/imprint`, `/privacy`, `/terms` | Rechtliche Platzhalter | public | PARTIAL | keine DB | bewusst ohne Fake-Rechtstext, vor Launch zu ersetzen |
| `/design` | internes Design-System (Styleguide) | public (intern verlinkt) | WORKING | keine DB | kein Produktfeature; Design-Freeze beachten |
| `/_not-found` | 404-Seite | public | WORKING | keine DB | einzige statisch vorgerenderte Route |
| `/member/[publicId]` | öffentliche Verifizierung einer Mitgliedskarte | public | WORKING | `MembershipCard` + `Membership` + `User`/`Profile` | zeigt nur Name, Handle, Karte, Status; `force-dynamic` |

## 2. A/B – Auth-Seiten

| URL | Zweck | Zugriff | Status | Daten | Berechtigungen / Hinweise |
| --- | ----- | ------- | ------ | ----- | ------------------------- |
| `/register` | Registrierung E-Mail/Passwort | public | WORKING | schreibt `User`, `Profile`, `PrivacySettings`, `NotificationPreference`, `Session`, `VerificationCode`, `AdminAuditLog` | Rate-Limit 8/h pro IP; Alter + AGB Pflicht. Telefon-Umschalter führt in einen Fehler (K-05) |
| `/login` | Anmeldung | public | WORKING | liest `User`, schreibt `Session`, ggf. `VerificationCode` | unverifizierte Konten landen auf `/verify`; Ratelimit 12/15 min pro IP |
| `/verify` | Code-Eingabe (E-Mail/Telefon) | registered-unverified | PARTIAL | `VerificationCode`, `User.emailVerifiedAt/phoneVerifiedAt` | Zustellmodus wird serverseitig ermittelt (`provider`/`dev`/`none`); ohne Provider = „Versand noch nicht eingerichtet" (K-01). Dev-Link nur für Admins |
| `/forgot-password` | Reset anfordern | public | PARTIAL | schreibt `AuthToken`, versendet Link | Antwort immer identisch (keine Enumeration); ohne Provider landet die Mail im Dev-Postausgang oder nirgends (K-01) |
| `/reset-password?token=…` | neues Passwort setzen | public (Token) | WORKING | liest/aktualisiert `AuthToken`, `User`; widerruft `Session`s | Token 60 min, einmalig; Rate-Limits greifen über die Action |
| `/checkout/success` | Rückleitung von Stripe/Dev-Aktivierung | public | WORKING | liest `Membership` des angemeldeten Nutzers | **erteilt nichts** – Status kommt ausschließlich aus DB/Webhook |
| `/checkout/cancel` | Abbruch der Zahlung | public | WORKING | keine DB | – |
| `/dev/outbox` | Entwicklungs-Postausgang (Code-Einsicht) | admin + `ENABLE_DEV_OUTBOX=true` | WORKING | `DevOutbox` | sonst `notFound()`; `noindex`; Produktions-Warnbanner; Allowlist sichtbar |

## 3. B/C/D/E/F/H/I – Onboarding & Mitgliederbereich

Alle Routen liegen unter dem App-Layout `src/app/(app)/app/layout.tsx`, das
`requireUser()` und die Verifizierung erzwingt (unverifiziert ⇒ `/verify`).

| URL | Zweck | Zugriff | Status | Daten | Berechtigungen / Hinweise |
| --- | ----- | ------- | ------ | ----- | ------------------------- |
| `/onboarding/interests` | Interessen/Ziele + Start des 48-h-Trials | **free** (verifiziert) | WORKING | `Profile` (onboardingCompletedAt), `UserInterest`, `UserGoal`, `Trial` | nur ohne abgeschlossenes Onboarding (`onboardingComplete` ⇒ `/app`); mind. 3 Interessen; Trial genau einmal |
| `/app` | **Start** – kompakte Kopfzeile (`Hallo, <Name>`, Trial-Chip, Inbox-Shortcut) + sechs Kernbereichs-Karten | free | WORKING | `Connection`, `Follow`, `Post`, `BusinessOpportunity`, `TrustScoreSummary`, `PerformanceRecord`, `Conversation`, `Message`, `Notification`, `Event` | Trial-Banner + Countdown; Datenschutz-/Verifizierungshinweise |
| `/app/network` | Mitgliederverzeichnis mit Suche/**Rolle**/**Standort**/Interessen (Sprint 7); echte Mitglieder zuerst, darunter die klar als DEMO-PROFIL markierten Beispielprofile, solange < 8 echte (gefilterte) Mitglieder existieren (§4a); Verbindungsstatus richtungsabhängig: gesendet → „Anfrage gesendet" + Zurückziehen, erhalten → Annehmen/Ablehnen | trial+ | WORKING (free sieht Locked-State) | liest `User`/`Profile`/`Follow`/`ConnectionRequest`, `Interest` + `src/lib/demo` (kein DB-Zugriff für Demo) | `listDirectoryMembers()` respektiert `discoverable`; Sichtbarkeit je Privacy teilweise (K-06) |
| `/app/discover` | **Discover** – Business-Karten, Relevanz-Ranking, Filter `?role=&location=&radius=&industry=&interest=&lookingFor=&offering=&invest=&kind=&more=` | trial+ | WORKING | `listDiscoverCandidates()` + `src/lib/discover/matching.ts` (Interessen, Ziele, Branche, Standort **inkl. Umkreis über gebündelte Städtetabelle**, Ich suche, Ich biete, Investmentinteressen) | ohne `entitlements.networkDiscover` ⇒ Redirect `/app/billing?paywall=trial`; Connect nur mit Pflichtnachricht |
| `/app/inbox` | **Inbox** – `?tab=messages\|requests\|notifications`, Anfragen zusätzlich `?sub=requests\|sent\|connections` | free (Messaging nur member) | WORKING | `Conversation`, `Message`, `ConnectionRequest`, `Connection`, `Notification` | ersetzt `/app/messages`, `/app/connections`, `/app/notifications` (Umleitungen) |
| `/app/connections` | Anfragen (eingehend/ausgehend), Verbindungen | free | WORKING | `ConnectionRequest`, `Connection` | Annehmen/Ablehnen/Zurückziehen/Trennen serverseitig geprüft |
| `/app/messages` | 1:1-Nachrichten | member (Messaging-Entitlement) | WORKING | `Conversation`, `ConversationParticipant`, `Message` | nur mit bestätigter Verbindung; sonst Redirect auf Verbindungen; Trial sieht Hinweis statt Eingabe |
| `/app/notifications` | **Umleitung** → `/app/inbox?tab=notifications` | free+ | WORKING | – | – |
| `/app/profile` | **Profil-Hauptbereich** – kompakten Header (Avatar/Name/Handle/Positionierung, Statistikzeile, Action-Zeile) + `?tab=activity\|overview\|performance\|offers` (Standard: Beiträge) | free | WORKING | `Profile`, `User`, `Post`, `Follow`, `Connection`, `TrustScoreSummary`, `PerformanceRecord`, `BusinessOpportunity`, `MarketplaceListing`, `InvestmentOpportunity`, `PrivacySettings` | Übersicht zeigt sekundäre Infos als Accordions (`<details>`); Trust & Performance, Konto-Links und schmaler Profilfortschritt leben hier |
| `/app/profile/edit` | Profil bearbeiten **inkl. Interessen & Ziele** | free | WORKING | `Profile`, `User`, `UserInterest`, `UserGoal` | Rate-Limit 40/h; dieselbe Taxonomie wie das Onboarding |
| `/app/settings` | **Darstellung (Hell/Dunkel/System)**, Datenschutz, Kennzahlen-Sichtbarkeit, Benachrichtigungen, Blockierte, Löschantrag, Dev-Link | free | WORKING | `PrivacySettings` (inkl. `metricsVisibilityJson`), `NotificationPreference`, `Block`, `AccountDeletionRequest` | Theme über die bestehende `ThemeProvider`-Infrastruktur |
| `/app/card` | digitale Mitgliedskarte + QR | member (Karte) | WORKING | `MembershipCard`, `Membership`, `User` | Free/Trial sieht Sperrhinweis; `entitlements.memberCard` |
| `/app/billing` | Mitgliedschaft, Planwahl, Abrechnung, Paywall | free | WORKING | `Membership`, `Invoice` | Checkout-POST `/api/billing/checkout`; Dev-Aktivierung nur ohne Stripe & außerhalb Produktion |
| `/app/membership-application` | Antrag auf Voll-Mitgliedschaft | member | WORKING | `MembershipApplication` | Free/Trial sieht Sperrhinweis; Prüfung durch Admin |
| `/app/trust` | Trust & Performance (Detailseite; kein Navigationspunkt mehr) | trial+ | PARTIAL | `TrustScoreSummary`, `TrustReview`, `PerformanceRecord` | ohne Bewertungen bleibt der Score leer; Abgabe bewusst nicht aktiv (K-08) |
| `/app/opportunities` | Business-Chancen (Liste, Filter) | trial+ | WORKING | `BusinessOpportunity`, `OpportunityApplication`, `User`, `Profile` | Free sieht Locked-State; Demo-Inhalte markiert |
| `/app/opportunities/new` | Chance anlegen (`?type=job` wählt den Typ vor) | member | WORKING | schreibt `BusinessOpportunity` | Ratelimit 10/h; `entitlements.opportunitiesManage` |
| `/app/opportunities/[id]` | Detail + Bewerbung, Antworten des Owners | member (Ansehen trial+) | WORKING | `BusinessOpportunity`, `OpportunityApplication` | Bewerbung nur mit `opportunitiesApply`; Owner sieht Bewerbungen |
| `/app/jobs` | Jobs & Projekte (gefilterte Chancen `job`/`freelance`) | trial+ | WORKING | `BusinessOpportunity`, `User`, `Profile` | CTA nur mit `opportunitiesManage` |
| `/app/marketplace` | Marktplatz-Listings (Produkte, Services, Kurse) | public im Mitgliederbereich (free/trial sehen Liste) | WORKING | `MarketplaceListing`, `Profile`, `User` | CTA „Angebot erstellen" nur mit `marketplaceSell` |
| `/app/marketplace/new` | Listing anlegen (`?kind=course` wählt die Kategorie vor) | member | WORKING | schreibt `MarketplaceListing` (+ `Course` bei `kind=course`) | Ratelimit 10/h; **kein** Verkäuferfreigabe-Gate (K-07b) |
| `/app/marketplace/[id]` | Listing-Detail | free/trial/member | WORKING | `MarketplaceListing`, `Course`, `Enrollment`, `Profile` | Kurs ohne Zahlung („Kaufweg nicht aktiv", K-07a) |
| `/app/learn` | Academy: Kursbibliothek | free (Preview-Lektionen) / member (voll) | WORKING | `Course`, `MarketplaceListing`, `Enrollment` | `courseFullAccess` steuert Vollzugriff/Enrollment |
| `/app/learn/[id]` | Kursseite: Module, Lektionen, Fortschritt | free/member | WORKING | `CourseModule`, `Lesson`, `Enrollment`, `LessonProgress` | Abhaken nur mit Enrollment bzw. `courseFullAccess` |
| `/app/investments` | Investment-Chancen (nur `approved`) | trial+ | WORKING | `InvestmentOpportunity`, `InvestmentInterest` | Free sieht Locked-State; Beträge ohne Renditeversprechen |
| `/app/investments/submit` | Chance einreichen | member | WORKING | schreibt `InvestmentOpportunity` (Status `submitted`) | Ratelimit 5/Tag; Sichtbarkeit erst nach Admin-Freigabe |
| `/app/investments/[id]` | Detail + Absichtserklärung | trial+ | WORKING | `InvestmentOpportunity`, `InvestmentInterest` | nicht freigegebene Einträge nur für Einreicher/Admin (`notFound()`) |
| `/app/events` | Events im Mitgliederbereich (**eigener Hauptbereich**) | free | WORKING | `Event`, `EventApplication` | Liste zeigt nur veröffentlichte Zustände; Hinweis „kuratiert von INNER CIRCLE"; **keine Erstellung durch Mitglieder** |
| `/app/events/[slug]` | Event-Detail + Bewerbung/Abbestätigung | free | WORKING | `Event`, `EventApplication` | Bewerbung nur mit `eventsApply`; Plätze/Warteliste als Felder vorhanden |
| `/app/create/post` | Beitrag erstellen (Activity Feed) | member | WORKING | schreibt `Post` | Ratelimit 20/h; Free/Trial sieht Sperrhinweis (`postCreate`) |
| `/app/people/[handle]` | Profil eines Mitglieds | trial+ | WORKING | `Profile`, `User`, `Follow`, `Connection`, `Post`, `PerformanceRecord`, `TrustReview` | Trial sieht eingeschränkte Ansicht (`profileFull=false`); Blockierung wirkt |
| `/app/people/demo/[key]` | **Vollständige Demo-Profilansicht (Sprint 7)** | trial+ | WORKING | **keine DB** – reines `DEMO_PROFILES`-Datum aus `src/lib/demo` | eindeutig als DEMO-PROFIL gekennzeichnet; Connect erklärt, dass keine echte Anfrage entsteht (`DemoConnectDialog`); bei unbekanntem Key/`DEMO_CONTENT_ENABLED=false` → 404 |

## 4. K – Administration

| URL | Zweck | Zugriff | Status | Daten | Berechtigungen |
| --- | ----- | ------- | ------ | ----- | -------------- |
| `/admin` | Kennzahlen-Übersicht | admin | WORKING | `User`, `Membership`, `Trial`, `BusinessOpportunity`, `MembershipApplication`, `InvestmentOpportunity`, `Report`, `AdminAuditLog` | `requireAdmin()` in Layout + Seite |
| `/admin/users` | Nutzersuche, Sperre, Founding Member | admin | WORKING | `User`, Aktionen schreiben `AdminAuditLog` | `setUserSuspendedAction`, `setFoundingMemberAction` |
| `/admin/investments` | Investment-Prüfung (Freigabe/Ablehnung) | admin | WORKING | `InvestmentOpportunity` | `reviewInvestmentAction` |
| `/admin/applications` | Mitgliedsanträge + Löschanträge | admin | WORKING | `MembershipApplication`, `AccountDeletionRequest` | `reviewMembershipApplicationAction`, `processDeletionRequestAction` |
| (keine Route) | Moderations-Queue | admin | PREPARED | `Report` existiert | keine UI/Aktion (K-11) |

## 5. API-Routen

| URL | Methode | Zweck | Zugriff | Status | Hinweise |
| --- | ------- | ----- | ------- | ------ | -------- |
| `/api/auth/logout` | POST/GET | Session widerrufen + Redirect `/` | free+ | WORKING | für reine HTML-Formulare ohne Client-JS |
| `/api/billing/checkout` | POST | Start des Checkout (Stripe) oder Dev-Aktivierung | free+ (angemeldet) | BLOCKED (Stripe) / WORKING (Dev) | Ratelimit 10/10 min; `GET` leitet auf `/app/billing` |
| `/api/webhooks/stripe` | POST | einzig erlaubter Produktiv-Pfad für Mitgliedschaftsänderungen | öffentlich, **signaturgeprüft** | BLOCKED (kein Stripe) | Idempotenz über `MembershipEvent.providerEventId`; ohne Secret 400 |
| `/api/auth/oauth/google` | – | – | – | **NOT IMPLEMENTED** | Route existiert **nicht**; Login-/Register-Buttons sind seit Sprint 5 echte `disabled`-Elemente ohne Link (K-04 behoben) |
| `/api/auth/oauth/apple` | – | – | – | **NOT IMPLEMENTED** | wie oben |

## 6. Server Actions

Alle Actions liegen in `src/app/actions/` und sind `"use server"`.

| Datei | Actions | Zweck | Status |
| ----- | ------- | ----- | ------ |
| `auth.ts` | `registerAction`, `loginAction`, `verifyCodeAction`, `resendCodeAction`, `requestPasswordResetAction`, `resetPasswordAction`, `logoutAction`, `completeOnboardingAction` | Konten, Verifizierung, Recovery, Onboarding + Trial-Start | WORKING (Versand: BLOCKED) |
| `auth-state.ts` | `initialAuthState` | Zustandstyp für `useActionState` (darf nicht in einer `"use server"`-Datei liegen) | WORKING |
| `network.ts` | `followAction`, `sendConnectionRequestAction` (**Pflichtnachricht ≥ 10 Zeichen**), `respondConnectionRequestAction`, `withdrawConnectionRequestAction`, `disconnectAction`, `blockMemberAction` | Netzwerk-Flows | WORKING |
| `messages.ts` | `sendMessageAction`, `startConversationAction`, `markConversationReadAction`, `deleteMessageAction`, `listMessageableContacts` | Nachrichten (nur verbundene Konten) | WORKING |
| `notifications.ts` | `markNotificationReadAction`, `markAllNotificationsReadAction`, `deleteNotificationAction` | Mitteilungen | WORKING |
| `posts.ts` | `createPostAction`, `deletePostAction`, `countOwnPosts` | Activity Feed | WORKING |
| `profile.ts` | `updateProfileAction` (inkl. „Ich biete"), `updatePrivacyAction` (inkl. Kennzahlen-Sichtbarkeit), `updateNotificationPreferencesAction`, `updateInterestsAction`, `interestTaxonomy`, `skipInterestsAction`, `markOnboardingComplete`, `requestAccountDeletionAction` | Profil/Einstellungen | WORKING |
| `business.ts` | `createOpportunityAction`, `updateOpportunityStatusAction`, `applyToOpportunityAction`, `withdrawApplicationAction`, `respondApplicationAction`, `createListingAction`, `enrollInCourseAction`, `completeLessonAction`, `submitInvestmentAction`, `expressInvestmentInterestAction`, `applyToEventAction`, `cancelEventApplicationAction`, `publishedJobOpportunities` | Business, Marketplace, Kurse, Investments, Events | WORKING (Bezahlpfade NOT IMPLEMENTED) |
| `membership.ts` | `submitMembershipApplicationAction` | Mitgliedsantrag | WORKING |
| `admin.ts` | `reviewInvestmentAction`, `setFoundingMemberAction`, `setUserSuspendedAction`, `clearDevOutboxAction`, `reviewMembershipApplicationAction`, `processDeletionRequestAction` | Admin-Aktionen (jeweils Rolle + Audit) | WORKING |
| `state.ts` | `fail`, `done`, `text`, `bool`, Typen | gemeinsame Action-Helfer | WORKING |

## 7. Rate-Limits pro Route/Action

| Schlüssel | Limit | Datei |
| --------- | ----- | ----- |
| `register:<ip>` | 8 / Stunde | `actions/auth.ts` |
| `login:<ip>` | 12 / 15 min | `actions/auth.ts` |
| `verify:<userId>` | 12 / 15 min | `actions/auth.ts` |
| `forgot:<ip>` | 6 / Stunde | `actions/auth.ts` |
| `otp:hourly:<user>:<channel>:<purpose>` | 6 / Stunde | `lib/auth/otp.ts` |
| `otp:cooldown:<user>:<channel>:<purpose>` | 1 / 60 s | `lib/auth/otp.ts` |
| `checkout:<userId>` | 10 / 10 min | `api/billing/checkout` |
| `follow:<userId>` | 60 / Stunde | `actions/network.ts` |
| `connect:<userId>` | 30 / Stunde | `actions/network.ts` |
| `message:<userId>` | 60 / 10 min | `actions/messages.ts` |
| `post:<userId>` | 20 / Stunde | `actions/posts.ts` |
| `profile:<userId>` | 40 / Stunde | `actions/profile.ts` |
| `opportunity:<userId>` | 10 / Stunde | `actions/business.ts` |
| `apply:<userId>` | 20 / Stunde | `actions/business.ts` |
| `listing:<userId>` | 10 / Stunde | `actions/business.ts` |
| `investment:<userId>` | 5 / Tag | `actions/business.ts` |
| `event_apply:<userId>` | 20 / Stunde | `actions/business.ts` |

## 8. Route-Matrix (Sprint 6 – verbindlich, kein Löschen)

Für jede wichtige Route dokumentiert: Route, Public/Auth Required, Zweck, echte Daten oder Demo möglich, wichtigste CTA, aktueller Status, relevante Permission, offene Probleme.

| Route | Public/Auth | Zweck | echte Daten / Demo | wichtigste CTA | Status | Permission | offene Probleme |
|-------|-------------|-------|--------------------|----------------|--------|------------|-----------------|
| `/` | Public | Startseite, Conversion, Hero mit Preisen, 3 Outcomes, 6 Kernbereiche, Membership, Events, CTA | echte Daten (PlatformMetric) + statisch, Demo-Badge nur für illustrative Inhalte | „INNER CIRCLE entdecken", „48h kostenlos" | WORKING (statisch) | visitor | Keine |
| `/network` (public) | Public | Preview Netzwerk | statisch, kein DB, Demo-Bild | „Join Inner Circle" | WORKING (statisch) | visitor | Keine |
| `/business-deals` | Public | Preview Business Deals | statisch, ComingSoon für Deal-Räume | „Chancen entdecken" | WORKING (statisch) | visitor | Keine |
| `/investments` (public) | Public | Preview Investments | statisch, Hinweis Discovery keine Ausführung | „Investments erklären" | WORKING (statisch) | visitor | Keine |
| `/marketplace` (public) | Public | Preview Marketplace & Academy | statisch | „Marketplace ansehen" | WORKING (statisch) | visitor | Keine |
| `/events` (public) | Public | Preview Events | statisch, ehrlicher Leerzustand | „Events ansehen" | WORKING (statisch) | visitor | Keine |
| `/membership` | Public | Preise, Leistungen, Trust, Rechtliches | statisch, Preise 24,99/249,90 konsistent | „Zugang starten" | WORKING (statisch) | visitor | Stripe nicht scharf (K-03 offen bleibt nur Stripe-Produkt) |
| `/portfolio` | Public | IC Portfolio Zielmodell 20%→25%/75%=5%/15% | statisch, 100€ Beispiel, kein Fonds, keine Rendite | „Mitglied werden" | WORKING (statisch) | visitor | Keine |
| `/member/[publicId]` | Public | Öffentliche Karten-Verifikation | echt (MembershipCard + User/Profile) | – | WORKING (force-dynamic) | visitor | Keine |
| `/login` | Public | Anmeldung | echt | „Anmelden" | WORKING | visitor | – |
| `/register` | Public | Registrierung E-Mail/Passwort | echt, Telefon-Umschalter NOT IMPLEMENTED | „Konto erstellen" | WORKING | visitor | K-05 Telefon-Registrierung |
| `/verify` | Auth (registered-unverified) | Code-Eingabe, ehrlicher Zustellstatus | echt, mode provider/dev/none | „Code bestätigen", „Code erneut senden" / „Erneut versuchen" | WORKING (Sprint 6 gefixt: keine widersprüchlichen Meldungen) | registered-unverified | K-01 Spam-Ordner wegen resend.dev, Custom Domain pausiert |
| `/forgot-password` | Public | Reset anfordern | echt (AuthToken) | „Link senden" | PARTIAL (Versand hängt an Provider) | visitor | K-01 |
| `/reset-password` | Public (Token) | Neues Passwort setzen, Regeln sichtbar | echt | „Passwort setzen" | WORKING | token | Keine |
| `/checkout/success` | Public | Rückleitung Stripe/Dev | echt (liest Membership) | – | WORKING | free+ | Erteilt nichts, nur DB/Webhook |
| `/checkout/cancel` | Public | Abbruch Zahlung | keine DB | – | WORKING | visitor | Keine |
| `/dev/outbox` | Auth admin + ENABLE_DEV_OUTBOX | Dev-Postausgang | echt (DevOutbox) | – | WORKING | admin + flag | Muss vor Launch entfernt werden |
| `/onboarding/interests` | Auth free verifiziert | Interessen/Ziele + Trial-Start | echt (Profile, UserInterest, UserGoal, Trial) | „Discovery starten" | WORKING | free verifiziert | Keine |
| `/app` | Auth free | Member Start, Für-dich, 6 Kernbereiche 2×3, Trial-Banner | echt (Connections, Posts, Opportunities, Events, Notifications) + Demo nur wenn leer | 6 Karten „Mehr erfahren" | WORKING | free | Keine, aber glaubwürdige Texte prüfen (Sprint 6) |
| `/app/network` | Auth trial+ | Verzeichnis, Suche/Rolle/Standort/Interessen, Follow/Connect | echt zuerst + Demo-Ergänzung < 8 echt (DEMO-PROFIL-Badge, Sprint 7) | „Kontakt anfragen", Follow, „Zurückziehen"/„Annehmen"/„Ablehnen" je Anfragezustand | WORKING | trial+ (free locked) | K-06 Privacy teilweise; Demo erzeugt keine DB-Daten |
| `/app/discover` | Auth trial+ | Business-Karten, Ranking, Filter | echt, Demo nur wenn leer | „Connect" mit Pflichtnachricht | WORKING | trial+ entitlements.networkDiscover | Keine |
| `/app/inbox` | Auth free (messaging member) | Nachrichten, Anfragen, Benachrichtigungen | echt, Demo-Preview optional | „Nachricht senden", „Annehmen/Ablehnen" | WORKING | free (messaging member) | Keine Fake-Unread |
| `/app/connections` | Auth free | Anfragen eingehend/ausgehend, Verbindungen | echt | Annehmen/Ablehnen/Zurückziehen/Trennen | WORKING | free | Umleitung nach /app/inbox?tab=requests existiert |
| `/app/messages` | Auth member | 1:1 Nachrichten | echt (nur verbundene) | Senden | WORKING | member messaging | Umleitung nach inbox |
| `/app/notifications` | Auth free | Umleitung → inbox notifications | – | – | WORKING | free | Umleitung |
| `/app/profile` | Auth free | Profil Hauptbereich, Header, Stats, Actions, Vollständigkeit, Tabs Beiträge/Übersicht/Performance/Angebote | echt + Demo-Beiträge unten (3-6 hochwertige, Demo-Badge) | „Profil bearbeiten", „Profil teilen", „Einstellungen" | WORKING | free | Avatar Upload NOT IMPLEMENTED |
| `/app/profile/edit` | Auth free | Profil bearbeiten inkl. Interessen/Ziele | echt | „Speichern" | WORKING | free | Keine |
| `/app/settings` | Auth free | Darstellung Hell/Dunkel/System, Sprache, Datenschutz, Kennzahlen-Sichtbarkeit, Benachrichtigungen, Blockierte, Löschantrag | echt | – | WORKING | free | – |
| `/app/card` | Auth member | Mitgliedskarte + QR | echt | – | WORKING | member memberCard | Free/Trial locked |
| `/app/billing` | Auth free | Mitgliedschaft, Planwahl, Abrechnung, Paywall | echt (Membership, Invoice) | „Mitglied werden", Checkout | WORKING | free | Stripe BLOCKED, Dev-Aktivierung nur lokal |
| `/app/membership-application` | Auth member | Antrag Voll-Mitgliedschaft | echt | „Antrag stellen" | WORKING | member | – |
| `/app/trust` | Auth trial+ | Trust & Performance Detail | echt, leer ohne Bewertungen | – | PARTIAL | trial+ | K-08 keine Erfassung |
| `/app/opportunities` | Auth trial+ | Business-Chancen Liste Filter | echt + Demo wenn leer (Demo-Detail-Dialog funktional) | „Details", „Deal ansehen" → Detail oder Demo-Dialog | WORKING (Sprint 6: jeder CTA funktional) | trial+ opportunitiesBrowse | Keine |
| `/app/opportunities/new` | Auth member | Chance anlegen | echt | „Veröffentlichen" | WORKING | member opportunitiesManage | – |
| `/app/opportunities/[id]` | Auth trial+ view, member apply | Detail + Bewerbung, Owner Antworten | echt | „Bewerben", „Annehmen/Ablehnen" | WORKING | trial+ browse, member apply/manage | – |
| `/app/jobs` | Auth trial+ | Jobs & Projekte gefiltert | echt + Demo wenn leer | „Bewerben" | WORKING | trial+ | – |
| `/app/marketplace` | Auth free/trial/member | Listings Produkte Services Kurse | echt + Demo wenn leer | „Details" → Detail oder Demo-Dialog | WORKING (Sprint 6 CTA funktional) | free list, member sell | K-07a keine Bezahlung, K-07b Freigabe nicht erzwungen |
| `/app/marketplace/new` | Auth member | Listing anlegen | echt | „Veröffentlichen" | WORKING | member marketplaceSell | K-07b |
| `/app/marketplace/[id]` | Auth free/trial/member | Listing Detail | echt | „Kontakt", „Einschreiben" (ohne Zahlung) | WORKING | free/trial/member | K-07a |
| `/app/learn` | Auth free/member | Academy Kursbibliothek | echt + Demo wenn leer | „Weiterlernen", „Preview" | WORKING | free preview, member full | – |
| `/app/learn/[id]` | Auth free/member | Kursseite Module Lektionen Fortschritt | echt | „Lektion abschließen" | WORKING | free/member courseFullAccess | – |
| `/app/investments` | Auth trial+ | Investment Chancen approved + IC Portfolio mit Allocation-Bar | echt + Portfolio Zielmodell 20%/25%/75% Visualisierung | „Details", „Interesse bekunden" | WORKING | trial+ investmentsBrowse | Keine erfundenen Renditen |
| `/app/investments/submit` | Auth member | Chance einreichen | echt | „Einreichen" | WORKING | member investmentsSubmit | Ratelimit 5/Tag |
| `/app/investments/[id]` | Auth trial+ | Detail + Absichtserklärung | echt | „Interesse ausdrücken" | WORKING | trial+ | Nicht freigegebene nur Einreicher/Admin |
| `/app/events` | Auth free | Events Memberbereich mit Bildern | echt + Demo-Beispiel-Events (klar markiert) | „Event ansehen" → Detail | WORKING (Sprint 6: Bild, Titel, Badge, Stadt, Datum, Satz, CTA) | free eventsBrowse | Keine Erstellung durch Member (bewusst) |
| `/app/events/[slug]` | Auth free | Event Detail + Bewerbung/Abbestätigung | echt | „Bewerben", „Abbestätigen" | WORKING | free eventsBrowse/Apply | Tickets/Check-in NOT IMPLEMENTED |
| `/app/create/post` | Auth member | Beitrag erstellen | echt | „Veröffentlichen" | WORKING | member postCreate | – |
| `/app/people/[handle]` | Auth trial+ | Profil eines Mitglieds | echt | „Vernetzen", „Follow" | WORKING | trial+ | Privacy K-06 teilweise |
| `/app/people/demo/[key]` | Auth trial+ | Vollständige Demo-Profilansicht (Sprint 7) | **kein DB-Zugriff** (reines `DEMO_PROFILES`-Datum) | „Kontakt anfragen" (erklärt: keine echte Anfrage) | WORKING | trial+ | eindeutig DEMO-PROFIL; Connect erzeugt nichts |
| `/admin` | Auth admin | Kennzahlen Übersicht | echt | – | WORKING | admin | – |
| `/admin/users` | Auth admin | Nutzersuche Sperre Founding Member | echt | – | WORKING | admin | – |
| `/admin/investments` | Auth admin | Investment Prüfung | echt | Freigabe/Ablehnung | WORKING | admin | – |
| `/admin/applications` | Auth admin | Mitglieds-/Löschanträge | echt | – | WORKING | admin | – |
| `/api/auth/logout` | Auth free+ | Session Widerruf | echt | – | WORKING | free+ | – |
| `/api/billing/checkout` | Auth free+ | Checkout Stripe oder Dev | echt | – | BLOCKED Stripe / WORKING Dev | free+ | Ratelimit 10/10min |
| `/api/webhooks/stripe` | Public signaturgeprüft | Membership Änderungen nur via Webhook | echt | – | BLOCKED (kein Secret) | public signiert | – |

**Hinweis doppelte Routen:** `/app/messages`, `/app/connections`, `/app/notifications` leiten nach `/app/inbox?tab=…` um – Verhalten 100% erhalten, keine Löschung. `/app/opportunities` und `/app/jobs` teilen Datenmodell `BusinessOpportunity` (Filter `job`/`freelance`), aber unterschiedliche Zweck – dokumentiert, nicht konsolidiert.
