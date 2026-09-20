# Deployment-Strategie

**Ziel-Plattform: Cloudflare Workers** (OpenNext-Adapter) mit
**Cloudflare D1** als Produktionsdatenbank. Vercel war der ursprüngliche
Kandidat (ADR-007); die Umstellung ist in ADR-008 begründet.

## Umgebungen

| Umgebung | Branch / Start | Laufzeit | Datenbank | URL |
| -------- | -------------- | -------- | --------- | --- |
| Lokal (Dev) | `npm run dev` | Node.js | libSQL `file:./dev.db` | `http://localhost:3000` |
| Lokal (Workers-Vorschau) | `npm run cf:preview` | `workerd` (identisch zu Produktion) | lokale D1-Emulation (`.wrangler/state`) | `http://localhost:8787` |
| Preview | jeder Push auf einen Nicht-`main`-Branch (Workers Builds) | Cloudflare Workers | D1 (Binding `DB`) | Preview-URL der Version |
| Produktion | `main` | Cloudflare Workers | D1 `inner-circle-db` | `https://inner-circle.<account>.workers.dev` → eigene Domain (Schritt 20) |

## Bausteine im Repository

| Datei | Zweck |
| ----- | ----- |
| `wrangler.jsonc` | Worker-Definition: Name, `nodejs_compat`, Assets-Verzeichnis, **D1-Binding `DB`**, Observability |
| `open-next.config.ts` | OpenNext-Adapter (statischer Asset-Cache, kein R2/Queue nötig – alle Routen sind dynamisch) |
| `next.config.ts` | `serverExternalPackages` für libSQL; `initOpenNextCloudflareForDev()` nur in `next dev` |
| `src/db/client.ts` | Wählt zur Laufzeit den Treiber: **D1** in Workers, **libSQL** in Node.js (Dev, Tests, Skripte) |
| `drizzle/` | Versionierte SQL-Migrationen (Drizzle Kit) – werden mit `wrangler d1 migrations apply` eingespielt |
| `public/_headers` | Cache-Header für unveränderliche `_next/static`-Assets |
| `scripts/d1-bootstrap.ts` | Basistaxonomie (Interessen, Ziele, Badges) in D1 anlegen – idempotent |
| `scripts/admin-bootstrap.ts` | Registriertes Konto zum Admin machen (erster Admin in Produktion) |
| `.env.example` / `.dev.vars.example` | Alle Variablen als Platzhalter (Node bzw. Workers-Vorschau) |

## npm-Skripte

| Skript | Was passiert |
| ------ | ------------ |
| `npm run cf:build` | `next build` + OpenNext-Bundle → `.open-next/` |
| `npm run cf:preview` | Build + App lokal in `workerd` (Port 8787), Secrets aus `.dev.vars` |
| `npm run cf:dry-run` | Build + `wrangler deploy --dry-run` (Konfiguration/Bundle prüfen, kein Upload) |
| `npm run cf:deploy` | Build + Deployment nach Cloudflare (benötigt `wrangler login`) |
| `npm run cf:upload` | Build + neue Version hochladen ohne sie zu aktivieren |
| `npm run cf:typegen` | `cloudflare-env.d.ts` mit typisierten Bindings erzeugen (lokal, gitignored) |
| `npm run cf:d1:create` | D1-Datenbank `inner-circle-db` anlegen (einmalig) |
| `npm run cf:d1:migrate:local` / `:remote` | Migrationen aus `drizzle/` einspielen |
| `npm run cf:d1:bootstrap:local` / `:remote` | Basistaxonomie einspielen |
| `npm run cf:admin -- --email=… --remote` | Konto zum Admin machen |

## Erstinbetriebnahme (Reihenfolge)

1. **Cloudflare-Konto + Wrangler-Login (einmalig, lokal):**
   `npx wrangler login` öffnet den Browser und autorisiert die CLI.
2. **D1-Datenbank anlegen:** `npm run cf:d1:create`.
   Die Ausgabe enthält `database_id` – diesen Wert in `wrangler.jsonc`
   unter `d1_databases[0].database_id` eintragen (Platzhalter
   `REPLACE_WITH_D1_DATABASE_ID` ersetzen), committen und pushen.
   Die id ist kein Geheimnis.
3. **Schema einspielen:** `npm run cf:d1:migrate:remote`
   (bei jeder neuen Migration in `drizzle/` wiederholen).
4. **Basistaxonomie:** `npm run cf:d1:bootstrap:remote`
   (Interessen/Ziele/Badges; ohne sie ist das Onboarding leer).
5. **Secrets setzen** (Dashboard → Worker → *Settings* → *Variables and
   Secrets* → *Add* → Typ **Secret**, oder `npx wrangler secret put NAME`):
   - `AUTH_SECRET` – Pflicht, ≥ 32 zufällige Zeichen
     (`openssl rand -base64 48`). Ohne ihn läuft die App mit dem
     Entwicklungs-Fallback – niemals in Produktion.
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (Testmodus zuerst),
     `RESEND_API_KEY`, `TWILIO_*`, `GOOGLE_*`/`APPLE_*` – optional; ohne
     Schlüssel bleibt die jeweilige Funktion ehrlich im Zustand
     „Einrichtung erforderlich“.
   - Als **Text-Variable** (kein Secret): `NEXT_PUBLIC_SITE_URL`
     (z. B. `https://inner-circle.<account>.workers.dev`), optional
     `EMAIL_FROM`, `STRIPE_PUBLISHABLE_KEY`.
6. **Git-Integration / Workers Builds** (Dashboard → *Workers & Pages* →
   *Create* → *Import a repository* → GitHub → `Inner-Circle`):
   - Project/Worker name: `inner-circle` (muss zu `name` in `wrangler.jsonc` passen)
   - Production branch: `main`
   - **Build command:** `npm run cf:build`
   - **Deploy command:** `npx opennextjs-cloudflare deploy`
   - Root directory: `/` (leer lassen)
   - Build-Variablen: `NODE_VERSION=22`
   Der frühere Fehler *„Could not detect a directory containing static
   files“* stammt aus einem Pages-/Static-Setup ohne Build-Befehl. Mit
   Worker + `wrangler.jsonc` + Build-Befehl tritt er nicht mehr auf.
7. **Ersten Admin anlegen:** im Live-System normal registrieren und
   verifizieren, dann `npm run cf:admin -- --email=<deine@mail> --remote`;
   ab- und wieder anmelden.
8. **Stripe-Webhook** (sobald Stripe-Schlüssel gesetzt): Endpoint
   `https://<worker-url>/api/webhooks/stripe`, Signing-Secret als
   `STRIPE_WEBHOOK_SECRET` speichern.

## Laufender Betrieb

- **Deploy:** Push/Merge nach `main` → Workers Builds baut und deployt.
  Alternativ lokal `npm run cf:deploy`.
- **Migrationen:** Schemaänderung in `src/db/schema.ts` →
  `npm run db:generate` (neue Datei in `drizzle/`) → committen →
  `npm run cf:d1:migrate:remote` **vor** dem Deploy der zugehörigen
  Anwendungsänderung. Migrationen sind additiv; nie destruktiv ohne Backup
  (`npx wrangler d1 export DB --remote --output=backup.sql`).
- **Logs:** Dashboard → Worker → *Observability* / *Logs* (aktiviert in
  `wrangler.jsonc`), lokal `npx wrangler tail`.
- **Rollback:** Dashboard → Worker → *Deployments* → frühere Version
  aktivieren, oder `main` revertieren.
- **Lokale Prüfung vor dem Merge:** `npm run typecheck`, `npm test`,
  `npm run cf:dry-run`, optional `npm run cf:preview`.

## Konfiguration & Regeln

- Alle Geheimnisse ausschließlich als Worker-Secrets bzw. lokal in
  `.env`/`.dev.vars` (beide gitignored). `.env.example` und
  `.dev.vars.example` enthalten nur Platzhalter.
- `wrangler.jsonc` enthält keine Secrets – nur Bindings, Flags und die
  (öffentliche) D1-`database_id`.
- Der Cloudflare-Build darf keine `.env`-Datei sehen (OpenNext würde die
  Werte einbetten) – im Repo liegt keine.
- Bildoptimierung (`IMAGES`-Binding) ist bewusst aus; Bilder werden
  unverändert ausgeliefert (statische Dateien in `public/`).

## Produktions-Checkliste (Schritt 19/20)

- [ ] `AUTH_SECRET` gesetzt, Worker-Secrets vollständig (DB, Mail, Stripe-Live, Storage).
- [ ] Stripe-Webhooks auf Produktions-URL registriert + signiert getestet.
- [ ] Domain + TLS (Worker → *Settings* → *Domains & Routes*), www/non-www.
- [ ] E-Mail-Absenderdomain verifiziert (SPF/DKIM/DMARC).
- [ ] D1-Backups/Export-Routine nachgewiesen (Time Travel ist für D1 aktiv).
- [ ] Monitoring: Observability aktiv, Fehlerbudget/Alarme definiert.
- [ ] Rate-Limits + Security-Header aktiv.
- [ ] Rechtstexte (AGB, Datenschutz, Mitglieds-/Marktplatzbedingungen) geprüft live.
- [ ] Smoke-Tests in Produktion + Rollback-Plan (Deployments-Historie, DB-Export).
- [ ] Betriebs-Checkliste: Support-Weg, Moderations-Bereitschaft, Payout-Freigaben.
