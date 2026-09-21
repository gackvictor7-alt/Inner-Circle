# 04 – Authentifizierung, Verifizierung, Trial & Membership

**Stand:** 2026-09-21 · Basis: `main` @ `f22c19e`.
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
Trial (48 h, genau einmal)    ← 3 Kontaktanfragen, Leserechte, eingeschränktes Profil
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
| Sessionänderung | neue Session (30 Tage) + httpOnly-Cookie `ic_session` |
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

### 2.4 Logout – `/api/auth/logout` bzw. `logoutAction`

Server-seitiger Widerruf: `Session.revokedAt` wird gesetzt, Cookie gelöscht,
Redirect `/`. Kein reiner Client-Logout. Audit `auth.logout`.

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
| Trial-Regeln | 48 h ab Start, genau **einmal** pro Konto, `connectionRequestLimit` (Default 3, `TRIAL_CONNECTION_LIMIT`), Fingerprint-Missbrauchsschutz |
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
- Kontaktanfragen während des Trials: `registerTrialConnectionRequest()`
  zählt hoch, `releaseTrialConnectionRequest()` gibt bei Rückzug wieder frei.
- Rechte während des Trials: siehe [`06-permissions.md`](06-permissions.md) –
  insbesondere **kein** Vollprofil (`profileFull=false`), **kein** Messaging,
  **kein** Posten, **kein** Verkaufen.

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

## 5. Fälle, die heute nicht funktionieren (bewusst dokumentiert)

| Fall | Zustand | Ursache |
| ---- | ------- | ------- |
| Registrierung/Verifizierung per Telefon | NOT IMPLEMENTED | Das Registrierungsformular sendet im Telefon-Modus kein `email`-Feld, die Action verlangt aber eine gültige E-Mail → Validierungsfehler. Zusätzlich wird der Code immer über den E-Mail-Kanal ausgestellt |
| SMS-Code empfangen | BLOCKED | Twilio-Zugangsdaten fehlen (`TWILIO_*`) |
| E-Mail-Code in Produktion empfangen | BLOCKED | `RESEND_API_KEY` fehlt; `/verify` sagt das offen |
| Google-/Apple-Login | NOT IMPLEMENTED | Route `/api/auth/oauth/*` existiert nicht (Button ist als „Einrichtung erforderlich" gekennzeichnet) |
| Bezahlung | BLOCKED | Stripe-Schlüssel fehlen; Dev-Aktivierung nur lokal |
| 2FA | PREPARED | `VerificationCode.purpose = login_2fa` bzw. Schema vorhanden, keine UI |

Details und Status: [`11-known-issues.md`](11-known-issues.md).
