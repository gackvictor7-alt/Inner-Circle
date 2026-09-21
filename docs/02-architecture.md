# 02 – Technische Architektur (Ist-Zustand)

**Stand:** 2026-09-21 · Branch `main`, Commit `f22c19e` · ersetzt die frühere
Fassung vom 2026-09-20 (die noch Auth.js, Prisma/Postgres und Vercel als
Zielbild beschrieb – siehe ADR-008 in [`13-decisions.md`](13-decisions.md)).

## 1. Technologie-Stack (tatsächlich im Einsatz)

| Schicht | Umgesetzt mit | Ort im Code |
| ------- | ------------- | ----------- |
| Web-App | Next.js 16.3.5 (App Router), React 19.2.8, TypeScript 5 (strict) | `src/app/**` |
| Styling | Tailwind CSS v4 + eigene Design-Tokens | `src/app/globals.css`, `src/components/ui/*` |
| Schrift | Inter, self-hosted über `next/font/local` (SIL OFL 1.1) | `src/app/fonts.ts`, `src/app/fonts/InterVariable.woff2` |
| i18n | Eigenes Wörterbuch-Modul, kein next-intl | `src/lib/i18n/**` |
| Theme | Eigener `ThemeProvider` (light/dark/system, FOUC-frei) | `src/components/ThemeProvider.tsx` |
| Datenbank | Drizzle ORM 0.45 auf SQLite: **D1** (`DB`-Binding) in Workers, **libSQL** in Node | `src/db/schema.ts`, `src/db/client.ts` |
| Migrationen | Drizzle Kit (`drizzle-kit generate` → SQL in `drizzle/`) | `drizzle/0000_init.sql` |
| Authentifizierung | **Eigene** Implementierung: scrypt-Passwort-Hashes, 6-stellige OTPs, Session-Token (SHA-256, httpOnly-Cookie) | `src/lib/auth/**` |
| Validierung/Env | `zod` (vorhanden), zentrale Env-Fassade | `src/lib/env.ts` |
| Zahlungen | Stripe SDK 18 (Checkout + signierte Webhooks) – inaktiv ohne Schlüssel | `src/lib/payments/stripe.ts`, `/api/billing/checkout`, `/api/webhooks/stripe` |
| QR-Codes | `qrcode` (Mitgliedskarte) | `src/components/app/MemberCard*` |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` 1.20 | `wrangler.jsonc`, `open-next.config.ts` |
| Tests | Vitest 3 (Unit + Integration gegen Wegwerf-SQLite) | `tests/**` |
| Tooling | ESLint 9 (`eslint-config-next`), `tsx` für Skripte, Wrangler 4 | `eslint.config.mjs`, `scripts/**` |

**Nicht im Einsatz (entgegen älteren Dokumenten):** Auth.js/NextAuth, Prisma,
PostgreSQL, Vercel, next-intl.

## 2. Verzeichnisstruktur

```
Inner-Circle/
├── AGENTS.md                  # Startanweisung für KI-Agenten
├── README.md                  # Einstieg für Menschen
├── docs/                      # verbindliche Dokumentation (dieses Verzeichnis)
│   └── archive/               # historisches Fortschrittsprotokoll (deprecated als Statusquelle)
├── public/                    # statische Assets: images/ (16 Bilder), _headers
├── drizzle/                   # SQL-Migrationen + Meta-Snapshots
├── scripts/                   # Seed, D1-Bootstrap, Admin-Bootstrap, Outbox, Audits
├── src/
│   ├── app/
│   │   ├── (site)/            # öffentliche Website + Auth-Seiten + Checkout-Rückleitungen
│   │   ├── (app)/             # Mitgliederbereich /app/*, Onboarding, Admin-Layout
│   │   ├── admin/             # Admin-Konsole /admin/*
│   │   ├── actions/           # Server Actions (auth, network, messages, business, …)
│   │   ├── api/               # API-Routen (Logout, Checkout, Stripe-Webhook)
│   │   ├── globals.css        # Design-Tokens + Utility-Klassen (.ic-*)
│   │   ├── layout.tsx         # Root-Layout (Theme, i18n, Font, Toaster)
│   │   └── fonts.ts
│   ├── components/
│   │   ├── ui/                # Designsystem-Primitiven (Button, Card, Dialog, …)
│   │   ├── site/              # Website-Bausteine (Header, Footer, Section, …)
│   │   ├── app/               # Mitgliederbereich-Komponenten
│   │   ├── auth/              # Auth-Formulare
│   │   ├── billing/           # Checkout-Status
│   │   └── dev/               # Dev-Postausgang
│   ├── db/                    # schema.ts, client.ts, queries.ts, ids.ts
│   ├── lib/
│   │   ├── access/            # Level + Entitlements + Server-Guards
│   │   ├── admin/             # Audit-Log
│   │   ├── auth/              # crypto, otp, session
│   │   ├── discover/          # Sprint 3: reines Matching/Ranking für /app/discover
│   │   ├── i18n/              # Wörterbücher DE/EN + Provider
│   │   ├── membership/        # Pläne + Membership-Service
│   │   ├── messages/          # Templates + Transport (Resend/Twilio/Outbox)
│   │   ├── notifications/     # Notification-Service
│   │   ├── payments/          # Stripe-Integration
│   │   ├── platform/          # Queries für den Mitgliederbereich + rules.ts (geteilte Konstanten, server- und client-sicher)
│   │   ├── trial/             # Trial-Service
│   │   ├── env.ts             # zentrale Env-/Integrations-Fassade
│   │   ├── rate-limit.ts      # DB-gestütztes Fixed-Window-Limit
│   │   └── utils.ts
│   └── domains/               # Platzhalter-Ordner je Produktbereich (README + .gitkeep)
├── tests/                     # Unit + Integration, Stubs, global-setup
├── wrangler.jsonc             # Worker: Name, Bindings, D1, Observability
├── open-next.config.ts        # OpenNext-Adapter (statischer Asset-Cache)
└── next.config.ts             # serverExternalPackages + Dev-Bindings
```

## 3. Laufzeit- und Schichtenmodell

```
Browser
  │  (React Server Components + Server Actions, httpOnly-Cookie ic_session)
  ▼
Next.js (App Router, `force-dynamic` nur wo nötig – öffentliche
  │        Marketing-Seiten sind statisch vorgeneriert)
  ├── Layouts/Guards          src/lib/access/server.ts  (requireUser/requireAccess/requireAdmin)
  ├── Server Actions          src/app/actions/*.ts      (validieren → autorisieren → schreiben)
  ├── API-Routen              src/app/api/*             (Logout, Checkout, Stripe-Webhook)
  └── Domänen-Services         src/lib/{trial,membership,messages,notifications,payments}
                                     │
                                     ▼
                        src/db/client.ts (lazy Proxy)
                        ├── Worker → D1-Binding "DB"
                        └── Node   → libSQL (DATABASE_URL)
```

**Verbindliche Regeln, die im Code gelten:**

1. **Server ist die Autorität.** Jede geschützte Route ruft einen Guard auf
   (`requireUser`, `requireVerifiedUser`, `requireAccess`, `requireAdmin`);
   jede Server Action prüft `getAccessContext()` erneut. Die UI versteckt
   lediglich Aktionen (`entitlements`), sie autorisiert nicht.
2. **Kein Datenbankzugriff beim Build.** `db` ist ein Lazy-Proxy; der Treiber
   wird pro Aufruf im Request-Kontext bestimmt. Deshalb läuft `next build` /
   `cf:build` ohne Datenbank.
3. **Keine stillen Erfolge.** Nachrichten melden `provider` / `dev` / `none`
   (ADR-009); Mitgliedschaften entstehen ausschließlich über den
   Membership-Service, im Produktivpfad nur aus signierten Webhooks.
4. **Zeit ist serverseitig.** Trial-Ablauf, OTP-Ablauf und Periodenenden werden
   ausschließlich auf dem Server berechnet.
5. **Zentrale Texte.** Alle sichtbaren Texte kommen aus `src/lib/i18n`
   (DE = Standard, EN = vollständig, geprüft durch `tests/unit/i18n-parity.test.ts`).

## 4. Datenzugriff

- **Schema:** `src/db/schema.ts` – 50 Tabellen, IDs als cuid-ähnliche Text-IDs
  (`src/db/ids.ts`), Zeitstempel als Integer-Millisekunden, Booleans 0/1,
  Enums als Textspalten, JSON-Felder als Text.
- **Queries:** `src/db/queries.ts` (Nutzerkontext, Karten, Kurse),
  `src/lib/platform/queries.ts` (Verzeichnis, Nachrichten, Notifications,
  Profile, Statistiken, Events, Trust).
- **Migrationen:** `drizzle/0000_init.sql` (50 Tabellen, 85 Indizes, 136
  Statements). Anwendung: `wrangler d1 migrations apply DB --remote` – fester
  Teil von `npm run cf:release`.
- **Details:** [`05-database.md`](05-database.md).

## 5. Authentifizierung (Kurzfassung)

- Registrierung legt `User`, `Profile`, `PrivacySettings`,
  `NotificationPreferences` an und erstellt eine Session.
- Passwörter: scrypt (N=16384, r=8, p=1), selbstbeschreibendes Format
  `scrypt$N$r$p$salt$key`.
- Sessions: 30 Tage, Token nur als SHA-256-Hash in der DB,
  httpOnly + sameSite=lax + secure in Produktion, Cookie `ic_session`.
- Verifizierung: 6-stelliger Code, gepeppert gehasht, 15 Minuten TTL,
  5 Versuche, 60-s-Resend-Cooldown, 6 Codes/Stunde/Account.
- Rate-Limits (DB-gestützt, Tabelle `RateLimit`): Registrierung 8/h pro IP,
  Login 12/15 min pro IP, Verify 12/15 min pro Nutzer, Forgot 6/h pro IP,
  Checkout 10/10 min, OTP 6/h + Cooldown 60 s.
- Details: [`04-auth-membership.md`](04-auth-membership.md),
  [`06-permissions.md`](06-permissions.md).

## 6. Internationalisierung und Theming

- Wörterbücher: `src/lib/i18n/dictionaries.ts` (Basis) +
  `dict/{app-core,app-social,app-business,site-v2}.ts`.
  **DE und EN müssen identisch strukturiert sein** (Test erzwingt Parität).
- Sprache und Theme werden im Browser persistiert; Default-Sprache ist Deutsch,
  Default-Theme folgt dem System.
- `scripts/check-keys.ts` und `scripts/i18n-audit.ts` prüfen referenzierte
  Schlüssel und Struktur.

## 7. Sicherheit (Ist-Zustand)

| Mechanismus | Umsetzung |
| ----------- | --------- |
| Autorisierung | serverseitige Guards + erneute Prüfung in jeder Action |
| Passwörter | scrypt mit Salt, keine Klartextspeicherung |
| Session-Token | zufällig (32 Byte), nur gehasht gespeichert, widerrufbar (`revokedAt`) |
| OTP | gepeppert gehasht, TTL, Versuchszähler, Invalidierung alter Codes |
| Enumeration | Passwort-Reset antwortet immer identisch |
| Webhooks | Stripe-Signaturprüfung, Idempotenz über `providerEventId` |
| Sperren/Blockieren | `Block` wirkt in beide Richtungen (Integrationstest) |
| Messaging | nur zwischen bestätigten Verbindungen (Integrationstest) |
| Dev-Werkzeuge | `/dev/outbox` nur mit `ENABLE_DEV_OUTBOX=true` **und** Rolle `admin`, optional Empfänger-Allowlist, Codes nie an den Browser in Produktion |
| Rate-Limits | zentrale Tabelle + `consumeRateLimit()` |
| Audit | `AdminAuditLog` für Auth-, Membership-, Admin- und Trial-Ereignisse |

Bekannte Lücken: keine 2FA, kein CSRF-Token zusätzlich zu sameSite-Cookies,
Privacy-Einstellungen werden nicht in allen Queries erzwungen, kein CI.
Siehe [`11-known-issues.md`](11-known-issues.md).

## 8. Umgebungen

| Umgebung | Start | Laufzeit | Datenbank |
| -------- | ----- | -------- | --------- |
| Lokal (Node) | `npm run dev` (bindet 0.0.0.0:3000) | Node.js 22 | libSQL `file:./dev.db` |
| Lokal (Worker) | `npm run cf:preview` | `workerd`, Port 8787 | lokale D1-Emulation (`.wrangler/state`) |
| Tests | `npm test` | Node | Wegwerf-`.test.db` |
| Preview | Nicht-`main`-Branches (Workers Builds, `upload`) | Cloudflare Workers | D1 `inner-circle-db` |
| Produktion | `main` | Cloudflare Workers | D1 `inner-circle-db` (Binding `DB`) |

## 9. Offene Architekturpunkte

- **E-Mail-/SMS-Versand** ist die einzige fehlende Infrastruktur, die den
  Kern-Flow (Verifizierung) blockiert.
- **Stripe** ist implementiert, aber ungetestet gegen einen echten Account.
- **Storage** (Avatare, Kursvideos, Dokumente) ist nicht angebunden.
- **Kein ISR/Caching:** alle Seiten sind dynamisch; der OpenNext-Cache nutzt
  ausschließlich statische Assets (kein R2, keine Queues).
- **Keine Transaktionen:** D1 bietet kein Transaktions-API; mehrstufige
  Schreibvorgänge sind bewusst sequenziell und idempotent gehalten.
