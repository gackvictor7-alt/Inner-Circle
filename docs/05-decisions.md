# Entscheidungen (ADR-Log)

Format: **Kontext → Entscheidung → Konsequenz.**
Annahmen sind als solche markiert; geänderte Geschäftsregeln nur mit
Gründer-Freigabe.

## ADR-001: Next.js-Monolith statt Microservices (2026-09-20, Schritt 01)

- **Kontext:** Solo-Gründer ohne Programmiererfahrung, Budget < 500 €,
  KI-gestützte Entwicklung, Web-first.
- **Entscheidung:** Eine Next.js-App (App Router, TypeScript) mit
  Server-Actions/API-Routen, relationale DB, managed Hosting.
- **Konsequenz:** Minimale Betriebskomplexität, eine Codebasis, später
  horizontal skalierbar; kein verteilter System-Overhead.

## ADR-002: PostgreSQL + Prisma ab Schritt 04 (2026-09-20, Schritt 01)

- **Kontext:** Komplexes relationales Modell (Mitglieder, Deals,
  Provisionen), Portabilität wichtig.
- **Entscheidung:** Managed PostgreSQL (Free-Tier, z. B. Neon) + Prisma
  mit versionierten Migrationen.
- **Konsequenz:** Schritt 01–03 ohne DB lauffähig; Schema wächst
  phasengerecht (Plan in `02-architecture.md`).

## ADR-003: Auth.js, keine eigene Krypto (2026-09-20, Schritt 01)

- **Kontext:** Sichere Konten ohne eigenes Sicherheitsrisiko.
- **Entscheidung:** Auth.js (E-Mail+Passwort zuerst, OAuth/2FA später).
- **Konsequenz:** Schnellere, geprüfte Implementierung in Schritt 04.

## ADR-004: Stripe für Abos, Connect-Kandidat für Marktplatz (2026-09-20, Schritt 01)

- **Kontext:** Karten + Apple/Google Pay, Abo-Logik, später Verkäufer-Auszahlungen.
- **Entscheidung:** Stripe (Testmodus zuerst); Marktplatz-Anbieter
  final in Schritt 12 (Kandidat: Stripe Connect). PayPal als Ergänzung
  evaluieren, sobald Abo-Flow steht.
- **Konsequenz:** Keine eigene Zahlungsinfrastruktur; Abo-Status nur
  per verifizierte Webhooks.

## ADR-005: Eigenes i18n-Wörterbuch statt next-intl (2026-09-20, Schritt 01)

- **Kontext:** DE/EN-Pflicht ab Tag 1, geringe Komplexität, keine
  lokalisierten Routen nötig im Fundament.
- **Entscheidung:** Leichtgewichtiges zentrales Wörterbuch
  (`src/lib/i18n`) mit Provider; Umstieg auf Routing-basiertes i18n
  in Schritt 03 möglich, falls nötig.
- **Konsequenz:** Keine zusätzliche Abhängigkeit; Regel „kein
  Hardcodetext" gilt ab sofort.

## ADR-006: Eigenes Theme-Modul (2026-09-20, Schritt 01)

- **Kontext:** Light/Dark-Pflicht, persistiert, ohne Lade-Blitzen.
- **Entscheidung:** Eigener `ThemeProvider` + Blocking-Init-Script statt
  Fremdpaket.
- **Konsequenz:** Volle Kontrolle, keine Abhängigkeit.

## ADR-007: Vercel als Hosting-Ziel (2026-09-20, Schritt 01)

- **Kontext:** Null DevOps, Preview-Deployments, Next.js-nativ.
- **Entscheidung:** Vercel (Free-Tier → Pro bei Wachstum).
- **Konsequenz:** Deployment ab Schritt 03 sinnvoll (öffentliche Seite);
  Kostenentscheidung bei Launch (`07-external-services.md`).
