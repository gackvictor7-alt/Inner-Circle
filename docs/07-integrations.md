# 07 – Externe Dienste & Integrationen

**Stand:** 2026-09-21 · Übernommen und aktualisiert aus
`07-external-services.md`. **Niemals Zugangsdaten im Chat oder im Repository** –
der Gründer legt Konten selbst an; der Agent liefert Anleitungen und bindet nur
Variablennamen ein. Die vollständige Variablenliste steht in
[`14-environment.md`](14-environment.md).

## 1. Übersicht

| Dienst | Zweck | Status | Production ready? | Variablen (nur Namen) |
| ------ | ----- | ------ | ----------------- | --------------------- |
| **Cloudflare Workers** | Hosting der Next.js-App über OpenNext | eingerichtet, Build verifiziert (`npm run cf:build` grün) | ✅ sobald Secrets gesetzt sind | `NODE_VERSION` (Build-Variable) |
| **Cloudflare D1** | Produktionsdatenbank, Binding `DB`, DB-Name `inner-circle-db` | Migrationen vorhanden (50 Tabellen), Anwendung im Deploy-Befehl | ✅ vorbereitet | keine (Binding in `wrangler.jsonc`) |
| **GitHub** | Repository, Versionierung, PRs, Workers-Builds-Auslöser | aktiv (`gackvictor7-alt/Inner-Circle`) | ✅ | keine |
| **OpenNext-Adapter** (`@opennextjs/cloudflare`) | Brücke Next.js → Worker | aktiv (Build erzeugt `.open-next/worker.js`) | ✅ | keine |
| **Resend** (E-Mail) | Verifizierungscodes, Passwort-Reset, Benachrichtigungen | Code fertig, **kein Konto/Key** | ❌ **blockiert den Kern-Flow** | `RESEND_API_KEY` (Secret), `EMAIL_FROM` (Text) |
| **Twilio** (SMS) | Telefon-Verifizierung | Code fertig, keine Zugangsdaten | ❌ optional | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_TEST_MODE` |
| **Stripe** (Abos) | Monats-/Jahresmitgliedschaft, Rechnungen, Billing-Portal | Integration vollständig inkl. Webhook-Prüfung, keine Schlüssel | ❌ nicht produktiv aktiv | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PORTAL_RETURN_URL`, `ALLOW_STRIPE_LIVE` |
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

### 3.1 Sofort (blockiert den Kern-Flow)

1. **Resend-Konto** anlegen (Free-Tier genügt zum Start).
2. Absenderdomain verifizieren (SPF/DKIM/DMARC) oder zum Testen
   `onboarding@resend.dev` nutzen.
3. API-Key erzeugen und im Worker als **Secret** `RESEND_API_KEY` setzen.
4. Text-Variable `EMAIL_FROM` setzen, z. B.
   `INNER CIRCLE <noreply@deine-domain.de>`.
5. Nach dem ersten erfolgreichen Versand: `ENABLE_DEV_OUTBOX` entfernen und
   `DELETE FROM DevOutbox;` bzw. „Postausgang leeren" ausführen.

### 3.2 Für Bezahlung

6. Stripe-Konto (zuerst **Testmodus**), Produkt „INNER CIRCLE Membership"
   mit 24,99 €/Monat und 249,90 €/Jahr.
7. `STRIPE_SECRET_KEY` (Secret), `STRIPE_PUBLISHABLE_KEY` (Text).
8. Webhook-Endpoint `https://<worker-url>/api/webhooks/stripe` mit den
   Ereignissen `checkout.session.completed`, `customer.subscription.*`,
   `invoice.*` → `STRIPE_WEBHOOK_SECRET` (Secret).
9. Testkauf durchführen und prüfen, dass die Mitgliedschaft **nur** über den
   Webhook entsteht. Live-Keys erst mit `ALLOW_STRIPE_LIVE=true`.

### 3.3 Optional / später

10. Twilio-Konto (SMS) – nur nötig, wenn Telefon-Verifizierung gewünscht ist.
11. Storage-Bucket (R2/S3) – nötig für echte Uploads.
12. Google-/Apple-OAuth-Apps – **erst nachdem** die jeweilige Route
    implementiert wurde (heute nicht vorhanden).
13. Domain + DNS auf den Worker zeigen lassen.

## 4. Was der Agent nicht kann

- Keine Konten im Namen des Gründers erstellen (Identitätsprüfung nötig).
- Keine Zahlungen auslösen, keine Tarife buchen, keine Keys erzeugen.
- Keine Rechtsberatung ersetzen – nur Fragen und Checklisten vorbereiten.
- Keine Secrets im Repository ablegen oder im Chat anfordern.
