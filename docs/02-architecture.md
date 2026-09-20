# Technische Architektur

**Stand:** Schritt 01 (Fundament) · Letzte Aktualisierung: 2026-09-20

## 1. Technologie-Entscheidung

| Schicht              | Wahl (Start)                                  | Warum                                                      |
| -------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Web-App              | **Next.js (App Router) + React + TypeScript** | Ein Codebase für Marketing-Seiten + App, Server-Actions/APIs inklusive, exzellentes KI-Tooling, Vercel-Deployment |
| UI-Styling           | **Tailwind CSS v4**                           | Utility-first, Dark-Mode via CSS-Variablen, Design-Token-fähig |
| Internationalisierung| **Zentrales Wörterbuch-Modul** (`src/lib/i18n`) | DE/EN ab Tag 1, kein verstreuter Hardcodetext; Migration auf next-intl/Routing möglich |
| Theme                | Eigener `ThemeProvider` (light/dark/system)   | Keine Abhängigkeit, FOUC-frei, persistiert                  |
| Datenbank            | **SQLite via Drizzle ORM** – **Cloudflare D1** in Produktion, libSQL-Datei lokal (ADR-008) | Relational, migrationsbasiert (`drizzle/`), gleiches Schema in Dev/Test/Prod, Free-Tier |
| Auth (ab St. 04)     | **Auth.js (NextAuth)**                        | E-Mail+Passwort zuerst, OAuth (Google/Apple) + 2FA nachrüstbar, keine eigene Krypto |
| E-Mail (ab St. 04)   | Transaktions-Mailer (z. B. Resend Free-Tier)  | Verifizierung, Recovery, Benachrichtigungen                |
| Abos (ab St. 05)     | **Stripe** (Testmodus → Live)                 | Karten, Apple/Google Pay; Webhook-verifizierter Abo-Status; PayPal ergänzbar |
| Marktplatz (ab St.12)| Vorauss. **Stripe Connect**                   | Finale Wahl in Schritt 12 (Auszahlungen, KYC, Disputes)    |
| Storage (ab St. 06)  | S3-kompatibler Object Storage                 | Avatare, Kursvideos, Deal-Dokumente (privat vs. öffentlich getrennt) |
| Hosting              | **Cloudflare Workers** via OpenNext (ADR-008) | Workers Builds pro Branch/PR, D1 im selben Konto, Free-Tier-Start; Runbook `09-deployment.md` |
| Mobile (später)      | Responsives Web zuerst; nativ später          | API-/Server-Logik wiederverwendbar                         |

**Prinzip:** Monolith-first (eine Next.js-App, ein Schema), keine
Microservices. Skalierung über managed Services + Caching, nicht über
verteilte Systeme.

## 2. Repository-Struktur

```
Inner-Circle/
├── docs/                  # Verbindliche Projektspezifikation (diese Dateien)
├── public/                # Statische Assets (brand/ für Logo/Medien)
├── drizzle/               # SQL-Migrationen (Drizzle Kit) für D1/libSQL
├── src/
│   ├── app/               # Next.js App Router (Routen, Layouts)
│   ├── components/
│   │   └── ui/            # (ab Schritt 02) wiederverwendbare UI-Primitiven
│   ├── domains/           # Fachlogik je Produktbereich (A–J), siehe README dort
│   └── lib/
│       ├── i18n/          # Zentrale DE/EN-Wörterbücher + Provider (aktiv)
│       ├── auth/          # Session-/Passwort-/OTP-Logik
│       └── db/            # Hinweise; Client + Schema liegen in src/db/
├── wrangler.jsonc         # Cloudflare-Worker-Konfiguration (D1-Binding DB)
├── open-next.config.ts    # OpenNext-Adapter für Cloudflare
├── .env.example           # Alle Umgebungsvariablen (ohne Geheimnisse)
└── README.md
```

## 3. Datenmodell (Zielbild, phasenweise eingeführt)

Entitäten laut Spezifikation Teil 17 – **nicht alle sofort**.
Einführungsplan:

- **Schritt 04:** User, AuthIdentity (via Auth.js-Adapter), VerificationToken,
  Session (falls DB-Sessions), Profile-Stub.
- **Schritt 05:** Membership, Subscription, BillingEvent, TrialRecord.
- **Schritt 06:** Profile, ProfessionalRole, Company, CompanyAffiliation.
- **Schritt 07:** Follow, ConnectionRequest, Connection, Message,
  Conversation, Post, Group, GroupMembership.
- **Schritt 08:** Company-Erweiterungen, GroupApplication, Moderation.
- **Schritt 09–10:** BusinessOpportunity, DealApplication, DealRoom,
  DealParticipant, DealDocument, DealStatusHistory, CommissionAgreement,
  CommissionRecord.
- **Schritt 11:** InvestmentOpportunity, InvestmentApplication,
  InvestorProfile (Discovery-Stufe, keine Ausführung).
- **Schritt 12–13:** Seller, Product, Course, Lesson, Enrollment,
  LessonProgress, Order, Payment, Refund, Booking, Proposal.
- **Schritt 14:** CreatorApplication, ReferralLink, ReferralAttribution,
  CreatorCommission, Payout.
- **Schritt 15:** CollaborationReview, TrustScore, ProductReview,
  PerformanceRecord, Badge, BadgeAward, LeaderboardOptIn.
- **Schritt 16:** Event, EventApplication, Ticket, Attendance,
  EventParticipant, EventMedia.
- **Schritt 17:** AdminRole, AdminAction (Audit-Log), Report, ReportCase,
  CommissionRule, FinancialReport-Sichten.
- **Querschnitt:** Notification (ab 07), AuditLog (ab 04 für Admin-Aktionen).

Regeln: explizite Relationen, Indizes für Suche/Fremdschlüssel,
Zugriffskontrolle auf API-/DB-Ebene (niemals nur Frontend-Verstecken),
Migrationen versioniert, keine Duplikation geschäftskritischer Daten.

## 4. Sicherheit (Pflicht ab Schritt 04, Prinzip ab sofort)

- Server-seitige Autorisierung auf jeder geschützten Route/API/Server-Action.
- Mitgliedsstufen (Besucher/Registriert/Mitglied) + Aktivitätsfreigaben
  (Verkäufer, Creator, Investoren-Eignung) als **zwei getrennte Achsen**.
- Datei-Uploads: Typ-/Größenprüfung, private Buckets mit signierten URLs,
  widerrufbare Deal-Dokument-Zugriffe.
- Rate-Limits für sensible Aktionen (Login, Registrierung, Nachrichten,
  Bewerbungen), Spam-/Missbrauchsmeldungen mit Moderations-Queue.
- Zahlung/Webhooks: ausschließlich signaturverifizierte Provider-Events
  schalten Abos/Rechte frei – niemals „Erfolgsseiten".
- Geheimnisse nur in Env-Variablen; `.env.local` nie committen.
- Audit-Logs für Admin-Aktionen, Finanzanpassungen, Freigaben.
- Backups + Recovery (Provider-PITR) ab Produktionsnähe (Schritt 19).

## 5. Umgebungen

- **Lokal:** `npm run dev` (diese Sandbox / Gründer-Rechner).
- **Workers-Vorschau:** `npm run cf:preview` (App in `workerd` + lokale D1).
- **Preview:** Cloudflare Workers Builds pro Branch/PR (Versions-Upload).
- **Produktion:** `main`-Branch, eigene Env-Variablen, Stripe-Live erst
  nach Freigabe + Tests (Schritt 20).

Details: `09-deployment.md`, `07-external-services.md`.
