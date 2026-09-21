# 12 – Roadmap ab dem aktuellen Stand

**Stand:** 2026-09-21 · Basis: `main` @ `f22c19e`.
Diese Roadmap ersetzt die frühere 20-Schritte-Planung
(`03-roadmap.md` – die Schritte 01–08 sind gebaut, siehe
[`00-SOURCE-OF-TRUTH.md`](00-SOURCE-OF-TRUTH.md)). Sie beginnt **beim heutigen
Stand**, nicht am Projektbeginn.

---

## NEXT – unmittelbar als Nächstes

### N-1 · Echter E-Mail-Versand für die Account-Verifizierung

**Ziel:** Ein neues Konto kann sich in Produktion selbst verifizieren, ohne
Dev-Postausgang und ohne dass ein Code verloren geht.

**Schritte**
1. Resend-Konto anlegen, Absenderdomain verifizieren (SPF/DKIM/DMARC).
2. Worker-Variablen: `RESEND_API_KEY` (Secret), `EMAIL_FROM` (Text,
   z. B. `INNER CIRCLE <noreply@domain>`).
3. Testlauf: Registrierung → Code per E-Mail → `/verify` → Onboarding → Trial.
4. Fehlerpfade prüfen: ungültiger Key, Rate-Limit, Resend-Cooldown,
   Zustellstatus `provider`.
5. `ENABLE_DEV_OUTBOX` entfernen, `DevOutbox` leeren.
6. Dokumentation aktualisieren (dieses Dokument, `00`, `07`, `09`, `11`).

**Definition of Done:** Registrierung und Passwort-Reset funktionieren über den
echten Provider; `/verify` meldet „gesendet"; Tests bleiben grün; keine
Klartext-Codes in Browser oder Logs.

**Nicht Teil dieses Schritts:** SMS, OAuth, Stripe.

### N-2 · E-Mail-Templates für Benachrichtigungen prüfen

Nach N-1: Zustellung für die vorhandenen Benachrichtigungstypen (Verbindung,
Nachricht, Mitgliedschaft) freischalten und `NotificationPreference` wirksam
machen.

## SOON – wichtige nächste Funktionen

| Thema | Inhalt | Abhängigkeit |
| ----- | ------ | ------------ |
| **S-1 Stripe scharf schalten** | Produkt + Preise (24,99 €/Monat, 249,90 €/Jahr), Webhook registrieren, Testkauf, Billing-Portal | Stripe-Konto (Test zuerst) |
| **S-2 Jahrespreis klären** | Marketingtext und tatsächlichen Preis angleichen (K-03) | Gründer-Entscheidung |
| **S-3 Telefon-Registrierung** | Entweder vollständig implementieren (SMS + Schema `email = null`) oder Umschalter deaktivieren (K-05) | Twilio (optional) |
| **S-4 OAuth oder ehrlicher Zustand** | Buttons deaktivieren (Dead-Link-Regel) **oder** Google-Login implementieren (K-04) | Google-Client |
| **S-5 Datenschutz wirksam machen** | `PrivacySettings` in allen Queries erzwingen + Tests (K-06) | – |
| **S-6 Moderations-Queue** | Melden von Inhalten/Nutzern + `/admin/reports` (K-11) | – |
| **S-7 Uploads** | S3-kompatibler Bucket für Avatar/Cover, Typ-/Größenprüfung (K-10) | Storage-Konto |
| **S-8 CI** | GitHub-Actions-Workflow mit `typecheck`, `test`, `cf:dry-run` (K-16) | – |
| **S-9 Lint aufräumen** | 21 vorbestehende Hinweise beheben, Verhalten prüfen (K-15) | – |

## LATER – größere Funktionen

| Thema | Inhalt |
| ----- | ------ |
| **L-1 Deal-Räume & Brokerage** | private Räume, Teilnehmer, Dokumente mit Widerruf, Meilensteine, Abschlussbestätigung, Provisionsvereinbarungen |
| **L-2 Provisions-Engine** | kategorieabhängige Sätze, Abrechnung, Auszahlungsfreigaben |
| **L-3 Marktplatz-Bezahlung** | Bestellungen, Zahlungen, Verkäuferauszahlungen (Stripe Connect), Refunds, Freigabe-Workflow erzwingen (K-07) |
| **L-4 Trust & Verifikation** | abgeschlossene Kollaboration als Bewertungskontext, Aggregation, Badge-Vergabe (K-08) |
| **L-5 Event-Backend** | Event-Erstellung, Kapazitäten/Wartelisten erzwingen, Tickets, QR-Check-in |
| **L-6 Investments-Ausbau** | Datenraum, Dokumente, Anbahnung mit regulierten Partnern – **erst nach Rechtsprüfung** |
| **L-7 Creator/Referrals** | Referral-Links, Attribution, Provisionen, Auszahlungen |
| **L-8 Gruppen & Firmenprofile** | Gruppen, Rollen, Moderation, Firmenverifizierung |
| **L-9 Sicherheits- & Produktionsreife** | 2FA, Security-Header, OWASP-Audit, Backup-/Recovery-Nachweis, Lasttests |
| **L-10 Native Apps / API** | Mobile Clients auf Basis derselben Domänenlogik |

## LEGAL / EXTERNAL DEPENDENCY (nicht rein technisch lösbar)

| Punkt | Was gebraucht wird |
| ----- | ------------------ |
| Rechtstexte | AGB, Datenschutzerklärung, Impressum – anwaltlich geprüft (K-09) |
| Provisionsordnung | Regeln für Deal-/Marktplatz-Provisionen vor Aktivierung von L-2 |
| Investments | Struktur, Erlaubnispflichten, Partner – vor jeder Ausführungsfunktion |
| Zahlungen | Stripe-Konto inkl. Verifizierung, ggf. Steuer-/Rechnungsfragen |
| E-Mail-Zustellbarkeit | Verifizierte Domain, SPF/DKIM/DMARC, Versandrichtlinien |
| Markenrechte | Finaler Markenname (INNER CIRCLE ist Arbeitsname) |
| Datenschutz-Folgenabschätzung | bei Verarbeitung sensibler Profildaten/Trust-Daten |

## Reihenfolge-Empfehlung

```
N-1 (E-Mail) ──► N-2 ──► S-1 (Stripe) ──► S-2 ──► S-5/S-8 (Qualität)
                                    └────► S-6/S-7 parallel möglich
LATER erst nach Freigabe der LEGAL-Punkte
```

**Der erste Schritt bleibt N-1: echter E-Mail-Versand für die
Account-Verifizierung** – er ist die einzige Lücke zwischen „läuft in der
Sandbox" und „läuft für echte Nutzer".
