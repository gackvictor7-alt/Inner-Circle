# 11 – Known Issues

**Stand:** 2026-09-22 · Basis: Branch `arena/01a0cad6-inner-circle`
(Basis `main` @ `128295a`, Sprint 8). Hinweis: Sprint 8 hat einen
Render-500-Fehler im neuen-Paar-Chat behoben (`?to=` ohne bestehende
Konversation rief eine Server Action während des Renders auf –
`revalidatePath during render is unsupported`); `ensureDirectConversation()`
ersetzt diesen Pfad, `core-loop.test.ts` + HTTP-Verifikation decken ihn ab.
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

### K-20 · Produktions-500 auf `/app`: rohe `Date`-Objekte als D1-Bind-Parameter — **BEHOBEN (2026-09-22)**

- **Symptom (produktiv, nach PR #19):** `GET /app` → „This page couldn't load.
  A server error occurred.", Worker-Stack `queryWithCache (worker.js:52730:21)`.
- **Ursache (nachgewiesen):** `forYouItems()` (Sprint 8, „Für dich“ auf `/app`)
  interpolierte rohe JavaScript-`Date`-Objekte in `sql`-Fragmente
  (`coalesce(…, ${new Date(0)})` in der Ungelesene-Nachricht-Query und
  `` `${events.startsAt} >= ${now}` `` in der Event-Query). Rohe `sql`-Werte
  werden **unmapped** gebunden, erreichen `D1PreparedStatement.bind()` als
  Objekte – D1 lehnt nicht-skalare Binds ab:
  `D1_TYPE_ERROR: Type 'object' not supported for value …`. Der libSQL-Treiber
  (lokale Node-Tests) akzeptiert `Date`-Binds stillschweigend, deshalb blieb
  die Suite vor dem Merge grün. Reproduktion: identische 500-Kette in
  `workerd` (lokale D1-Emulation) inkl. Error-Digest.
- **Fix (`src/lib/platform/queries.ts`):** Epoche `0` als SQL-Literal in der
  `coalesce`-Query; Spalten-bewusstes `gte(events.startsAt, now)` für die
  Event-Query (drizzle mappt `Date` → Integer-ms). Keine Migration, keine
  Datenänderung, kein Schema-Eingriff.
- **Regressionstest:** `tests/integration/for-you-d1.test.ts` führt
  `forYouItems()` gegen eine **echte D1** (workerd/Miniflare, provisioniert
  mit den realen Migrationsdateien) aus und deckt den Ungelesen-/Event-Pfad
  ab. Negativ-Nachweis: ohne den Fix schlagen 5 von 6 Tests mit genau
  `D1_TYPE_ERROR` fehl.
- **Leitplanke:** nie `Date`/Objekte direkt in `sql`` ``-Fragmente
  interpolieren – immer Spalten-APIs (`gt`/`gte`/…) oder Millisekunden-Ints.

### K-02 · Keine SMS-Verifizierung (Twilio)

- **Symptom:** Der Telefon-Kanal kann keinen Code zustellen.
- **Ursache:** `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`
  fehlen.
- **Priorität im Alltag:** niedriger als K-01 (E-Mail genügt zum Start).

## P1 – wichtig vor dem Launch

### K-03 · Jahrespreis: Marketing-Text und Code widersprechen sich — **ERLEDIGT (2026-09-21)**

- **Auflösung:** Gründerentscheidung: 24,99 €/Monat und 249,90 €/Jahr sind die
  kommunizierten Preise. `/membership`, die Homepage (`heroMembershipHint`,
  `MembershipBlock`) und `/app/billing` nennen durchgehend denselben Preis;
  der Jahresplan zeigt den Vorteil als „2 Monate geschenkt" (16 % Ersparnis).
  Die alten „Preis folgt"-Keys (`home.membershipAnnual*`) sind gelöscht.
- **Offen bleibt:**Stripe-Produkt/Preise sind noch nicht scharf geschaltet
  (see `12-roadmap.md`, S-1) – Checkout läuft aktuell über Dev-Aktivierung.

### K-04 · OAuth-Buttons führen ins Leere (404) — **BEHOBEN (Sprint 5)**

- **Symptom (historisch):** „Google"/„Apple" auf `/login` und `/register` waren
  als „Einrichtung erforderlich" gekennzeichnet, verlinkten aber auf
  `/api/auth/oauth/google` bzw. `/api/auth/oauth/apple` – diese Routen
  existieren nicht → 404. Der Button „Telefon" verlinkte auf
  `/login?method=phone` und bewirkte nichts.
- **Ursache:** UI-Vorbereitung (auth §B) ohne Backend.
- **Lösung (Sprint 5, 2026-09-21):** `ProviderButton` in
  `src/components/auth/AuthForms.tsx` rendert die drei Methoden jetzt als
  **echte deaktivierte Elemente** (`span` mit `cursor-not-allowed` +
  Badge „Einrichtung erforderlich") – kein Navigationsziel, kein 404,
  Aussehen unverändert. Die Implementierung der OAuth-Routen bleibt ein
  separater Auftrag.

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

- `npm run lint` meldet aktuell **13 Probleme**: 5 Fehler („setState in effect"
  in `SiteHeader`, `StatsSection` und `lib/auth/presence.ts`; „impure function
  during render" (`Date.now()`) in `app/events/page.tsx`; `module`-Zuweisung in
  `scripts/seed.ts`) und 8 Warnungen (ungenutzte Importe/Variablen).
- Verlauf: 21 (7 Fehler / 14 Warnungen) → 15 (5 / 10) → 14 (4 / 10) →
  **13 (5 / 8)**. Sprint 5 hat **keine** neuen Befunde eingeführt; die
  Mount-Prüfung der Auth-Formulare nutzt `useSyncExternalStore` statt eines
  Effekts, und zwei Warnungen wurden nebenbei beseitigt. Der `presence.ts`-
  Fehler war bereits vorher vorhanden (Dokumentation zählte ihn bislang nicht).
- **Wichtig:** Die verbleibenden Hinweise sind **vorbestehend** und betreffen
  Dateien, deren Verhalten eine eigene Prüfung braucht (Sichtbarkeit des
  Headers beim Scrollen, Zählanimation der Statistiken, Seed-Skript).

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
