# 03 – Route Map, Server Actions & API-Routen

**Stand:** 2026-09-21 (Sprint 3) · Basis: Branch `arena/01a0c434-inner-circle`
(Basis `main` @ `0babcb3`).
Quelle: `src/app/**` plus Build-Ausgabe von `npm run cf:build`
(58 Einträge: 57 dynamische Routen + `/_not-found`).

**Zugriffsstufen:** `public` · `free` (registriert) · `trial` · `paid`
(Mitglied) · `admin` · `registered-unverified` (Konto ohne bestätigte
E-Mail/Telefon).
Details zur Rechteableitung: [`06-permissions.md`](06-permissions.md).

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
| `/app/network` | Mitgliederverzeichnis, Suche/Filter, Follow/Connect; `NetworkDemoSection` (klar markierte Beispielprofile) nur, wenn die echte Liste leer ist | trial+ | WORKING (free sieht Locked-State) | liest `User`/`Profile`/`Follow`/`ConnectionRequest`, `Interest` | `listDirectoryMembers()` respektiert `discoverable`; Sichtbarkeit je Privacy teilweise (K-06) |
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
