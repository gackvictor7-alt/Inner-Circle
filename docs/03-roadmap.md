# 20-Schritte-Roadmap

Jeder Schritt liefert einzeln testbare Ergebnisse und endet mit
Verifikation + Eintrag in `04-progress.md`.
Format pro Schritt: **Ziel · Kernlieferung · Abhängigkeiten ·
Abnahmekriterien.**

## Schritt 01 – Projekt-Fundament ✅ (laufend)

- **Ziel:** Lauffähige App-Basis, Doku, Architekturgrenzen.
- **Kernlieferung:** Next.js+TS+Tailwind-Scaffold, i18n (DE/EN),
  Light/Dark-System, Domain-Ordner, `.env.example`, `/docs`.
- **Abhängigkeiten:** keine.
- **Abnahme:** `npm run build` + `npm run lint` grün; Startseite zeigt
  Statusseite auf DE/EN, Theme-Umschalter persistent, keine DB nötig.

## Schritt 02 – Designsystem ✅ (überarbeitet durch Freigabe 2026-09-20)

- **Ziel:** Konsistente visuelle Grundlage für alle Bereiche **plus** neue
  öffentliche Marken- & Produktpräsentation (vom Auftraggeber zusammengelegt).
- **Kernlieferung:** Farb-/Design-Tokens (light/dark), Typografie (Inter,
  self-hosted), Spacing, UI-Primitiven (Button, Input, Card, Badge, Dialog,
  Dropdown, Tabs, Toast, Progress, Rating, Avatar, Icons), Navigation
  (Desktop + Mobile-Menü), Übersichtseite `/design`; neue öffentliche
  Startseite (Hero, Möglichkeiten, Trust & Reputation, Events, Membership,
  Footer) und echte Unterseiten: `/network`, `/business-deals`,
  `/investments`, `/marketplace`, `/events`, `/membership`, `/login`,
  `/register`, rechtliche Platzhalter.
- **Abhängigkeiten:** 01.
- **Abnahme:** Alle Primitiven in beiden Modi + responsiv nutzbar;
  Reduced-Motion respektiert; kein Hardcodetext (i18n); alle Routen
  erreichbar; Build/Lint grün.

## Schritt 03 – Öffentliche Website

- **Ziel:** Professioneller öffentlicher Auftritt + Registrierungswege.
- **Kernlieferung:** Homepage (Hero, Bereiche, Reputation-Erklärung,
  Event-Vorschau, Preise, Registrierungs-CTA), Funktionsseiten,
  rechtliche Platzhalterseiten (Inhalte später geprüft), Login-/Registrierungsseiten (UI, Logik in 04).
- **Abhängigkeiten:** 02.
- **Abnahme:** Alle Seiten DE/EN, mobil/desktop, keine erfundenen
  Erfolgsgeschichten, keine geleakten Mitgliederdaten.

## Schritt 04 – Datenbank & Authentifizierung

- **Ziel:** Echte Konten mit persistenten Daten.
- **Kernlieferung:** Postgres + Prisma (User, Profile-Stub, Auth-Tabellen),
  E-Mail+Passwort-Registrierung/Login, Verifizierung, Recovery,
  Session-Management, geschützte Routen, Basis-Admin-Rolle + Audit-Log.
- **Abhängigkeiten:** 01–03; **Gründer:** DB-Anbieter + E-Mail-Anbieter
  Konten (Free-Tier, Anleitungen folgen).
- **Abnahme:** Registrieren→Verifizieren→Login→Logout→Recovery
  Ende-zu-Ende getestet; unbefugte Zugriffe abgewiesen; keine Passwörter
  im Klartext; Rate-Limits aktiv.

## Schritt 05 – Mitgliedschaft & Onboarding

- **Ziel:** Kostenlos → Trial → zahlendes Mitglied, Rechte korrekt erzwungen.
- **Kernlieferung:** Kostenlos-Status, 48-h-Discovery-Trial (automatischer
  Ablauf, keine Karte, kein Auto-Charge), Stripe-Testmodus (Monat/Jahr),
  Webhook-verifizierter Abo-Status, Kündigen/Reaktivieren,
  Abrechnungsbereich (Status, Plan, Verlängerung, Historie, Belege),
  Onboarding-Profildaten (Basis).
- **Abhängigkeiten:** 04; **Gründer:** Stripe-Konto (Test), Jahrespreis-Entscheid.
- **Abnahme:** Trial läuft nach 48 h ab; Abo nur per Webhook aktiv;
  Kündigung wirkt zum Periodenende; Nicht-Mitglieder sehen keine
  geschützten Bereiche (server-seitig geprüft).

## Schritt 06 – Dashboard & Profile

- **Ziel:** Berufliche Präsenz + persönlicher Überblick.
- **Kernlieferung:** Dashboard (Profilstand, Empfehlungen, Termine,
  Nachrichten, Trust-Score-Platzhalter), Profilseiten (öffentliche
  Vorschau vs. Mitgliederansicht), Mehrfach-Rollen, Profilfortschritt,
  Avatar-Upload (Storage), Profilsichtbarkeits-Regeln.
- **Abhängigkeiten:** 04–05; Storage-Konto.
- **Abnahme:** Onboarding→Profil→Dashboard-Flow; Sichtbarkeitsregeln
  (Kontaktdaten nur für Mitglieder) server-seitig; DE/EN.

## Schritt 07 – Netzwerk & Nachrichten

- **Ziel:** Relevante Menschen finden und genehmigt verbinden.
- **Kernlieferung:** Mitgliederverzeichnis (Suche/Filter, regelbasierte
  Empfehlungen), Folgen vs. Vernetzen (Anfrage+Nachricht, Annehmen/
  Ablehnen), 1:1-Chat nach Annahme (Verlauf, Ungelesen, Dateien,
  Blockieren/Melden), Benachrichtigungen, Feed (Basis), Rate-Limits/Anti-Spam.
- **Abhängigkeiten:** 06.
- **Abnahme:** Vollständiger Connect→Chat-Flow zweier Testkonten;
  Nicht-Verbundene können nicht schreiben; Blockieren wirkt;
  Benachrichtigungen DE/EN.

## Schritt 08 – Firmenprofile & Gruppen

- **Ziel:** Strukturierte professionelle Gemeinschaften.
- **Kernlieferung:** Firmenprofile (verknüpft, Verifizierungs-Workflow),
  Interessengruppen (Antrag, Admin-Freigabe, Moderation, Gruppenchat-Basis).
- **Abhängigkeiten:** 07.
- **Abnahme:** Firmen-Claim nur mit Nachweis; Gruppen-Antrag→Freigabe-Flow;
  Moderationsrechte greifen.

## Schritt 09 – Business-Deals-Marktplatz

- **Ziel:** Chancen entdecken und sich bewerben (nur Mitglieder).
- **Kernlieferung:** Deal-Kategorien, strukturierte Listings, Suche/Filter,
  Detailseiten mit Vertraulichkeitsstufen (öffentliche Zusammenfassung /
  restricted / Dokumente), Bewerbungs-Workflow (Interesse→Prüfung→Annahme/
  Ablehnung), Moderation + Admin-Freigabe.
- **Abhängigkeiten:** 08; Provisionsordnung (Entwurf, Gründer/Legal).
- **Abnahme:** Nur Mitglieder sehen Marktplatz; Restricted-Inhalte erst
  nach Freigabe (server-seitig); Bewerbungs-Flow vollständig.

## Schritt 10 – Deal-Räume & Brokerage

- **Ziel:** Geschützte Zusammenarbeit bis zum Abschluss.
- **Kernlieferung:** Private Deal-Räume (Teilnehmer, Nachrichten,
  Dokumente mit Widerruf, Status, Meilensteine, Termine, Abschluss-
  Bestätigung), Provisionsvereinbarungen (Erfassung + Annahme),
  Abschluss-Meldung → Verifikation, Dritt-Empfehlungs-Workflow (kontrolliert).
- **Abhängigkeiten:** 09.
- **Abnahme:** Nur autorisierte Teilnehmer sehen Raum/Dokumente;
  Status- und Provisionshistorie auditierbar.

## Schritt 11 – Investment-Chancen

- **Ziel:** Discovery + Anbahnung mit klaren Schutzmechanismen.
- **Kernlieferung:** Separater Investment-Bereich, Einreichung durch
  Unternehmen, Admin-Prüfung + Freigabe/Ablehnung, Investoren-
  Interessenprofile, Interessensbekundungen, autorisierte Dokumente,
  Anfrage-Übersicht. **Keine Ausführung/Verwahrung.**
- **Abhängigkeiten:** 09–10; **Rechtsprüfung** (Lizenzfragen, Anbieter);
  ohne Freigabe bleibt Ausführung deaktiviert.
- **Abnahme:** Nur berechtigte Mitglieder sehen Details; Freigabe-Workflow
  dokumentiert; kein Text suggeriert Empfehlung/Rendite/Ausführung.

## Schritt 12 – Marktplatz & Verkäufer

- **Ziel:** Geprüfte Verkäufer bieten an, Käufer kaufen sicher.
- **Kernlieferung:** Verkäufer-Antrag + Freigabe, Verkäuferseiten,
  Kategorien, Listings, Kauf-Flow (Anbieterentscheidung Connect o. ä.),
  Auszahlungen, Rückerstattungen/Disputes, Provisionsregeln je Kategorie
  (konfigurierbar, transparent vor Verkauf).
- **Abhängigkeiten:** 06; Zahlungsanbieter-Entscheid; Steuer-/Rechts-Inputs
  (Rechnungen, Widerruf).
- **Abnahme:** Testkauf inkl. Auszahlungssimulation + Storno; Provisionen
  korrekt je Kategorie; nicht freigegebene Verkäufer können nicht verkaufen.

## Schritt 13 – Academy & Service-Buchung

- **Ziel:** Lernen + Dienstleistungen buchen.
- **Kernlieferung:** Kurse (Module, Videos, Materialien, Preise),
  Bibliothek, Fortschritt, verifizierte Kauf-Rezensionen, externe Kurse
  (Typen sauber getrennt), Buchungsarten (Festpreis, Kennenlernen,
  Terminbuchung, Anfrage, Angebot).
- **Abhängigkeiten:** 12; ggf. Video-Hosting-Entscheid.
- **Abnahme:** Kauf→Lernen→Fortschritt-Flow; nur Käufer sehen Inhalte;
  Bewertungen nur nach Kauf/Nutzung.

## Schritt 14 – Creator & Referrals

- **Ziel:** Partner werben Mitglieder, Provisionen sauber abgerechnet.
- **Kernlieferung:** Creator-Bewerbung + Freigabe, Referral-Links,
  Attribution (Registrierung→Zahlung), 20-€-Einmalprovision nach
  Anti-Fraud-/Storno-Frist, Creator-Dashboard (ohne private Nutzerdaten),
  Auszahlungs-Freigabe durch Gründer, Audit-Ledger.
- **Abhängigkeiten:** 05 (Zahlungsstatus), 12 (Trennung Marktplatzprovision).
- **Abnahme:** Referral-Flow mit Testzahlung; Selbst-/Doppel-Attribution
  blockiert; Storno storniert Provision; Auszahlung nur nach Freigabe.

## Schritt 15 – Vertrauen & Leistung

- **Ziel:** Belastbare Reputation aus verifizierter Zusammenarbeit.
- **Kernlieferung:** 1–5-Sterne-Trust-Score (Dezimal, nur Mitglieder
  sichtbar, „Noch keine verifizierten Bewertungen" als Start),
  Bewertungs-Berechtigung nur nach bestätigter Kollaboration,
  Produktbewertungen getrennt, Performance-Kennzahlen
  (verifiziert/bestätigt/selbstberichtet getrennt), Badges
  (u. a. Founding Member per Admin-Prozess), Leaderboards mit Opt-in.
- **Abhängigkeiten:** 10, 12–13.
- **Abnahme:** Unberechtigte Bewertungen unmöglich; Score-Math getestet;
  Sichtbarkeitsregeln (Mitglieder-only) server-seitig.

## Schritt 16 – Events & Experiences

- **Ziel:** Events entdecken, buchen, vernetzt erleben.
- **Kernlieferung:** Kategorien Connect/Develop/Experience, Admin-
  Eventverwaltung (+ genehmigte Community-Events), Ticketing (bezahlt/
  frei, Kapazität, Warteliste, QR-Check-in, Storno), Bewerbungen/
  Einladungen für exklusive Formate, Teilnehmerverzeichnis, Event-Chats,
  Medien-Uploads (nur mit Rechten).
- **Abhängigkeiten:** 05–07, 12-Zahlungslogik; keine fiktiven Events.
- **Abnahme:** Buchen→Ticket→Check-in-Flow; Mitglieder-only greift;
  Bewerbungs-/Einladungs-Flow getestet.

## Schritt 17 – Administration & Finanzen

- **Ziel:** Operative Steuerung des Geschäfts.
- **Kernlieferung:** Konsolidiertes Admin-Dashboard (Mitglieder, Abos,
  Freigaben, Moderation, Reports, Provisionsregeln, Auszahlungs-
  übersicht, Finanzreports, Analytics, CMS-Basics, Audit-Logs),
  rollenbasierte Admin-Rechte, kontrollierte Finanz-Workflows.
- **Abhängigkeiten:** 04–16 (baut auf allen Freigabe-Queues auf).
- **Abnahme:** Jede Admin-Aktion protokolliert; kein Zugriff für
  Nicht-Admins; sensible Aktionen nur mit Freigabe-Workflow.

## Schritt 18 – Integration & E2E-Tests

- **Ziel:** Zusammenhängende Plattform statt Einzelteile.
- **Kernlieferung:** Durchgängige Nutzerreisen getestet (Registrierung→
  Zahlung→Vernetzung→Deal→Kauf→Referral→Event), Fehlerbereinigung,
  Restproblemliste.
- **Abhängigkeiten:** 04–17.
- **Abnahme:** Testprotokoll grün, bekannte Probleme dokumentiert.

## Schritt 19 – Sicherheit, Performance, Produktionsreife

- **Ziel:** Deployment-Kandidat.
- **Kernlieferung:** Rechte-Audit aller Routen/APIs, Pen-Grundchecks
  (OWASP-Basics), Performance-Optimierung, Responsive-/A11y-Prüfung,
  Backup-/Recovery-Nachweis, Produktionskonfiguration, Rechtsdoku-Status
  (AGB, Datenschutz, Mitglieds-/Marktplatzbedingungen).
- **Abhängigkeiten:** 18; externe Rechtsprüfung beauftragt.
- **Abnahme:** Keine kritischen Sicherheitslücken offen; Checkliste
  in `09-deployment.md` abgearbeitet.

## Schritt 20 – Deployment & Launch-Vorbereitung

- **Ziel:** Betreibbare kommerzielle Plattform.
- **Kernlieferung:** Produktions-Deployment, Domain, Monitoring,
  Stripe-Live (nur nach Freigabe), Onboarding der ersten Mitglieder,
  Betriebs-Checkliste, Post-Launch-Roadmap.
- **Abhängigkeiten:** 19; Gründer-Freigaben (Zahlungen live, Preise, Texte).
- **Abnahme:** Smoke-Tests in Produktion; Rollback-Plan vorhanden.
