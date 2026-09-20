# Deployment-Strategie

## Umgebungen

| Umgebung | Branch | Zweck | URL |
| -------- | ------ | ----- | --- |
| Lokal | Feature-Branch | Entwicklung, Verifikation | `http://localhost:3000` |
| Preview | jeder Push/PR | Review pro Änderung | Vercel-Preview-URL |
| Produktion | `main` | Öffentlicher Betrieb | Produkt-Domain (Schritt 20) |

## Ablauf

1. Arbeit auf `arena/01a0bf78-inner-circle` (diese Session) bzw. Schritt-Branches.
2. Push → automatisches Vercel-Preview → manuelle Prüfung.
3. PR nach `main` mit Phasen-Checkliste (siehe `08-testing.md`).
4. Merge → Produktions-Deployment (anfangs manuell bestätigt).
5. Stripe-Live, echte E-Mails und echte Domain nur in Produktion,
   erst nach Freigabe (Schritt 20).

## Konfiguration

- Alle Geheimnisse als Env-Variablen **pro Umgebung** (Vercel Dashboard),
  niemals im Repo. `.env.local` nur lokal.
- `.env.example` dokumentiert jede Variable (ohne Werte).
- DB-Migrationen laufen kontrolliert (`prisma migrate deploy`), nie
  automatisch-destruktiv.

## Produktions-Checkliste (Schritt 19/20)

- [ ] Env-Variablen Produktion gesetzt (DB, Auth, Mail, Stripe-Live, Storage).
- [ ] Stripe-Webhooks auf Produktions-URL registriert + signiert getestet.
- [ ] Domain + TLS + Redirects (www/non-www) konfiguriert.
- [ ] E-Mail-Absenderdomain verifiziert (SPF/DKIM/DMARC).
- [ ] Backups + Point-in-Time-Recovery nachgewiesen.
- [ ] Monitoring + Fehlermeldungen (z. B. Vercel Analytics/Logs, Sentry optional).
- [ ] Rate-Limits + Security-Header aktiv.
- [ ] Rechtstexte (AGB, Datenschutz, Mitglieds-/Marktplatzbedingungen) geprüft live.
- [ ] Smoke-Tests in Produktion + Rollback-Plan (`main`-Revert, DB-Backup).
- [ ] Betriebs-Checkliste: Support-Weg, Moderations-Bereitschaft, Payout-Freigaben.
