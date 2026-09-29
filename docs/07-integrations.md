# 07 – Externe Dienste & Integrationen

**Stand:** 2026-09-29 (Sprint 17: Stripe-Sandbox-Checkout, Webhooks, Portal und UX-Aufräumarbeiten) · Basis ist das aktuelle `main`; übernommen und aktualisiert aus
`07-external-services.md`. **Niemals Zugangsdaten im Chat oder im Repository** –
der Gründer legt Konten selbst an; der Agent liefert Anleitungen und bindet nur
Variablennamen ein. Die vollständige Variablenliste steht in
[`14-environment.md`](14-environment.md).

## 1. Übersicht

| Dienst | Zweck | Status | Production ready? | Variablen (nur Namen) |
| ------ | ----- | ------ | ----------------- | --------------------- |
| **Cloudflare Workers** | Hosting der Next.js-App über OpenNext | eingerichtet, Build verifiziert (`npm run cf:build` grün); **Workers Paid erforderlich** – lokal gemessen 43–68 ms CPU pro Seite, ~0,6 s pro Login (Free-Limit 10 ms, K-24) | ✅ sobald Secrets gesetzt sind und der Paid-Plan bestätigt ist | `NODE_VERSION` (Build-Variable) |
| **Cloudflare D1** | Produktionsdatenbank, Binding `DB`, DB-Name `inner-circle-db` | Migrationen `0000`–`0002` vorhanden (52 Tabellen, Sprint 12: `BetaInvite`, `BetaAccess`, `Conversation.directKey`), Anwendung im Deploy-Befehl | ✅ vorbereitet | keine (Binding in `wrangler.jsonc`) |
| **GitHub** | Repository, Versionierung, PRs, Workers-Builds-Auslöser | aktiv (`gackvictor7-alt/Inner-Circle`) | ✅ | keine |
| **OpenNext-Adapter** (`@opennextjs/cloudflare`) | Brücke Next.js → Worker | aktiv (Build erzeugt `.open-next/worker.js`) | ✅ | keine |
| **Resend** (E-Mail) | Verifizierungscodes, Passwort-Reset, Benachrichtigungen | Code aktiv, Key vorhanden; HTML+Text Multipart-Templates; Absenderdomain `innercirclevp.com` verifiziert; Verifizierungs-Mail ohne Code im Betreff, optionaler Eigen-Absender `EMAIL_FROM_VERIFICATION` (Inbox-Feinschliff 2026-09-27) | ⚠️ Versand läuft über die verifizierte Domain; Website-Domain weiterhin offen | `RESEND_API_KEY` (Secret), `EMAIL_FROM` (Text), `EMAIL_REPLY_TO` (Text), `EMAIL_FROM_VERIFICATION` (Text, optional) |
| **Twilio** (SMS) | Telefon-Verifizierung | Code fertig, keine Zugangsdaten | ❌ optional | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_TEST_MODE` |
| **Stripe** (Abos) | Monats-/Jahresmitgliedschaft, Rechnungen, Billing-Portal | WORKING für die Sandbox: serverseitige Price-ID-Auflösung, Customer-Zuordnung, Hosted Checkout, raw-body/signaturgeprüfte idempotente Webhooks, Lifecycle-Reconciliation und Portalroute/UI; **keine Live-Konfiguration** | ❌ Live nicht aktiv / Sandbox-Konfiguration erforderlich | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY` |
| **Google OAuth** | Social Login | **nicht implementiert** (nur UI-Hinweis „Einrichtung erforderlich") | ❌ | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Variablen bereits ausgewertet, aber ohne Route) |
| **Apple OAuth** | Social Login | **nicht implementiert** | ❌ | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` |
| **Cloudflare R2** (Binding `MEDIA`, Bucket `inner-circle-media`) | Profilfoto-Upload (Avatare) | WORKING für Profilfotos (Sprint 13, Wrangler-Provisioning legt den Bucket beim Deploy an; lokal emuliert); weitere Media-Typen (Cover, Kursvideos, Dokumente) folgen | optional: `R2_PUBLIC_BASE_URL` für Auslieferung über Bucket-Domain statt App-Route |
| **Domain + DNS** | Produktions-URL, E-Mail-Absenderdomain (SPF/DKIM/DMARC) | offen | ❌ | – |
| **Rechtsberatung** | AGB, Datenschutz, Provisionsordnung, Investment-Struktur | offen | ❌ | – |

**Keine Secrets im Repository:** `.env.example` und `.dev.vars.example`
enthalten ausschließlich leere Platzhalter. Produktionswerte liegen als
Worker-Secrets bzw. Dashboard-Variablen.

## 2. Verhalten ohne Konfiguration (bewusst ehrlich)

| Fehlt | Systemverhalten |
| ----- | --------------- |
| `RESEND_API_KEY` | Nachrichten-Transport meldet `none`; `/verify` zeigt „Versand noch nicht eingerichtet"; erzeugte Codes werden sofort entwertet. Alternativ (nur Testbetrieb): `ENABLE_DEV_OUTBOX=true` + Admin-Konto → Code im `/dev/outbox` |
| `TWILIO_*` | Telefon-Kanal steht nicht zur Verfügung (gleiche Logik wie E-Mail) |
| `STRIPE_SECRET_KEY` oder Price-ID | `/app/billing` zeigt „Einrichtung erforderlich"; Checkout-Route antwortet mit `error=stripeNotConfigured` bzw. `stripe_price_not_configured` (außer Dev-Aktivierung ist erlaubt) |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Route lehnt jeden Aufruf mit 400 ab; die Signatur wird vor jeder Verarbeitung geprüft |
| `AUTH_SECRET` | Entwicklung fällt auf einen festen Dev-Wert zurück (`authSecretIsFallback`); `integrationStatus()` weist darauf hin – **in Produktion unzulässig** |
| Storage | Sprint 13: Profilfoto-Upload läuft über das R2 `MEDIA`-Binding (JPG/PNG/WebP, max. 5 MB, Magic-Byte-Prüfung); Nachrichten-Anhänge/Cover/Kursvideos bleiben ohne Upload (nur URL-Feld) |

Alle Zustände sind über `integrationStatus()` (`src/lib/env.ts`) abfragbar und
werden in `/app/settings` (Admin-Sicht) bzw. `/dev/outbox` angezeigt.

## 3. Was der Gründer selbst einrichten muss

### 3.1 Produktions-Zustellbarkeit (Eigene Domain & DNS) — **erledigt für den Versand (Sprint 15)**

**Stand:** Die Domain **`innercirclevp.com` ist bei Resend verifiziert**
(DKIM/SPF/DMARC-Records liegen im Resend-Konto) und
`EMAIL_FROM="INNER CIRCLE <noreply@innercirclevp.com>"` ist gesetzt – der
Versand läuft über die eigene Domain, nicht mehr über `onboarding@resend.dev`.
**Website-Domain:** Die kanonische öffentliche URL ist `https://innercirclevp.com`.
Diese Änderung setzt keine DNS-, Cloudflare- oder Resend-Konfiguration voraus;
`NEXT_PUBLIC_SITE_URL` bleibt die zentrale Runtime-/Build-Einstellung. Die
bestehende Domain-/`www`-Strategie und eventuelle DNS-Arbeiten bleiben außerhalb
dieses Sprints dokumentiert in [`DOMAIN-CUTOVER-CHECKLIST.md`](DOMAIN-CUTOVER-CHECKLIST.md)
und `09-deployment.md` §7a.

**Inbox-Deliverability der Verifizierungs-Mail (2026-09-27):** Resends
Deliverability Insights monieren `no-reply`-Absender. Der Code hält dafür eine
eigene, optionale Variable bereit: `EMAIL_FROM_VERIFICATION` (Empfehlung:
`INNER CIRCLE <verify@innercirclevp.com>`); ist sie nicht gesetzt, greift
`EMAIL_FROM` – bestehende Deployments brechen also nicht. Betreff der
Verifizierungs-Mail ist bewusst **ohne** den sechsstelligen Code
(DE „Dein Bestätigungscode für INNER CIRCLE“ / EN „Your INNER CIRCLE
verification code“); der Code steht nur in HTML+Text-Body (groß, mit
Ablaufzeit und Ignore-Hinweis, ohne Links/Bilder/Marketing-Footer). Für die
Mail werden **keine** Open-/Click-Tracking-Header gesendet – Resend steuert
Tracking pro Domain im Dashboard; bleibt dort aus, werden auch
Verifizierungs-Mails nicht getrackt (kein API-seitiger Regressionsspielraum).
Wiederholte Resends begrenzen clientseitiger Countdown (60 s, Button
deaktiviert) **und** serverseitige Limits (`otp:cooldown` 1/60 s,
`otp:hourly` 6/h pro Nutzer + Zweck).

### 3.2 Für Bezahlung (Stripe-Testmodus)

1. Im Stripe-Dashboard den **Testmodus** verwenden und ein Produkt „INNER
   CIRCLE Membership“ mit den beiden bestehenden Preisen anlegen bzw. die
   vorhandenen Test-Price-IDs verwenden: exakt 24,99 €/Monat und 249,99 €/Jahr.
2. Nur die bestehenden Variablen setzen: `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY` und `STRIPE_PRICE_YEARLY`.
   Werte niemals in dieses Repository, in Tickets oder in Chat schreiben.
   `STRIPE_SECRET_KEY` muss ein `sk_test_`-Schlüssel sein; Live-Schlüssel
   werden vom Code abgewiesen.
3. Webhook-Endpoint `https://innercirclevp.com/api/webhooks/stripe` mit den
   sechs verbindlichen Ereignissen registrieren und das Signing Secret als
   `STRIPE_WEBHOOK_SECRET` hinterlegen:
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_failed`.
   Für verzögerte Zahlarten zusätzlich `checkout.session.async_payment_succeeded`
   und `checkout.session.async_payment_failed` abonnieren.
4. Testkauf, Abbruch, unbezahlte/verzögerte Zahlung, erfolgreiche Zahlung,
   fehlgeschlagene Folgezahlung, Portalaufruf und Kündigung im **Testmodus**
   prüfen. Die Membership darf erst nach dem signaturgeprüften Webhook aktiv
   sein; der Success-Link informiert ausschließlich. Ein echter Testmodus-
   Durchlauf gegen einen Worker ist in dieser Session noch offen.
5. Das Customer Portal ist fertig verdrahtet: `/app/billing` zeigt es nur für
   eine Stripe-Zuordnung, `/api/billing/portal` akzeptiert keine Customer-ID
   aus dem Browser und verwendet die zentrale `NEXT_PUBLIC_SITE_URL` als
   Rückweg. Admin-/Dev-Mitgliedschaften bleiben bewusst außerhalb des Portals.

### 3.3 Optional / später

11. Twilio-Konto (SMS) – nur nötig, wenn Telefon-Verifizierung gewünscht ist.
12. Storage-Bucket (R2/S3) – nötig für echte Uploads (u. a. Profilfotos für
    Beta-Tester, K-10).
12. Google-/Apple-OAuth-Apps – **erst nachdem** die jeweilige Route
    implementiert wurde (heute nicht vorhanden).
13. Domain-/DNS-Arbeiten bleiben außerhalb dieses Sprints; die kanonische App-URL ist `https://innercirclevp.com` und wird über `NEXT_PUBLIC_SITE_URL` zentral gesetzt.

## 4. Was der Agent nicht kann

- Keine Konten im Namen des Gründers erstellen (Identitätsprüfung nötig).
- Keine Zahlungen auslösen, keine Tarife buchen, keine Keys erzeugen.
- Keine Rechtsberatung ersetzen – nur Fragen und Checklisten vorbereiten.
- Keine Secrets im Repository ablegen oder im Chat anfordern.
