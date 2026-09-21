# 09 – Deployment & Betrieb (Cloudflare Workers + D1)

**Stand:** 2026-09-21 · geprüft gegen `package.json`, `wrangler.jsonc`,
`open-next.config.ts` und `next.config.ts` auf `main` @ `f22c19e`.

**Ziel-Plattform: Cloudflare Workers** (OpenNext-Adapter) mit **Cloudflare D1**
als Produktionsdatenbank. Vercel/Postgres (ADR-007) ist ersetzt (ADR-008).

---

## 1. Verifizierte Angaben (Repository-Abgleich)

| Angabe | Wert im Repository | Status |
| ------ | ------------------ | ------ |
| Build command | `npm run cf:build` → `next build` + `opennextjs-cloudflare build` | ✅ |
| Deploy command | `npm run cf:release` → `opennextjs-cloudflare deploy` + `wrangler d1 migrations apply DB --remote` + `tsx scripts/d1-bootstrap.ts --remote` | ✅ |
| Version command (Preview-Branches) | `npx opennextjs-cloudflare upload` (Skript `cf:upload`; alternativ `npx wrangler versions upload`) | ✅ |
| Production branch | `main` | ✅ |
| Datenbank | D1 `inner-circle-db`, Binding `DB`, `migrations_dir: drizzle` | ✅ |
| Worker-Name | `inner-circle` | ✅ |
| Compatibility | `compatibility_date: 2026-09-01`, Flags `nodejs_compat` + `global_fetch_strictly_public` | ✅ |
| Observability | aktiviert (`wrangler.jsonc → observability.enabled`) | ✅ |
| Dashboard-Variablen | bleiben dank `keep_vars: true` erhalten | ✅ |
| Build-Variable | `NODE_VERSION` = `22` (Dashboard, Node ≥ 20 erforderlich) | ⚠️ im Dashboard zu setzen |
| Lokale Prüfung | `npm run cf:build` in dieser Session grün (Worker-Bundle `./.open-next/worker.js`) | ✅ |

## 2. Umgebungen

| Umgebung | Start | Laufzeit | Datenbank | URL |
| -------- | ----- | -------- | --------- | --- |
| Lokal (Node) | `npm run dev` (bindet 0.0.0.0) | Node.js ≥ 20 | libSQL `file:./dev.db` | `http://localhost:3000` |
| Lokal (Worker) | `npm run cf:preview` | `workerd` | lokale D1-Emulation (`.wrangler/state`) | `http://localhost:8787` |
| Tests | `npm test` | Node | Wegwerf-`.test.db` | – |
| Preview | Nicht-`main`-Branches (Workers Builds) | Cloudflare Workers | D1 `inner-circle-db` | Preview-URL der Version |
| Produktion | `main` | Cloudflare Workers | D1 `inner-circle-db` | `https://inner-circle.<account>.workers.dev` → später eigene Domain |

## 3. npm-Skripte (aus `package.json`)

| Skript | Was passiert |
| ------ | ------------ |
| `cf:build` | `opennextjs-cloudflare build` (führt intern `next build` aus) |
| `cf:preview` | Build + App lokal in `workerd`, Secrets aus `.dev.vars` |
| `cf:dry-run` | Build + `wrangler deploy --dry-run` (kein Upload) |
| `cf:release` | **Deploy-Befehl:** Deploy + D1-Migrationen + Taxonomie-Bootstrap (idempotent, **ohne** Build) |
| `cf:deploy` | Build + `cf:release` von einer Maschine mit `wrangler login` |
| `cf:upload` | Build + Version hochladen ohne Aktivierung |
| `cf:typegen` | `cloudflare-env.d.ts` erzeugen (gitignored) |
| `cf:d1:create` | D1 `inner-circle-db` manuell anlegen (optional – der erste Deploy provisioniert) |
| `cf:d1:migrate:local` / `:remote` | Migrationen aus `drizzle/` anwenden |
| `cf:d1:bootstrap:local` / `:remote` | Interessen/Ziele/Badges einspielen (idempotent) |
| `cf:admin -- --email=… --remote` | Konto zum Admin machen |
| `dev:outbox -- [--local\|--remote]` | Dev-Postausgang lesen |

## 4. Erstinbetriebnahme (Dashboard-Weg, ohne lokale Installation)

1. **Worker mit GitHub verbinden:** *Workers & Pages* → *Create* →
   *Import a repository* → `Inner-Circle` (existiert der Worker `inner-circle`
   bereits: Worker öffnen → *Settings* → *Build*).
2. **Build-Einstellungen:** Build command `npm run cf:build`,
   Deploy command `npm run cf:release`, Non-production deploy command
   `npx opennextjs-cloudflare upload`, Root directory `/`,
   Production branch `main`, Build-Variable `NODE_VERSION` = `22`.
3. **Variablen/Secrets** (Settings → *Variables and Secrets*):
   - `AUTH_SECRET` – Secret, Pflicht, ≥ 32 Zufallszeichen.
   - `NEXT_PUBLIC_SITE_URL` – Text, z. B.
     `https://inner-circle.<account>.workers.dev`.
   - Optional Secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `RESEND_API_KEY`, `TWILIO_*`, `GOOGLE_*`, `APPLE_*`.
   - Optional Text: `EMAIL_FROM`, `STRIPE_PUBLISHABLE_KEY`.
   - **Nicht setzen:** `ALLOW_DEV_MEMBERSHIP_ACTIVATION`.
     `ENABLE_DEV_OUTBOX` nur bewusst für den Testbetrieb ohne Mailanbieter.
   Vollständige Liste inkl. Pflicht/Optional: [`14-environment.md`](14-environment.md).
4. **Deploy auslösen:** *Retry build* oder Push nach `main`. `cf:release`
   veröffentlicht den Worker, legt/verbindet die D1-Datenbank (Wrangler
   Provisioning über `database_name`), wendet Migrationen an und spielt die
   Taxonomie ein.
5. **E-Mail-Versand aktivieren** (Pflicht für echte Verifizierung): Resend-Konto,
   Domain verifizieren, `RESEND_API_KEY` (Secret) + `EMAIL_FROM` (Text) setzen.
   Ohne Provider sagt `/verify` offen „Versand noch nicht eingerichtet".
6. **Ersten Admin anlegen:** im Live-System registrieren und verifizieren, dann
   entweder D1-Konsole (`UPDATE User SET role = 'admin' WHERE email = '…';`)
   oder `npm run cf:admin -- --email=… --remote`.
   Notlösung ohne Mailanbieter: `emailVerifiedAt = strftime('%s','now') * 1000`
   setzen – besser aber den Dev-Postausgang nutzen (Abschnitt 5).
7. **Stripe-Webhook:** Endpoint `https://<worker-url>/api/webhooks/stripe`,
   Signing-Secret als `STRIPE_WEBHOOK_SECRET`.

## 5. Testbetrieb ohne E-Mail-Anbieter (geschützter Dev-Postausgang)

Regeln, alle serverseitig erzwungen:

- `/dev/outbox` existiert in Produktions-Builds **nur** mit
  `ENABLE_DEV_OUTBOX=true`, sonst 404 – und zeichnet auch nichts auf.
- **Immer** Rolle `admin` erforderlich; der Code wird nie an einen Browser
  zurückgegeben.
- `DEV_OUTBOX_RECIPIENTS` (kommagetrennt, `@domain` erlaubt) beschränkt die
  Aufzeichnung auf eigene Testadressen; fremde Registrierungen erhalten
  ehrlich „Versand noch nicht eingerichtet".
- Kann keine Nachricht zugestellt werden, wird der Code sofort entwertet.

Ablauf: Variable setzen → *Deploy* → Testkonto zum Admin machen → `/verify` →
„Code erneut senden" → Code über `/dev/outbox`, D1-Konsole
(`SELECT "to","body","createdAt" FROM DevOutbox ORDER BY createdAt DESC LIMIT 5;`)
oder `npm run dev:outbox -- --remote` lesen.
**Zurückbauen vor dem Launch:** `RESEND_API_KEY` setzen,
`ENABLE_DEV_OUTBOX` entfernen, Postausgang leeren.

## 6. Laufender Betrieb

- **Deploy:** Merge/Push nach `main` → Workers Builds baut (`cf:build`) und
  veröffentlicht (`cf:release`). Alternativ lokal `npm run cf:deploy`.
- **Migrationen:** Schema ändern → `npm run db:generate` → Migration committen.
  Der nächste Deploy wendet sie automatisch an (`d1_migrations` verhindert
  Doppelausführung). Nicht abwärtskompatible Änderungen vorher manuell mit
  `npm run cf:d1:migrate:remote` prüfen. Migrationen sind additiv.
- **Logs:** Dashboard → Worker → *Observability* / *Logs*; lokal
  `npx wrangler tail`.
- **Rollback:** Dashboard → Worker → *Deployments* → frühere Version
  aktivieren; oder `main` revertieren und neu deployen. Datenbank-Rollback nur
  über Export/Import (`npx wrangler d1 export DB --remote --output=backup.sql`)
  – D1 Time Travel im Dashboard für kurzfristige Wiederherstellung.
- **Lokale Prüfung vor jedem Merge:** `npm run typecheck`, `npm test`,
  `npm run cf:dry-run` (optional `npm run cf:preview`).

## 7. Häufige Fehler und Gegenmaßnahmen

| Symptom | Ursache | Lösung |
| ------- | ------- | ------ |
| „Could not detect a directory containing static files" | Projekt ohne Worker-Konfiguration/Build-Befehl angebunden | `wrangler.jsonc` + `main: .open-next/worker.js` + Build-Befehl `npm run cf:build` (heute vorhanden) |
| Deploy erfolgreich, aber Dashboard-Variablen verschwunden | fehlendes `keep_vars` | `keep_vars: true` ist gesetzt – nicht entfernen |
| `Error 1102 – Worker exceeded CPU time limit` auf öffentlichen Seiten (z. B. `/`) | pro Request `getAccessContext()` (Session-Lookup + User-Kontext + Lazy-Trial-UPDATE) und/oder D1-Reads auf der Homepage | öffentliche Seiten statisch ausliefern (erledigt): `/`, `/network`, `/business-deals`, `/investments`, `/marketplace`, `/events`, `/membership`, `/register` sind `○` prerendered; Homepage-Statistiken aus gebündeltem Snapshot `src/app/(site)/home-metrics.ts` (D1-Werte dorthin spiegeln, kein Request-Read mehr). „Zur App\"-CTA der öffentlichen Reader über nicht-httpOnly-Präsenz-Cookie `ic_presence` (in Lockstep mit `ic_session`) |
| `/verify` zeigt „Versand noch nicht eingerichtet" | kein `RESEND_API_KEY`, Dev-Postausgang aus | Resend-Key setzen oder Testbetrieb (Abschnitt 5) |
| Verifizierungscode erscheint nirgends | Postausgang aus und Allowlist greift | `ENABLE_DEV_OUTBOX=true` + eigene Adresse in `DEV_OUTBOX_RECIPIENTS` |
| Auth-Actions schlagen im Produktions-Build fehl („A 'use server' file can only export async functions") | Nicht-Async-Export aus einer `"use server"`-Datei | Zustandstypen in eigene Datei auslagern (erledigt: `actions/auth-state.ts`) |
| „D1 binding DB is missing" | falscher/fehlender Binding-Name oder Deploy ohne Provisioning | `wrangler.jsonc → d1_databases[0].binding` muss `DB` heißen; Deploy über `cf:release` |
| Nebenwirkungen auf Karten/Mitgliedschaft nach Neustart des Trials | Trial-Status `converted` | erwartetes Verhalten, kein Fehler |
| `npm run dev` von außen nicht erreichbar | Bind-Adresse | Skripte binden bereits `0.0.0.0` |
| Build bricht mit DB-Zugriff ab | `.env` im Cloudflare-Build sichtbar | im Repo liegt keine `.env`; OpenNext würde Werte einbetten – keine `.env` committen |

## 8. Produktions-Checkliste

- [ ] `AUTH_SECRET` gesetzt (kein Dev-Fallback).
- [ ] `NEXT_PUBLIC_SITE_URL` auf die echte Domain gesetzt.
- [ ] `RESEND_API_KEY` + verifizierte Absenderdomain (SPF/DKIM/DMARC).
- [ ] `ENABLE_DEV_OUTBOX` entfernt, `DevOutbox` geleert.
- [ ] Stripe-Webhook registriert und signiert getestet; Live erst nach Freigabe.
- [ ] Domain + TLS am Worker.
- [ ] D1-Backup-Routine nachgewiesen.
- [ ] Observability + Alarme definiert.
- [ ] Rechtstexte ersetzt (Impressum, Datenschutz, AGB).
- [ ] Smoke-Test aller öffentlichen Routen + Auth-Flow in Produktion.
