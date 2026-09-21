# 11 – Known Issues

**Stand:** 2026-09-21 · Basis: `main` @ `f22c19e`.
Diese Liste enthält **nur aktuell gültige** Probleme. Bereits behobene Punkte
(Dev-Postausgang 404, stiller Nachrichtenverlust, Trial-Start im Onboarding,
`"use server"`-Export, Dashboard-Variablen) sind im
[`archive/04-progress-log.md`](archive/04-progress-log.md) dokumentiert und
**nicht** mehr offen.

**Prioritäten:** P0 blockiert den Live-Betrieb · P1 wichtig vor dem Launch ·
P2 mittelfristig · P3 Aufräumen.

---

## P0 – blockiert den Kern-Flow

### K-01 · E-Mail-Zustellung im Spam-Ordner (Test-Domain `resend.dev`)

- **Symptom:** Verifizierungs-E-Mails kommen zwar technisch bei Resend an, landen
  beim Empfänger aber im Spam-Ordner.
- **Ursache:** Die Absender-Testdomain `onboarding@resend.dev` ist eine geteilte
  Sandbox von Resend, die von vielen Testanwendungen genutzt und von Mail-Providern
  (Gmail, Outlook, Apple Mail) durch mangelnde Domain-Reputation abgewertet wird.
- **Bereits im Code verbessert:**
  - Standardkonforme Multipart-Zustellung (HTML + Plaintext) statt reinem Text
  - Reduziertes, hochwertiges Apple-artiges Verification-Template mit klarer Typografie
  - Keine Spam-Triggerwörter, korrekte UTF-8-Codierung und Tabellen-Layout
  - Eindeutiger Entity-Header (`X-Entity-Ref-ID`)
  - Konfigurierbare `EMAIL_FROM` und `EMAIL_REPLY_TO` Variablen
- **Offene Produktions-Abhängigkeit (Gründer):** Eigene Domain in Resend anlegen
  und DNS-Einträge für SPF (`TXT`), DKIM (`CNAME`) und DMARC (`TXT`) setzen.
  Anschließend `EMAIL_FROM="INNER CIRCLE <verify@unsere-domain.com>"` als
  Cloudflare Environment-Variable hinterlegen. Erst damit ist eine saubere
  Posteingangs-Zustellung ohne Spamfilter-Klassifizierung gewährleistet.

### K-02 · Keine SMS-Verifizierung (Twilio)

- **Symptom:** Der Telefon-Kanal kann keinen Code zustellen.
- **Ursache:** `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`
  fehlen.
- **Priorität im Alltag:** niedriger als K-01 (E-Mail genügt zum Start).

## P1 – wichtig vor dem Launch

### K-03 · Jahrespreis: Marketing-Text und Code widersprechen sich

- **Symptom:** `/membership` sagt „Preis folgt / Der endgültige Jahrespreis ist
  noch nicht festgelegt", während `src/lib/membership/plans.ts` **249,90 €/Jahr**
  führt und `/app/billing` diesen Preis anzeigt.
- **Betroffen:** `src/lib/i18n/dictionaries.ts` (`membershipAnnualNote`,
  `membership.annual*`).
- **Lösung:** Gründer entscheidet: Preis bestätigen oder Jahresplan im Billing
  als „noch nicht verfügbar" kennzeichnen. Danach Texte angleichen
  (redaktionelle Änderung, kein Redesign).
- **Hinweis:** Nicht im Rahmen dieses Dokumentationsauftrags geändert
  (Design-/Inhalts-Freeze).

### K-04 · OAuth-Buttons führen ins Leere (404)

- **Symptom:** „Google"/„Apple" auf `/login` und `/register` sind als
  „Einrichtung erforderlich" gekennzeichnet, verlinken aber auf
  `/api/auth/oauth/google` bzw. `/api/auth/oauth/apple` – **diese Routen
  existieren nicht** → 404. Der Button „Telefon" verlinkt auf `/login?method=phone`
  und bewirkt nichts.
- **Ursache:** UI-Vorbereitung (auth §B) ohne Backend.
- **Regelverstoß:** Projektregel „keine Dead Buttons" – der Hinweis „Einrichtung
  erforderlich" ist vorhanden, der Link ist trotzdem ein toter Pfad.
- **Empfohlene Lösung (separater Auftrag):** Buttons als echte `disabled`-Elemente
  rendern (ohne Navigationsziel) **oder** Route implementieren. Keine
  Designänderung nötig – das Aussehen bleibt gleich.

### K-05 · Registrierung per Telefonnummer funktioniert nicht

- **Symptom:** Wählt man im Registrierungsformular „Telefon", schlägt die
  Anmeldung mit `invalidEmail` fehl.
- **Ursache:** Im Telefon-Modus wird das E-Mail-Feld nicht gerendert, die
  Server-Action verlangt aber eine gültige E-Mail (`EMAIL_RE`) und stellt den
  Code immer über den E-Mail-Kanal aus.
- **Lösung:** Entweder Telefon-Registrierung vollständig implementieren
  (Schema erlaubt `email = null`) oder den Umschalter deaktivieren, bis die
  Funktion existiert.

### K-06 · Datenschutz-Einstellungen werden nicht überall erzwungen

- **Symptom:** `PrivacySettings.profileVisibility`, `contactVisibility`,
  `performanceVisibility` werden gespeichert, aber nicht in allen Queries
  ausgewertet (Directory respektiert nur `discoverable`; Profil- und
  Trust-Daten werden im Mitgliederbereich weitgehend unabhängig davon gezeigt).
- **Risiko:** Sichtbarkeitsversprechen wird nicht eingehalten.
- **Lösung:** Zentrale Query-Erweiterung + Tests, danach
  [`06-permissions.md`](06-permissions.md) aktualisieren.

### K-07 · Marketplace: keine Bezahlung, Verkäuferfreigabe nicht erzwungen

- **K-07a:** Käufe von Produkten/Services existieren nicht (keine Bestell- oder
  Zahlungstabellen). Kurszugang wird ohne Zahlung als `Enrollment.source = "granted"`
  gespeichert und in der UI als „kein Zahlungsvorgang" gekennzeichnet.
- **K-07b:** `SellerProfile.status` (Freigabe-Workflow) wird beim Anlegen eines
  Listings **nicht** geprüft – jedes Mitglied mit `marketplaceSell` kann
  publizieren.
- **Lösung:** Zahlungsweg über Stripe (Checkout + Webhook) und Freigabeprüfung
  im Listing-Flow; vorher Freigabe-Ansprüche im UI zurücknehmen.

### K-08 · Trust-System ohne Erfassung

- **Symptom:** `/app/trust` und Profilseiten zeigen Bewertungen/Score, aber es
  kann **keine** Bewertung abgegeben werden; `TrustScoreSummary` bleibt leer
  (bewusst kein erfundener Wert).
- **Ursache:** Verifikationskontext (abgeschlossene Kollaboration) fehlt.
- **Lösung:** Kontext-Verifikation (z. B. abgeschlossene Opportunity/Connection)
  definieren, dann Erfassung + Aggregation implementieren.

### K-09 · Ungeprüfte Rechtstexte

- **Symptom:** `/imprint`, `/privacy`, `/terms` sind Platzhalter.
- **Risiko:** kein öffentlicher Start ohne geprüfte Rechtstexte.
- **Lösung:** Rechtsberatung (siehe [`12-roadmap.md`](12-roadmap.md) → LEGAL).

## P2 – mittelfristig

### K-10 · Keine Uploads (Avatar, Cover, Kursvideos, Anhänge)

- Profilbilder/Cover sind URL-Felder, Nachrichten-Anhänge ungenutzt,
  Kurslektionen ohne Videoquelle. Ohne Storage-Anbindung keine Uploads.
- **Lösung:** S3-kompatiblen Bucket anbinden (`S3_*`), Typ-/Größenprüfung,
  private Bereiche getrennt halten.

### K-11 · Moderations-Queue ohne Oberfläche

- `Report`-Tabelle existiert, es gibt keine Melde-UI und keine Queue im Admin.
- **Lösung:** Melde-Aktion + `/admin/reports`.

### K-12 · Keine Events-Erstellung, keine Tickets

- Events können im Backend nicht angelegt werden (AppShell-Eintrag ist bewusst
  deaktiviert). `EventApplication` bildet Bewerbungen ab, es gibt keine Tickets,
  Preise oder Check-ins.

### K-13 · `Report`-, `Invoice`- und Performance-Daten sind reine Vorbereitung

- Diese Tabellen werden geschrieben bzw. gelesen, aber ohne Provider (Stripe)
  bzw. ohne Eingabemaske nicht befüllt. Status in
  [`05-database.md`](05-database.md) markiert.

### K-14 · Sicherheitsausbau offen

- Keine 2FA (Schema vorbereitet), kein zusätzliches CSRF-Token
  (nur `sameSite=lax`), keine Security-Header-Definition außer Cache-Headern,
  kein Penetrationstest.
- **Lösung:** Teil von Roadmap LATER (Sicherheit & Produktionsreife).

## P3 – Aufräumen / technische Schulden

### K-15 · Lint nicht fehlerfrei (vorbestehend)

- `npm run lint` meldet **21 Probleme**: 7 Fehler (React-Hooks-Regeln
  „setState in effect" in `SiteHeader`, `StatsSection`, `AppShell`,
  `DiscoverDeck`, `AuthForms`; „impure function during render" in
  `app/events/page.tsx`; `module`-Zuweisung in `scripts/seed.ts`) und
  14 Warnungen (ungenutzte Importe/Variablen).
- **Wichtig:** Diese Hinweise sind **vorbestehend** und wurden durch den
  Dokumentationsauftrag nicht verändert. Ein Fix ist ein eigener Auftrag mit
  Verhaltensprüfung (einige Effekte steuern sichtbares Verhalten).

### K-16 · Keine CI

- Es gibt keine GitHub-Actions-Workflows. Typecheck/Tests laufen nur manuell
  oder über Workers Builds (dort greift nur der Build).

### K-17 · Doppelte Preis-Konstanten

- Preise stehen in `src/lib/membership/plans.ts` **und** in
  `src/lib/env.ts` (`membershipPricing`). Divergenzrisiko; `plans.ts` ist die
  wirksame Quelle.
- **Lösung:** `membershipPricing` durch Re-Export aus `plans.ts` ersetzen
  (kleine, risikoarme Änderung – eigener Auftrag).

### K-18 · Doku-Referenzen auf nicht existierende Dateien

- **Behoben mit diesem Auftrag:** `tests/README.md` verwies auf
  `docs/08-testing-checklist.md`, `vitest.config.ts` auf `docs/11-testing.md`.
  Beide zeigen jetzt auf vorhandene Dokumente.

### K-19 · Kein Browser-Test in der Sandbox möglich

- In der Entwicklungsumgebung ist kein Chromium installierbar; Layout-,
  Breakpoint- und Gestenprüfungen erfolgen manuell/über Code-Review. Die
  vollständige manuelle QA-Liste steht in
  [`08-testing.md`](08-testing.md) → Testmatrix.
