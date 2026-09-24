# 07 – Externe Dienste & Integrationen

**Stand:** 2026-09-24 (Sprint 12: Stripe-Audit, D1 52 Tabellen) · Übernommen und aktualisiert aus
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
| **Resend** (E-Mail) | Verifizierungscodes, Passwort-Reset, Benachrichtigungen | Code aktiv, Key vorhanden; HTML+Text Multipart-Templates; offene Produktionsabhängigkeit: eigene Domain | ⚠️ Testversand aktiv, Domain verifizieren | `RESEND_API_KEY` (Secret), `EMAIL_FROM` (Text), `EMAIL_REPLY_TO` (Text) |
| **Twilio** (SMS) | Telefon-Verifizierung | Code fertig, keine Zugangsdaten | ❌ optional | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_TEST_MODE` |
| **Stripe** (Abos) | Monats-/Jahresmitgliedschaft, Rechnungen, Billing-Portal | Checkout + Webhook vollständig; **Sprint-12-Audit:** Signaturprüfung im Worker auf `constructEventAsync` umgestellt (die synchrone Prüfung scheitert im Worker), Aktivierung nur bei bestätigter Zahlung, SEPA über `async_payment_*`, `subscription.deleted`-500 behoben; Billing-Portal nur als Funktion (keine Route/UI); **keine Schlüssel** | ❌ nicht produktiv aktiv | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PORTAL_RETURN_URL`, `ALLOW_STRIPE_LIVE` |
| **Google OAuth** | Social Login | **nicht implementiert** (nur UI-Hinweis „Einrichtung erforderlich") | ❌ | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Variablen bereits ausgewertet, aber ohne Route) |
| **Apple OAuth** | Social Login | **nicht implementiert** | ❌ | `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` |
| **S3-kompatibler Storage** (z. B. Cloudflare R2) | Avatare, Cover, Kursvideos, Dokumente | **nicht angebunden** (`storage.configured` wird nur angezeigt) | ❌ | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL` |
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
| `STRIPE_SECRET_KEY` | `/app/billing` zeigt „Einrichtung erforderlich"; Checkout-Route antwortet mit `error=stripeNotConfigured` (außer Dev-Aktivierung ist erlaubt) |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Route lehnt jeden Aufruf mit 400 ab (`missing_signature`/`invalid_signature`) |
| `AUTH_SECRET` | Entwicklung fällt auf einen festen Dev-Wert zurück (`authSecretIsFallback`); `integrationStatus()` weist darauf hin – **in Produktion unzulässig** |
| Storage | Uploads sind nicht möglich; Profilbilder/Anhänge bestehen nur als URL-Feld |

Alle Zustände sind über `integrationStatus()` (`src/lib/env.ts`) abfragbar und
werden in `/app/settings` (Admin-Sicht) bzw. `/dev/outbox` angezeigt.

## 3. Was der Gründer selbst einrichten muss

### 3.1 Produktions-Zustellbarkeit (Eigene Domain & DNS)

Der E-Mail-Versand funktioniert mit `RESEND_API_KEY` und `onboarding@resend.dev`
bereits real. Um Spam-Zustellung bei echten Nutzern (Gmail, Outlook, Apple Mail)
zu verhindern, ist der Domain-Schritt im DNS zwingend erforderlich:

1. **Eigene Domain in Resend anlegen:** Im Resend Dashboard unter *Domains* die
   Produktionsdomain (z. B. `inner-circle.app`) hinzufügen.
2. **DNS-Einträge konfigurieren:**
   - **DKIM:** CNAME-Einträge laut Resend Dashboard (`resend._domainkey`).
   - **SPF:** TXT-Eintrag für Domain (`v=spf1 include:amazonses.com ~all` bzw. Resend-Vorgabe).
   - **DMARC:** TXT-Eintrag auf `_dmarc.<domain>` mit z. B. `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@<domain>`.
   - **MX (optional):** Falls E-Mail-Rückläufer/Inbound über denselben Host verarbeitet werden.
3. **Environment anpassen:**
   - Text-Variable `EMAIL_FROM` im Cloudflare Dashboard auf die verifizierte Domain
     setzen, z. B. `INNER CIRCLE <verify@unsere-domain.com>` oder `INNER CIRCLE <hello@unsere-domain.com>`.
   - Optional: `EMAIL_REPLY_TO` auf z. B. `support@unsere-domain.com` setzen.
   - Es ist **keine Code-Änderung** nötig.
4. **Dev-Postausgang deaktivieren:** `ENABLE_DEV_OUTBOX` in Produktion entfernen.

### 3.2 Für Bezahlung

6. Stripe-Konto (zuerst **Testmodus**), Produkt „INNER CIRCLE Membership"
   mit 24,99 €/Monat und 249,90 €/Jahr.
7. `STRIPE_SECRET_KEY` (Secret), `STRIPE_PUBLISHABLE_KEY` (Text).
8. Webhook-Endpoint `https://<worker-url>/api/webhooks/stripe` mit genau
   diesen Ereignissen → `STRIPE_WEBHOOK_SECRET` (Secret):
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`.
   Preise werden inline aus `src/lib/membership/plans.ts` übergeben – im
   Dashboard muss **kein** Preisobjekt angelegt werden; **keine** Probezeit
   konfigurieren (`trialing` würde aktivieren).
9. Testkauf im **Testmodus** durchführen und prüfen: (a) Mitgliedschaft
   entsteht **nur** über den Webhook, (b) abgebrochener Checkout und
   fehlgeschlagene Zahlung aktivieren nichts, (c) Kündigung/Löschung im
   Dashboard beendet die Mitgliedschaft. Live-Keys erst mit
   `ALLOW_STRIPE_LIVE=true`.
10. Offen im Code: Kundenportal-Route/UI (Funktion
    `createBillingPortalSession` existiert), Rechnungsansicht mit echten
    Provider-Daten.

### 3.3 Optional / später

11. Twilio-Konto (SMS) – nur nötig, wenn Telefon-Verifizierung gewünscht ist.
12. Storage-Bucket (R2/S3) – nötig für echte Uploads (u. a. Profilfotos für
    Beta-Tester, K-10).
12. Google-/Apple-OAuth-Apps – **erst nachdem** die jeweilige Route
    implementiert wurde (heute nicht vorhanden).
13. Domain + DNS auf den Worker zeigen lassen.

## 4. Was der Agent nicht kann

- Keine Konten im Namen des Gründers erstellen (Identitätsprüfung nötig).
- Keine Zahlungen auslösen, keine Tarife buchen, keine Keys erzeugen.
- Keine Rechtsberatung ersetzen – nur Fragen und Checklisten vorbereiten.
- Keine Secrets im Repository ablegen oder im Chat anfordern.
