# 04 – Authentifizierung, Verifizierung, Trial & Membership

**Stand:** 2026-09-21 (Sprint 5: Login-/Registrierungs-UX gehärtet,
Passwortregeln aus einer Quelle) · Basis: `main` @ `c211e20`.
Dieses Dokument beschreibt den **tatsächlich implementierten** Ablauf
(eigene Auth-Implementierung – **kein** Auth.js; siehe ADR-008/ADR-009 in
[`13-decisions.md`](13-decisions.md)).

---

## 1. Der komplette Lebenszyklus

```
Visitor
  │  /register  (E-Mail, Passwort ≥10 Zeichen mit Buchstabe + Ziffer, Alter + AGB)
  ▼
Registered, unverified        ← Session existiert bereits, Bereich /app ist gesperrt
  │  /verify   (6-stelliger Code; Versand: Resend ODER Dev-Postausgang ODER keiner)
  ▼
Verified (free)               ← E-Mail ODER Telefon bestätigt
  │  /onboarding/interests   (mind. 3 Interessen, optional Ziele/Profilfelder, „Discovery starten")
  ▼
Discovery-Demo (48 h, einmal) ← Rechte wie free + Demo-Inhalte; keine echten Mitglieder/Deals; echte Events lesbar
  │  Ablauf → free (Konto/Profil bleiben, Demo nicht neu startbar) ODER
  │  /app/billing             (Plan wählen → Stripe-Checkout ODER Dev-Aktivierung)
  ▼
Paid Member                   ← Aktivierung ausschließlich über Membership-Service / Webhook
  │  /app/membership-application
  ▼
Voll-Mitglied (nach manueller Freigabe durch die Administration)
```

## 2. Schritt-für-Schritt mit Datenbank- und Sessionänderungen

### 2.1 Registrierung – `/register` → `registerAction`

| Aspekt | Verhalten |
| ------ | --------- |
| Route | `POST` via Server Action auf `/register` |
| Voraussetzung | kein Login nötig; Rate-Limit 8/h pro IP (`register:<ip>`) |
| Validierung | Vorname/Nachname ≥ 2 Zeichen, E-Mail-Format, Alter-Häkchen, AGB-Häkchen, Passwort ≥ 10 Zeichen mit Buchstabe **und** Ziffer, Passwort-Wiederholung |
| DB-Schreibvorgänge | `User` (mit `handle`, `passwordHash`, `role="user"`, `status="active"`, `ageConfirmedAt`, `termsAcceptedAt`, `locale`), `Profile`, `PrivacySettings`, `NotificationPreferences`, `Session`, `VerificationCode` (Typ `verify_account`), `AdminAuditLog` (`auth.registered`) |
| Sessionänderung | neue Session (30 Tage) + httpOnly-Cookie `ic_session` (+ nicht-httpOnly-Präsenz-Flag `ic_presence` in Lockstep – nur für den öffentlichen „Zur App"-CTA, ohne Identität/Autorisierung) |
| Ergebnis | `{ status: "success", redirectTo: "/verify" }` mit ehrlichem Zustellstatus (`messageMode`, `messageKey`) |
| Fehlerzustände | `rateLimited`, `validation` (Feldfehler `firstName|lastName|email|age|terms|password`), `emailTaken`, `deliveryUnavailable` (kein Versandweg), `codeFailed` |
| Nächste Route | `/verify` |

### 2.2 Verifizierung – `/verify` → `verifyCodeAction`

| Aspekt | Verhalten |
| ------ | --------- |
| Voraussetzung | Session **oder** gültige `userId`-Übergabe; Code 6-stellig |
| Code-Erzeugung | `randomInt` (keine Modulo-Verzerrung), gepeppert gehasht (Hash enthält Datensatz-ID), TTL 15 min, max. 5 Versuche, alte offene Codes werden entwertet |
| Zustellung | `sendVerificationCodeEmail` → Provider Resend **wenn** `RESEND_API_KEY`; sonst Dev-Postausgang **wenn** erlaubt; sonst `ok:false, mode:"none"` → Code wird sofort entwertet |
| DB-Änderung | `User.emailVerifiedAt` und/oder `User.phoneVerifiedAt`, `VerificationCode.consumedAt`, `AdminAuditLog` (`auth.verified`), bei fehlender Session neue `Session` |
| Nächste Route | `/onboarding/interests` (bzw. `/app`, wenn Onboarding bereits abgeschlossen; Admin zusätzlich `?admin=1`) |
| Fehlerzustände | `unauthorized`, `validation.invalidCode`, `rateLimited`, `expired`, `too_many_attempts`, `already_used`, `not_configured` (kein Versandweg) |
| Sicherheitsregeln | Code wird **nie** im Produktions-HTML ausgegeben; `devCode` gibt es nur außerhalb Produktion; `/dev/outbox` erfordert Rolle `admin` **und** `ENABLE_DEV_OUTBOX=true` |

### 2.3 Login – `/login` → `loginAction`

| Aspekt | Verhalten |
| ------ | --------- |
| Voraussetzung | Rate-Limit 12/15 min pro IP |
| Prüfungen | E-Mail vorhanden, `verifyPassword` (scrypt + `timingSafeEqual`), `status !== suspended/deleted` |
| Fall: unverifiziert | Session wird angelegt, neuer Code ausgestellt, Weiterleitung `/verify` (Zustellmodus wie oben) |
| Fall: verifiziert | neue `Session`, `User.lastLoginAt`/`updatedAt`, Audit `auth.login`, Weiterleitung `landingPathFor()`: `/onboarding/interests` bei unvollständigem Onboarding, sonst `/app` (Admin `/app?admin=1`) |
| Fehlerzustände | `rateLimited`, `validation`, `invalidCredentials`, `accountSuspended` |

**Formular-UX (Sprint 5, 2026-09-21 – Login/Register/Reset):**

- Alle Auth-Formulare (`src/components/auth/AuthForms.tsx`) sind **hydrations-
  gated**: Der Absende-Button ist bis zum Abschluss der Hydration deaktiviert
  (`useSyncExternalStore`-Mount-Prüfung), ein `<noscript>`-Hinweis erklärt die
  JavaScript-Voraussetzung. Dadurch gibt es keinen nativen POST mehr vor der
  Hydration (früher: HTTP 500 „Failed to find Server Action") und **keinen
  Seiten-Reload bei Fehlern** – E-Mail und Passwort bleiben im Formular.
- `guardAction` fängt Netzwerk-/Serverausnahmen ab und meldet sie als
  `serverError` am Formular (keine irreführende Erfolgsmeldung, kein Crash).
- Doppel-Submit ist ausgeschlossen (`Button loading={pending}`).
- Passwortregeln kommen aus **einer** Quelle
  (`src/lib/auth/password-rules.ts`): ≥10 Zeichen, Buchstabe + Ziffer. Server
  (`passwordProblem`) und UI (`PasswordField` mit Live-Checkliste und
  Ein-/Ausblenden) können nicht auseinanderlaufen; Regeln werden auf
  `/register`, `/reset-password` und beim Passwortwechsel sichtbar angezeigt.
- Fehlercodes → Meldungen (DE/EN, Wörterbuch `app.auth.errors`):
  `invalidCredentials` = „E-Mail-Adresse oder Passwort nicht korrekt."
  (bewusst identisch für unbekanntes Konto und falsches Passwort),
  `validation` liefert Feldfehler (`required`, `invalidEmail`),
  `accountSuspended`, `rateLimited`, `passwordTooShort`, `passwordNeedsBoth`,
  `passwordMismatch`, `tokenInvalid`, `serverError`.
- Passwörter werden ausschließlich im Formularzustand gehalten und per
  Server-Action übertragen – nie in `localStorage`, Logs oder URLs.
- OAuth-/Telefon-Buttons sind echte deaktivierte Elemente ohne
  Navigationsziel (K-04 behoben, Aussehen unverändert).

### 2.4 Logout – `/api/auth/logout` bzw. `logoutAction`

Server-seitiger Widerruf: `Session.revokedAt` wird gesetzt, Cookie **und**
Präsenz-Flag gelöscht, Redirect `/`. Kein reiner Client-Logout. Audit
`auth.logout`.

### 2.5 Passwort vergessen – `/forgot-password` → `requestPasswordResetAction`

- Rate-Limit 6/h pro IP; Antwort **immer identisch** (keine Enumeration).
- Bei existierendem, nicht gesperrtem Konto: `AuthToken` Typ `password_reset`,
  Hash des 32-Byte-Tokens, Gültigkeit 60 min, Versand per E-Mail-Template.
- Audit `auth.reset_requested`.

### 2.6 Passwort zurücksetzen – `/reset-password?token=…` → `resetPasswordAction`

- Token wird gehasht verglichen, muss unbenutzt und unverfallen sein.
- Änderungen: `User.passwordHash`, `AuthToken.usedAt = now`,
  **alle Sessions widerrufen** (`revokeAllSessions`), Audit
  `auth.password_reset`, Weiterleitung `/login?reset=1`.
- Fehler: `passwordTooShort`, `passwordNeedsBoth`, `passwordMismatch`,
  `tokenInvalid`.

### 2.7 Onboarding + Trial-Start – `/onboarding/interests` → `completeOnboardingAction`

| Aspekt | Verhalten |
| ------ | --------- |
| Voraussetzung | angemeldet **und** verifiziert (`requireVerifiedUser`), Onboarding noch nicht abgeschlossen |
| Eingaben | mind. 3 Interessen (Taxonomie-ID **oder** Slug), optionale Ziele, Headline/Ort/Firma, `startTrial=1` |
| DB-Änderungen | `Profile.onboardingCompletedAt`, Felder, `UserInterest` (ersetzt), `UserGoal` (ersetzt), `Trial` (bei `startTrial` und ohne aktive Mitgliedschaft), `AdminAuditLog` (`onboarding.completed`, `trial.started`) |
| Trial-Regeln | 48 h ab Start, genau **einmal** pro Konto, Fingerprint-Missbrauchsschutz; seit Sprint 11 ist die Phase eine **Demo** (siehe §3) – `connectionRequestLimit` bleibt im Datensatz, wird aber von keiner Action mehr verbraucht |
| Weiterleitung | `/app` (bzw. `?trial=used`, `?trial=blocked`) |
| Fehlerzustände | `unauthorized`, `verificationRequired`, `validation.minInterests`, `abuseBlocked`/`trialUsed` (als Redirect mit Query) |

## 3. Trial – technische Regeln

- Erzeugt **ausschließlich** serverseitig durch `startTrial()`
  (`src/lib/trial/service.ts`); die UI kann keinen Trial „einschalten".
- Ablehnungsgründe: `already_used`, `already_active`, `membership_active`,
  `abuse_fingerprint` (gleicher `fingerprintHash` schon verwendet).
- Ablauf wird **lazy** beim Aufruf von `getAccessContext()` geprüft: ein
  abgelaufener Trial wird auf `expired` gesetzt (oder `converted`, wenn
  inzwischen eine Mitgliedschaft aktiv ist).
- **Discovery-Demo (Sprint 11):** Das Level `trial` ist eine Demo, kein
  eingeschränkter Echtzugang. `entitlementsFor("trial")` = `free` +
  `demoAccess: true`; alle Rechte auf echte Mitglieder- und Geschäftsdaten
  (`networkDirectory`, `networkDiscover`, `follow`, `connect`,
  `opportunitiesBrowse/Apply`, `investmentsBrowse`, `eventsApply`, `trustView`)
  sind `false`/`"no"`. Seiten rendern stattdessen die gekennzeichneten
  Demo-Inhalte (`src/lib/demo`, Gate `demoAccess && !<echtes Entitlement>`),
  Server Actions antworten mit `membershipRequired`. Die simulierte
  Kontaktanfrage (`DemoConnectDialog`) ist rein clientseitig.
- `registerTrialConnectionRequest()` / `releaseTrialConnectionRequest()`
  bleiben als Service erhalten (Tests), werden aber von keiner Action mehr
  aufgerufen – ein Trial sendet keine echten Anfragen.
- **Nach Ablauf:** Level `free`, `Trial.status = expired`; Konto, Profil,
  Interessen/Ziele, Inbox, Events (lesend), Marketplace-Liste und Billing
  bleiben; Discover/Network/Chancen/Jobs/Investments/Demo-Profile zeigen den
  Mitgliedschafts-Screen (`LockedArea` bzw. `/app/billing?paywall=trial`).
  `startTrial()` antwortet mit `already_used`; ein erneutes Onboarding legt
  keinen zweiten Datensatz an.
- **Migration bestehender Konten (kein Schema-Change, keine Datenmigration):**
  aktive Trials laufen bis zum ursprünglichen `expiresAt` weiter, ab dem Deploy
  mit Demo-Semantik; abgelaufene Trials bleiben abgelaufen und werden **nie**
  zurückgesetzt; Mitgliedschaften unberührt; Konten ohne `Trial`-Datensatz
  starten die Demo einmalig im Onboarding.
- **Sieben Kontozustände:** 1 anonym (`visitor`) · 2 registriert,
  unverifiziert (`/app` gesperrt, `/verify`) · 3 verifiziert, Discovery nicht
  gestartet (`free` ohne `Trial`, Onboarding) · 4 aktive Demo (`trial`) ·
  5 abgelaufene Demo ohne Mitgliedschaft (`free` + `expired`) · 6 aktive
  bestätigte Mitgliedschaft (`member`) · 7 Admin. Nachweis:
  `tests/integration/access-matrix.test.ts`,
  `tests/integration/discovery-demo.test.ts`.
- Rechte im Detail: siehe [`06-permissions.md`](06-permissions.md) §3/3b.

## 4. Membership – Zustände und Übergänge

| Zustand | Auslöser | Wirkung |
| ------- | -------- | ------- |
| `incomplete` | Default | keine Rechte |
| `active` | `activateMembership()` (Provider `stripe` **oder** `dev`) | Level `member`, Karte wird ausgestellt, Trial → `converted`, Notification |
| `past_due` | Webhook `invoice.payment_failed` | Level fällt auf `free`/`trial`, Notification |
| `canceled` | `markMembershipCanceled()` | je nach `cancelAtPeriodEnd`: Rechte bis Periodenende oder sofort |
| `expired` | `expireMembership()` | Karte wird `expired`, Level fällt zurück |
| Level-Berechnung | `getAccessContext()` | `admin` > aktive Membership (`active`/`trialing` und `currentPeriodEnd` in der Zukunft und kein `endedAt`) > aktiver Trial > `free` > `visitor` |

**Provider-Achse:** `stripe` (Produktivpfad) und `dev` (nur wenn Stripe nicht
konfiguriert **und** `NODE_ENV !== production`). Dev-Aktivierungen werden in
der UI als Entwicklungsmodus gekennzeichnet und über
`AdminAuditLog.membership.dev_activated` protokolliert.

**Nebeneffekte einer Aktivierung:** `MembershipEvent`, `MembershipCard`
(Format `IC-<Jahr>-<5-stellige Nummer>`, öffentliche `publicId`), `Notification`,
`AdminAuditLog`. Rechnungen entstehen nur aus Provider-Events (`Invoice`).

**Preise:** monatlich 24,99 € (2499 ct), jährlich 249,90 € (24990 ct)
(`src/lib/membership/plans.ts`; doppelt in `src/lib/env.ts` als
`membershipPricing` – Quelle der Wahrheit im Code ist `plans.ts`).

## 5. Profile & Social Links

- **LinkedIn entfernt & deprecated:** LinkedIn wurde vollständig aus der
  sichtbaren Profiloberfläche (`/app/profile`, `/app/profile/edit`,
  `/app/people/[handle]`) entfernt. INNER CIRCLE positioniert sich als eigenes
  Business-Netzwerk und bewirbt LinkedIn nicht prominent extern. Die
  Datenbankspalte `Profile.linkedinUrl` bleibt zur Wahrung der
  Migrationssicherheit intern erhalten, wird aber nicht mehr im UI angeboten.
- **Sekundäre Social Links:** Externe Links zu Instagram, X/Twitter und
  Websites werden als dezente, sekundäre Angaben dargestellt.
- **Fokus auf INNER CIRCLE Identität:** Prioritär dargestellt werden platformeigene
  Aktivitäten, Geschäftsstatistiken (Kontakte, Follower, Posts, Deals),
  Trust Score & Bewertungen, Rollen, Fähigkeiten, Ziele und Badges.

## 6. Fälle, die heute nicht funktionieren (bewusst dokumentiert)

| Fall | Zustand | Ursache |
| ---- | ------- | ------- |
| Registrierung/Verifizierung per Telefon | NOT IMPLEMENTED | Das Registrierungsformular sendet im Telefon-Modus kein `email`-Feld, die Action verlangt aber eine gültige E-Mail → Validierungsfehler. Zusätzlich wird der Code immer über den E-Mail-Kanal ausgestellt |
| SMS-Code empfangen | BLOCKED | Twilio-Zugangsdaten fehlen (`TWILIO_*`) |
| E-Mail-Posteingang ohne Spam-Ordner | PARTIAL | E-Mail-Versand über Resend funktioniert technisch, aber die Testdomain `resend.dev` wird von Spamfiltern oft abgestraft; produktiv ist eine verifizierte Domain nötig |
| Google-/Apple-Login | NOT IMPLEMENTED | Route `/api/auth/oauth/*` existiert nicht; Buttons sind seit Sprint 5 echte `disabled`-Elemente mit Badge „Einrichtung erforderlich" (K-04 behoben – kein toter Link, kein 404) |
| Bezahlung | BLOCKED | Stripe-Schlüssel fehlen; Dev-Aktivierung nur lokal und nur mit `ALLOW_DEV_MEMBERSHIP_ACTIVATION` ≠ `false` (Standard in `.env.example`: `false`). Ohne beides: `/api/billing/checkout` → `?error=stripeNotConfigured`, keine Mitgliedschaft; `/app/billing` zeigt den Zahlungsstatus ehrlich (`app.billing.paymentStatusNone/paymentStatusHonest`), Plan-Buttons deaktiviert |
| 2FA | PREPARED | `VerificationCode.purpose = login_2fa` bzw. Schema vorhanden, keine UI |

Details und Status: [`11-known-issues.md`](11-known-issues.md).
