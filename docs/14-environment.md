# 14 – Umgebungsvariablen und Secrets (die eine Wahrheit)

**Stand:** 2026-09-24 (Sprint 12: `AUTH_SECRET` sichert auch die Beta-Schlüssel) · davor 2026-09-21 · Abgeglichen mit `.env.example`, `.dev.vars.example`,
`src/lib/env.ts`, `wrangler.jsonc`, `vitest.config.ts` und `tests/setup.ts`.
**Keine echten Secrets in diesem Dokument – nur Variablennamen.**

- **Lokal (Node):** `.env` (gitignored), Vorlage `.env.example`.
- **Lokal (Worker-Vorschau):** `.dev.vars` (gitignored), Vorlage `.dev.vars.example`.
- **Produktion:** Cloudflare Worker → *Settings* → *Variables and Secrets*
  (Secrets verschlüsselt, Text-Variablen im Klartext). `wrangler.jsonc` setzt
  `keep_vars: true`, damit Dashboard-Variablen Deploys überleben.
- **Tests:** `vitest.config.ts` + `tests/setup.ts` setzen Testwerte selbst
  (u. a. `AUTH_SECRET=test-secret-not-for-production`, `ENABLE_DEV_OUTBOX=true`,
  `ALLOW_DEV_MEMBERSHIP_ACTIVATION=true`, gelöschte `STRIPE_*`/`RESEND_*`).

## Legende

**Build** = beim Build ausgewertet (Next.js/Workers Builds) ·
**Runtime** = im Worker/Node zur Laufzeit gelesen ·
**Secret** = niemals im Klartext in Repo, Logs oder Chat.

---

## 1. Kern (Pflicht)

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Entwicklungswert erlaubt | Produktionsanforderung |
| -------- | ------------- | ------ | ------------ | ----- | ------------------------ | ---------------------- |
| `AUTH_SECRET` | Runtime | **ja** | **Pflicht** | Pepper/Signatur für Session-Token, OTP-Hashes und (seit Sprint 12) die HMAC-Hashes der Beta-Schlüssel | lokal Fallback erlaubt (`authSecretIsFallback`) | **zwingend** setzen, ≥ 32 Zufallszeichen (`openssl rand -base64 48`); Fallback ist in Produktion unzulässig. **Rotation** beendet alle Sessions und entwertet alle noch nicht eingelösten Beta-Schlüssel (laufende Beta-Zugänge bleiben) |
| `NEXT_PUBLIC_SITE_URL` | Build **und** Runtime | nein | **Pflicht** | öffentliche Origin: Links in E-Mails, Stripe-Rückleitungen, Logout-Redirect | `http://localhost:3000` | echte Worker-/Domain-URL |
| `NODE_VERSION` | Build (Dashboard) | nein | empfohlen | Node-Version im Cloudflare-Build | – | `22` (≥ 20 nötig) |
| `NEXTJS_ENV` | Runtime | nein | ja (Worker) | unterscheidet Produktions-/Entwicklungsverhalten in OpenNext | `production` (in `.dev.vars`) | `production` (in `wrangler.jsonc` gesetzt) |

## 2. Datenbank

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Entwicklung | Produktion |
| -------- | ------------- | ------ | ------------ | ----- | ----------- | ---------- |
| `DATABASE_URL` | Runtime | nein | nur Node-Pfad | libSQL-Verbindung für Dev/Tests/Skripte (`file:./dev.db`) | Default `file:./dev.db` | **nicht nötig** – der Worker nutzt das D1-Binding `DB` |
| `DATABASE_AUTH_TOKEN` | Runtime | **ja** | nur bei gehostetem libSQL/Turso | Auth für entfernte libSQL-DB | leer | nur falls libSQL extern genutzt wird |
| `DATABASE_DRIVER` | Runtime | nein | optional | erzwingt `d1` oder `libsql` (z. B. `DATABASE_DRIVER=d1 npm run dev`) | leer | leer lassen (Auto-Erkennung) |
| `DB_LOG` | Runtime | nein | optional | SQL-Logging (`"true"`) | erlaubt | nicht setzen |
| `TEST_DATABASE_URL` | Runtime (Tests) | nein | optional | Wegwerf-DB der Tests | `file:./.test.db` (in `vitest.config.ts`) | – |

D1-Binding (kein Secret, in `wrangler.jsonc`): Binding-Name **`DB`**,
`database_name` **`inner-circle-db`**, `migrations_dir` **`drizzle`**.

## 3. E-Mail (Resend) – **derzeit blockierend**

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Entwicklung | Produktion |
| -------- | ------------- | ------ | ------------ | ----- | ----------- | ---------- |
| `RESEND_API_KEY` | Runtime | **ja** | **Pflicht für Verifizierung** | echter Mailversand | leer → Dev-Postausgang | **zwingend**, sonst meldet `/verify` offen „Versand noch nicht eingerichtet" |
| `EMAIL_FROM` | Runtime | nein | empfohlen | Absender (`"Name <adresse@domain>"`); ohne Wert gilt der Resend-Testabsender `INNER CIRCLE <onboarding@resend.dev>` (stellt nur an die Konto-Adresse des Resend-Kontos zu) | `"INNER CIRCLE <noreply@example.com>"` | Absender der verifizierten Domain |
| `EMAIL_REPLY_TO` | Runtime | nein | optional | Antwortadresse für E-Mails (z. B. `support@meine-domain.com`) | leer | optional |

## 4. SMS (Twilio) – optional

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Entwicklung | Produktion |
| -------- | ------------- | ------ | ------------ | ----- | ----------- | ---------- |
| `TWILIO_ACCOUNT_SID` | Runtime | **ja** | optional | SMS-Kanal (Telefon-Verifizierung) | leer | nur wenn Telefon-Verifizierung gewünscht |
| `TWILIO_AUTH_TOKEN` | Runtime | **ja** | optional | s. o. | leer | s. o. |
| `TWILIO_FROM_NUMBER` | Runtime | **ja** | optional | Absendernummer (E.164) | leer | s. o. |
| `TWILIO_TEST_MODE` | Runtime | nein | optional | erlaubt Test-Credentials explizit (`"true"`) | optional | **nicht** `true` |

## 5. Zahlungen (Stripe)

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Entwicklung | Produktion |
| -------- | ------------- | ------ | ------------ | ----- | ----------- | ---------- |
| `STRIPE_SECRET_KEY` | Runtime | **ja** | für Bezahlung | Checkout, Portal, Webhook-Verifikation | Testschlüssel `sk_test_…` | Live erst nach Freigabe |
| `STRIPE_PUBLISHABLE_KEY` | Build/Runtime | nein (öffentlich) | optional | Client-seitige Stripe-Nutzung | `pk_test_…` | `pk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Runtime | **ja** | **Pflicht mit Stripe** | Signaturprüfung der Webhooks | `whsec_…` der Testendpoint-URL | `whsec_…` des Produktionsendpoints |
| `STRIPE_PORTAL_RETURN_URL` | Runtime | nein | optional | Rückkehr aus dem Billing-Portal | leer | echte App-URL |
| `ALLOW_STRIPE_LIVE` | Runtime | nein | optional | gibt Live-Keys explizit frei (`"true"`) | **nicht setzen** | erst nach vollständiger Prüfung |

**Sicherheitsregel im Code:** Ein `sk_live_…`-Schlüssel wird ohne
`ALLOW_STRIPE_LIVE=true` ignoriert (`getStripe()` → `null`).

## 6. Social Login (vorbereitet, Funktion fehlt)

| Variable | Build/Runtime | Secret | erforderlich | Zweck | Status |
| -------- | ------------- | ------ | ------------ | ----- | ------ |
| `GOOGLE_CLIENT_ID` | Runtime | nein | optional | Google OAuth | Variablen werden gelesen (`oauth.google.configured`), **Route existiert nicht** (K-04) |
| `GOOGLE_CLIENT_SECRET` | Runtime | **ja** | optional | Google OAuth | s. o. |
| `APPLE_CLIENT_ID` | Runtime | nein | optional | Apple OAuth | s. o. |
| `APPLE_TEAM_ID` | Runtime | nein | optional | Apple OAuth | s. o. |
| `APPLE_KEY_ID` | Runtime | nein | optional | Apple OAuth | s. o. |
| `APPLE_PRIVATE_KEY` | Runtime | **ja** | optional | Apple OAuth | s. o. |

## 7. Bildspeicher (R2, Sprint 13)

Der Foto-Upload nutzt das **R2-Binding `MEDIA`** (Bucket `inner-circle-media`).
Das Binding wird wie die D1-Datenbank in `wrangler.jsonc` deklariert –
Wranglers Ressourcen-Provisioning legt den Bucket beim ersten
`wrangler deploy` automatisch an (kein Secret nötig). Die Anwendung
funktioniert auch ohne Binding weiter: dann ist der Upload deaktiviert
(ehrliche Fehlermeldung) und das Foto-URL-Feld bleibt nutzbar.

| Variable | Build/Runtime | Secret | erforderlich | Zweck |
| -------- | ------------- | ------ | ------------ | ----- |
| `R2_PUBLIC_BASE_URL` | Runtime | nein | optional | Öffentliche Bucket-Domain (z. B. `https://media.example.com` oder r2.dev-URL). Ohne diesen Wert liefert die App die Bilder selbst über `/api/media/<key>` aus – Upload **und** Auslieferung funktionieren also auch ohne diese Variable. |

Die früheren S3-Felder (`S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`) sind für den Foto-Upload
obsolet; `storage.configured` (Einstellungen → Integrationen) zeigt sie
weiterhin als unverändert optional an.

## 8. Entwicklungs-Schalter (in Produktion restriktiv)

| Variable | Build/Runtime | Secret | Default | Zweck | Produktionsregel |
| -------- | ------------- | ------ | ------- | ----- | ---------------- |
| `ENABLE_DEV_OUTBOX` | Runtime | nein | aus (Produktion), lokal automatisch an, solange kein Provider existiert | zeichnet E-Mails/SMS in `DevOutbox` auf statt zu senden | nur bewusst für den Testbetrieb; **vor dem Launch entfernen** |
| `DEV_OUTBOX_RECIPIENTS` | Runtime | nein | leer (alle) | Empfänger-Allowlist, kommagetrennt, `@domain` erlaubt | dringend setzen, solange der Postausgang aktiv ist |
| `ALLOW_DEV_MEMBERSHIP_ACTIVATION` | Runtime | nein | `.env.example`: `false`; nur bewusst lokal auf `true` setzen; Produktion aus | erlaubt Dev-Mitgliedschaftsaktivierung ohne Stripe (`provider="dev"`) | **niemals** in Produktion setzen |
| `TRIAL_CONNECTION_LIMIT` | Runtime | nein | `3` | Zähler-Limit im `Trial`-Datensatz; seit Sprint 11 (Discovery-Demo) von keiner Action mehr verbraucht – Demo-Konten senden keine echten Anfragen | ohne Wirkung auf den Zugang; bleibt nur für das Datenmodell |
| `SEED_DEMO_PASSWORD` | Runtime (Skript) | **ja** | leer | Passwort der fiktiven Seed-Konten (`npm run db:seed`) | nur lokal; Seed läuft nie remote |

## 9. Zusammenfassung: Was für den Start zwingend ist

**Muss gesetzt sein (Produktion):**
`AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `NODE_VERSION` (Build).

**Empfohlen, technisch aber optional:** `EMAIL_FROM`. Fehlt sie, sendet der
Code über den Resend-Testabsender `INNER CIRCLE <onboarding@resend.dev>`
(`src/lib/env.ts`). Der Testabsender stellt **nur an die E-Mail-Adresse des
Resend-Kontos** zu – gut für den ersten Testversand, nicht für echte Empfänger
(dafür Domain verifizieren, dann `EMAIL_FROM` setzen).

**Muss zusätzlich für Bezahlung gesetzt sein:**
`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Darf in Produktion nicht gesetzt sein:**
`ALLOW_DEV_MEMBERSHIP_ACTIVATION`, `TWILIO_TEST_MODE=true`,
`ENABLE_DEV_OUTBOX` (nur bewusst im Testbetrieb).

## 10. Konsistenzregel

`.env.example` und `.dev.vars.example` müssen mit diesem Dokument
übereinstimmen. Beim Hinzufügen/Entfernen einer Variablen sind **immer** zu
aktualisieren: `src/lib/env.ts`, `.env.example`, `.dev.vars.example` (falls für
die Worker-Vorschau relevant), dieses Dokument und – bei neuen Integrations-
pfaden – `docs/07-integrations.md`. Secrets werden **nie** committet; das
Repository enthält ausschließlich leere Platzhalter.
