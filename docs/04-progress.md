# Entwicklungsfortschritt

Wird nach **jeder Phase** aktualisiert: Ergebnis, Dateien, Tests,
Probleme, externe Abhängigkeiten, nächster Schritt.

## Legende

- ✅ abgeschlossen · 🔄 laufend · ⬜ geplant · 🚫 blockiert

## Übersicht

| Schritt | Phase                    | Status   |
| ------- | ------------------------ | -------- |
| 01      | Projekt-Fundament        | ✅ abgeschlossen |
| 02      | Designsystem             | ⬜ geplant |
| 03      | Öffentliche Website      | ⬜ geplant |
| 04      | Datenbank & Auth         | ⬜ geplant |
| 05      | Mitgliedschaft & Onboarding | ⬜ geplant |
| 06      | Dashboard & Profile      | ⬜ geplant |
| 07      | Netzwerk & Nachrichten   | ⬜ geplant |
| 08      | Firmenprofile & Gruppen  | ⬜ geplant |
| 09      | Business-Deals-Marktplatz| ⬜ geplant |
| 10      | Deal-Räume & Brokerage   | ⬜ geplant |
| 11      | Investment-Chancen       | ⬜ geplant |
| 12      | Marktplatz & Verkäufer   | ⬜ geplant |
| 13      | Academy & Service-Buchung| ⬜ geplant |
| 14      | Creator & Referrals      | ⬜ geplant |
| 15      | Vertrauen & Leistung     | ⬜ geplant |
| 16      | Events & Experiences     | ⬜ geplant |
| 17      | Administration & Finanzen| ⬜ geplant |
| 18      | Integration & E2E-Tests  | ⬜ geplant |
| 19      | Sicherheit & Produktionsreife | ⬜ geplant |
| 20      | Deployment & Launch      | ⬜ geplant |

## Protokoll

### Schritt 01 – Projekt-Fundament (🔄 laufend, begonnen 2026-09-20)

- **Ziel:** Lauffähige App-Basis + verbindliche Dokumentation.
- **Umgesetzt:**
  - Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 Scaffold.
  - Zentrales i18n (DE/EN, `src/lib/i18n`), Standard Deutsch.
  - Theme-System light/dark/system, persistent, ohne Lade-Blitzen.
  - Status-Startseite (Platzhalter, explizit kein finales Design).
  - Domain-Ordner A–J, `.env.example`, `/docs`-Spezifikation.
- **Geändert/erstellt:** `package.json`, `src/app/*`, `src/components/*`,
  `src/lib/i18n/*`, `src/domains/*`, `src/lib/auth|db/README.md`,
  `.env.example`, `docs/*.md`, `README.md`.
- **Tests:** ausstehend (Build + Lint + manueller DE/EN-/Theme-Check).
- **Offen:** Verifikation in Sandbox, Commit, Freigabe für Schritt 02.
- **Externe Abhängigkeiten:** keine (bewusst ohne DB/Auth/Zahlung).
- **Nächster Schritt:** Schritt 02 (Designsystem).
