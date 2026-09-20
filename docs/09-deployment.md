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
| `wrangler.jsonc` | Worker-Definition: Name, `nodejs_compat`, Assets-Verzeichnis, **D1-Binding `DB`** (per `database_name`, keine id nötig), Observability |
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
| `npm run cf:release` | **Deploy-Befehl für Workers Builds:** `opennextjs-cloudflare deploy` → D1-Migrationen → Taxonomie (kein Build; idempotent) |
| `npm run cf:deploy` | Build + `cf:release` von der eigenen Maschine (benötigt `wrangler login`) |
| `npm run cf:upload` | Build + neue Version hochladen ohne sie zu aktivieren (Preview-Branches) |
| `npm run cf:typegen` | `cloudflare-env.d.ts` mit typisierten Bindings erzeugen (lokal, gitignored) |
| `npm run cf:d1:create` | D1-Datenbank `inner-circle-db` manuell anlegen (optional – der erste Deploy legt sie sonst automatisch an) |
| `npm run cf:d1:migrate:local` / `:remote` | Migrationen aus `drizzle/` einspielen (remote läuft auch in `cf:release`) |
| `npm run cf:d1:bootstrap:local` / `:remote` | Basistaxonomie einspielen (remote läuft auch in `cf:release`) |
| `npm run cf:admin -- --email=… --remote` | Konto zum Admin machen (Alternative: D1-Konsole im Dashboard) |

## Erstinbetriebnahme (Reihenfolge)

Alles Folgende geht komplett im Cloudflare-Dashboard – ohne lokale
Installation. `wrangler login` wird nur gebraucht, wenn du die
`cf:*`-Skripte von deinem Rechner aus ausführen willst.

1. **Worker mit GitHub verbinden** (falls noch nicht geschehen):
   Dashboard → *Workers & Pages* → *Create* → *Import a repository* →
   GitHub → `Inner-Circle`. Ist der Worker `inner-circle` schon vorhanden:
   Worker öffnen → *Settings* → *Build*.
2. **Build-Einstellungen** (Worker → *Settings* → *Build* → *Build
   configuration* → *Edit*):
   - Build command: `npm run cf:build`
   - Deploy command: `npm run cf:release`
   - Non-production branch deploy command: `npx opennextjs-cloudflare upload`
   - Root directory: `/` (leer lassen) · Production branch: `main`
   - Build variables (*Variables and Secrets* im Build-Abschnitt):
     `NODE_VERSION` = `22`
   Der frühere Fehler *„Could not detect a directory containing static
   files“* stammte aus einem Setup ohne Worker-Konfiguration und
   Build-Befehl. Mit `wrangler.jsonc` + Build-Befehl tritt er nicht mehr auf.
3. **Laufzeit-Variablen und Secrets** (Worker → *Settings* → *Variables and
   Secrets* → *Add*):
   - `AUTH_SECRET` – Typ **Secret**, Pflicht, ≥ 32 zufällige Zeichen
     (`openssl rand -base64 48` oder ein Passwort-Generator). Ohne ihn
     läuft die App mit dem Entwicklungs-Fallback – niemals in Produktion.
   - `NEXT_PUBLIC_SITE_URL` – Typ Text, z. B.
     `https://inner-circle.<account>.workers.dev` (später die eigene Domain).
   - Optional (Typ Secret): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
     `RESEND_API_KEY`, `TWILIO_*`, `GOOGLE_*`/`APPLE_*`; Typ Text:
     `EMAIL_FROM`, `STRIPE_PUBLISHABLE_KEY`. Ohne Schlüssel bleibt die
     jeweilige Funktion ehrlich im Zustand „Einrichtung erforderlich“.
   - **Nicht** setzen: `ENABLE_DEV_OUTBOX`, `ALLOW_DEV_MEMBERSHIP_ACTIVATION`.
   *Deploy* klicken (Variablen werden mit dem nächsten Deploy aktiv).
4. **Deploy auslösen:** Worker → *Deployments* → *Retry build* beim letzten
   Build – oder ein Push nach `main`. Der Deploy-Befehl erledigt
   automatisch: Worker veröffentlichen → D1-Datenbank `inner-circle-db`
   anlegen bzw. per Name verbinden (Wrangler-Provisioning) →
   Migrationen aus `drizzle/` anwenden → Basistaxonomie einspielen.
   Es ist **kein weiterer Commit** und keine `database_id` nötig; die
   Datenbank erscheint unter *Storage & Databases* → *D1*.
5. **E-Mail-Versand aktivieren** (nötig für Verifizierungscodes – ohne
   Provider kann sich in Produktion niemand verifizieren; Codes werden dort
   bewusst nicht angezeigt): Resend-Konto (Free-Tier) → API-Key →
   Secret `RESEND_API_KEY` + Text-Variable `EMAIL_FROM`
   (z. B. `INNER CIRCLE <onboarding@resend.dev>` zum Testen an die eigene
   Adresse; für echte Mitglieder eigene Domain in Resend verifizieren).
6. **Ersten Admin anlegen:** im Live-System normal registrieren und den
   Code bestätigen, dann Rolle setzen – entweder
   - Dashboard → *Storage & Databases* → *D1* → `inner-circle-db` →
     *Console*: `UPDATE User SET role = 'admin' WHERE email = 'deine@mail';`
   - oder lokal: `npx wrangler login` und
     `npm run cf:admin -- --email=deine@mail --remote`.
   Notlösung ohne E-Mail-Provider (nur für das allererste Konto): in der
   D1-Konsole zusätzlich `emailVerifiedAt = strftime('%s','now') * 1000`
   setzen. Danach ab- und wieder anmelden.
7. **Stripe-Webhook** (sobald Stripe-Schlüssel gesetzt): Endpoint
   `https://<worker-url>/api/webhooks/stripe`, Signing-Secret als
   `STRIPE_WEBHOOK_SECRET` speichern.

## Laufender Betrieb

- **Deploy:** Push/Merge nach `main` → Workers Builds baut (`cf:build`)
  und veröffentlicht (`cf:release`). Alternativ lokal `npm run cf:deploy`.
- **Migrationen:** Schemaänderung in `src/db/schema.ts` →
  `npm run db:generate` (neue Datei in `drizzle/`) → committen. Der nächste
  Deploy wendet sie automatisch an (`d1_migrations`-Tabelle verhindert
  Doppelausführung). Bei nicht abwärtskompatiblen Änderungen vorher
  manuell `npm run cf:d1:migrate:remote` ausführen. Migrationen sind
  additiv; nie destruktiv ohne Backup
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
- `wrangler.jsonc` enthält keine Secrets und keine Konto-IDs – nur
  Bindings, Flags und den D1-Datenbanknamen.
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
