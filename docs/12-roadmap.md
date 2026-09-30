# 12 – Roadmap ab dem aktuellen Stand

**Stand:** 2026-09-30 (Sprint 18: Post-Bilder, Inbox-Lesestatus, Beta-/Trial-Präzedenz) · davor 2026-09-29: Stripe-Sandbox-Billing, Portal, Profil-/Opportunity-UX.
Diese Roadmap ersetzt die frühere 20-Schritte-Planung
(`03-roadmap.md` – die Schritte 01–08 sind gebaut, siehe
[`00-SOURCE-OF-TRUTH.md`](00-SOURCE-OF-TRUTH.md)). Sie beginnt **beim heutigen
Stand**, nicht am Projektbeginn.

---

## NEXT – unmittelbar als Nächstes

### N-1 · Eigene Domain für Resend-Zustellbarkeit (SPF/DKIM/DMARC)

**Ziel:** E-Mail-Versand ist im Code vollständig realisiert (Multipart HTML+Text,
Apple-artiges reduziertes Template, Entity-Header, konfigurierbare From/Reply-To);
der Spam-Ordner wird durch eigene Domain-Reputation im DNS eliminiert.

**Schritte (Gründer):**
1. Eigene Domain im Resend Dashboard anlegen.
2. DNS-Einträge für SPF (`TXT`), DKIM (`CNAME`) und DMARC (`TXT`) hinterlegen.
3. Worker-Variable: `EMAIL_FROM` auf die verifizierte Domain setzen
   (z. B. `INNER CIRCLE <verify@unsere-domain.com>`). Optional: `EMAIL_REPLY_TO`.
4. Testlauf verifizieren: Posteingangs-Zustellung bei Gmail/Outlook.
5. `ENABLE_DEV_OUTBOX` in Produktion entfernen.

### N-2 · E-Mail-Templates für Benachrichtigungen prüfen

Nach N-1: Zustellung für die vorhandenen Benachrichtigungstypen (Verbindung,
Nachricht, Mitgliedschaft) freischalten und `NotificationPreference` wirksam
machen.

## SOON – wichtige nächste Funktionen

| Thema | Inhalt | Abhängigkeit |
| ----- | ------ | ------------ |
| **S-1 Stripe-Sandbox-Billing** | **ERLEDIGT im Sprint 17 (Code):** serverseitiger Checkout mit den bestehenden Price-ID-Variablen, Customer-Zuordnung, raw-body/signierte idempotente Webhooks für die sechs verbindlichen Events plus verzögerte Zahlarten, Lifecycle-/Invoice-Reconciliation und Customer Portal. Ein echter Testmodus-Durchlauf gegen den Worker bleibt offen. | Sandbox-Konfiguration/Testlauf |
| **S-2 Jahrespreis kommunizieren** | **ERLEDIGT:** Homepage, `/membership`, Billing, Übersetzungen, Seed und Dokumentation nennen exakt 24,99 €/Monat und 249,99 €/Jahr. | – |
| **S-3 Telefon-Registrierung** | Entweder vollständig implementieren (SMS + Schema `email = null`) oder Umschalter deaktivieren (K-05) | Twilio (optional) |
| **S-4 OAuth oder ehrlicher Zustand** | Buttons deaktivieren (Dead-Link-Regel) **oder** Google-Login implementieren (K-04) | Google-Client |
| **S-5 Datenschutz wirksam machen** | **Networking erledigt (Sprint 12, §3d)**; offen: übrige Bereiche (Marketplace, Deals) (K-06) | – |
| **S-6 Moderations-Queue** | Melden von Inhalten/Nutzern + `/admin/reports` (K-11) | – |
| **S-7 Uploads** | **Profil- und Post-Bilder erledigt** (R2 `MEDIA`, JPG/PNG/WebP, 5 MB, Magic-Byte-Prüfung); offen: Cover, Kursvideos und Nachrichten-Anhänge (K-10) | Storage-Konto für die übrigen Medientypen |
| **S-8 CI** | GitHub-Actions-Workflow mit `typecheck`, `test`, `cf:dry-run` (K-16) | – |
| ~~S-9 Lint aufräumen~~ | erledigt 2026-10-01 (K-15 behoben, Lint 0/0) | – |
| **S-10 Private Beta ausrollen** | Workers Paid bestätigen (K-24), Migration `0002` auf der Produktions-D1 (`cf:release`), erste Schlüssel über `/admin/beta`, Feedback der 10–30 Tester sammeln; danach E-Mail-Benachrichtigung bei neuer Anfrage/Nachricht mit Opt-in und Entscheidung „Schreiben an abgelaufene Tester“ (K-22) | N-1 (Mail-Domain) für E-Mails |
| **S-11 Layout-Klassen bereinigen** | `.ic-span-*` in `@layer components` verschieben oder Profil/Einstellungen auf `col-span-12 lg:col-span-*` umstellen (K-23) | Design-Freeze beachten |
| **S-12 Verifizierte Reputation-Badges** | Besondere Badges zusätzlich zum Trust Score (Founding Member, Investor, Founder, Entrepreneur, Verified Business Owner, Exit/Acquisition, High Deal Volume, Creator …). Teilweise **nicht** automatisch: Mitglied reicht Nachweis ein, Admin prüft, erst dann Freischaltung. **UI ist vorbereitet** (`VerifiedBadges` in Discover/Profilstruktur, max. 1–3 kleine Badges neben Name/Trust Score, keine Fake-Badges); offen: Migration/Badge-Tabelle, Proof-Upload, Admin-Workflow | eigener Sprint |

## LATER – größere Funktionen

| Thema | Inhalt |
| ----- | ------ |
| **L-1 Deal-Räume & Brokerage** | private Räume, Teilnehmer, Dokumente mit Widerruf, Meilensteine, Abschlussbestätigung, Provisionsvereinbarungen |
| **L-2 Deal-Fee & Provisions-Engine** | ~~degressive Staffel als zentrale Berechnung, Deal-Bedingungen mit Versionsstempel~~ **erledigt im aktuellen Sprint** (`src/lib/deals/fees.ts`). Offen und bewusst **nicht** in diesem Sprint: Abrechnung, Auszahlungsfreigaben, Steuerlogik – sowie die **juristisch geprüfte** Endformulierung der Bedingungen |
| **L-3 Marktplatz-Bezahlung** | Bestellungen, Zahlungen, Verkäuferauszahlungen (Stripe Connect), Refunds, Freigabe-Workflow erzwingen (K-07) |
| **L-4 Trust & Verifikation** | ~~abgeschlossene Kollaboration als Bewertungskontext, Aggregation~~ **erledigt in Sprint 16** (`opportunity`/`marketplace`/`investment`, Score = Durchschnitt verifizierter Bewertungen, Admin-Moderation). ~~Bestätigter Deal als vierter Kontext~~ **erledigt im aktuellen Sprint** (`deal`, nur bei beidseitig bestätigtem `DealRecord`; Signal `verified_deals`). Offen: Event-Kontext (K-27 – Attendance fehlt technisch) und Badge-Vergabe (siehe **S-12**, UI-Slot bereits vorbereitet) |
| **L-5 Event-Backend** | Event-Erstellung, Kapazitäten/Wartelisten erzwingen, Tickets, QR-Check-in |
| **L-6 Investments-Ausbau** | Datenraum, Dokumente, Anbahnung mit regulierten Partnern – **erst nach Rechtsprüfung** |
| **L-7 Creator/Referrals** | Referral-Links, Attribution, Provisionen, Auszahlungen |
| **L-8 Gruppen & Firmenprofile** | Gruppen, Rollen, Moderation, Firmenverifizierung |
| **L-9 Sicherheits- & Produktionsreife** | 2FA, Security-Header, OWASP-Audit, Backup-/Recovery-Nachweis, Lasttests |
| **L-10 Native Apps / API** | Mobile Clients auf Basis derselben Domänenlogik |
| **L-11 M&A-Bereich (Roadmap)** | eigener Bereich für Mergers & Acquisitions: Unternehmen kaufen/verkaufen, Nachfolge, Beteiligungen, Due-Diligence-Vorbereitung, M&A-Beratung. **In diesem Sprint bewusst nur dokumentiert, nicht gebaut.** Es gibt bewusst **keinen** Navigationspunkt, solange der Bereich keinen Nutzen hat. Die fachliche Umsetzung wird voraussichtlich **teilweise an externe Spezialisten/Partner ausgelagert**; die technische Grundlage (Deal-Erfassung, `DealRecord.category`, Fee-Berechnung) existiert bereits. **Vor** einem Produktbereich: Rechtsprüfung, Steuerberatung und die Entscheidung, ob V&P vermittelt oder nur vermittelt anbahnen lässt |
| **L-12 Impact / 5 % gemeinnützig** | Zielsetzung, dass künftig 5 % der Gewinne in eigene gemeinnützige Projekte und ausgewählte Hilfsprojekte fließen. **In diesem Sprint nur als ehrlich gekennzeichnete Zukunfts-/Commitment-Darstellung** umgesetzt (Website `/investments`). Offen und bewusst offen: eigene Stiftung bzw. geeignete gemeinnützige Struktur, juristische und steuerliche Prüfung, Definition der Bemessungsbasis „Gewinn". **Keine** Buchhaltung, **keine** Auszahlung, **keine** erfundenen Zahlen |

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
