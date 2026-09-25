# 11 – Known Issues

**Stand:** 2026-09-24 · Basis: Branch `arena/01a0d435-inner-circle`
(Basis `main` @ `8a1b5ea`, Sprint 12 – Private Beta). Sprint 12 schließt K-06
(Datenschutz-Einstellungen), ergänzt K-22 (Private Beta: bekannte Grenzen) und
K-23 (Layout-Klassen auf Profil/Einstellungen) und K-24 (CPU-Zeit der
Login-Aktion), aktualisiert K-15, K-19 und K-21. Davor: Sprint 11 ergänzte K-21 (Discovery-Demo: bekannte Grenzen). Hinweis: Sprint 8 hat einen
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

### K-06 · Datenschutz-Einstellungen werden nicht überall erzwungen — **BEHOBEN für das Networking (Sprint 12)**

- **War:** `profileVisibility`, `contactVisibility`, `performanceVisibility`
  wurden gespeichert, aber kaum ausgewertet.
- **Jetzt** (zentral in `src/lib/network/privacy.ts` +
  `src/lib/network/eligibility.ts`, Regeln in
  [`06-permissions.md`](06-permissions.md) §3d): `discoverable = false` →
  weder in Discover/Netzwerk noch als Profil für Fremde (404; sichtbar nur für
  Kontakte und bei offener Anfrage); `profileVisibility = connections/private`
  → Fremde sehen eine reduzierte Karte; Kontaktlinks (`contactVisibility`,
  Standard „nur Kontakte“) nur für Kontakte; `showLocation = false` → Standort
  verborgen und aus dem Standortfilter ausgenommen; Kennzahlen nur mit
  `performanceVisibility` + Recht `trustView`; `allowConnectionRequests =
  false` → keine Anfragen (neutraler Hinweis). Tests:
  `beta-grant.test.ts`, `beta-networking.test.ts`.
- **Rest (nicht Teil von Sprint 12, nicht geprüft):** Bereiche außerhalb des
  Networkings (z. B. Marketplace-Anbieter, Deals) werten die
  Profil-Sichtbarkeit nicht aus; Anbieternamen sind dort bestehendes,
  dokumentiertes Verhalten (K-21).

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

### K-10 · Keine Uploads (Cover, Kursvideos, Anhänge) – Profilfotos gelöst

- **Sprint 13:** Profilfoto-Upload ist **WORKING** (R2-Binding `MEDIA`,
  JPG/PNG/WebP, max. 5 MB, Magic-Byte-Prüfung in Browser und Server,
  Auslieferung über `/api/media/<key>` oder `R2_PUBLIC_BASE_URL`).
- Weiterhin offen: Cover, Kursvideos, Nachrichten-Anhänge sind URL-Felder
  ohne Upload.
- **Lösung (Rest):** denselben R2-Weg für die verbleibenden Medientypen
  nutzen (Key-Präfixe trennen, private Bereiche getrennt halten).

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

- `npm run lint` meldet aktuell **12 Probleme**: 5 Fehler („setState in effect"
  in `SiteHeader`, `StatsSection` und `lib/auth/presence.ts`; „impure function
  during render" (`Date.now()`) in `app/events/page.tsx`; `module`-Zuweisung in
  `scripts/seed.ts`) und 7 Warnungen (ungenutzte Importe/Variablen).
- **Sprint 12:** vor dem Sprint gemessen **14 (5 / 9)** (die Doku zählte
  zuletzt 13), nach dem Sprint **12 (5 / 7)** – zwei ungenutzte Variablen in
  `actions/network.ts` und `api/webhooks/stripe/route.ts` entfernt, **kein**
  neuer Befund (Abgleich pro Datei/Regel gegen die Baseline).
- Verlauf: 21 (7 Fehler / 14 Warnungen) → 15 (5 / 10) → 14 (4 / 10) →
  13 (5 / 8) → 14 (5 / 9) → **12 (5 / 7)**. Sprint 5 hat **keine** neuen Befunde eingeführt; die
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

### K-19 · Browser-Test in der Sandbox nur mit Zusatzaufwand

- Die offiziellen Playwright-Browser-Downloads sind in der Entwicklungsumgebung
  nicht erreichbar. Seit Sprint 11 gelingt die Prüfung mit einem headless
  Chromium-Build außerhalb des Repos (Screenshots 390/768/1440/1920, Dialog-
  Flows, Light/Dark, DE/EN); die Werkzeuge sind **nicht** Teil des Repos und
  laufen nicht in `npm test`. Gesten (Swipe) und Fokus-Fallen bleiben manuelle
  Prüfung. QA-Liste: [`08-testing.md`](08-testing.md) → Testmatrix.
- **Sprint 12:** vollständiger Browser-Durchlauf mit sechs Testkonten gegen den
  echten Worker-Preview (workerd + lokale D1), Details in `08-testing.md` §3b.
  Das Skript liegt seit der zweiten Prüfrunde **im Repo**
  (`tests/e2e/sprint12-browser.mjs`, dazu `tests/e2e/cpu-profile.mjs`), weil
  eine Umgebungs-Rücksetzung die Werkzeuge in `/tmp` gelöscht hatte; nur die
  Browser-Pakete bleiben außerhalb des Projekts. **Sandbox-Artefakt:** Der headless Chromium hat keine
  Symbol-Ersatzschrift; Zeichen außerhalb des Inter-Latin-Subsets (z. B. „←“
  „→“ im Tastatur-Hinweis unter der Discover-Karte) erscheinen in den
  Screenshots als Kästchen. Echte Browser greifen auf Systemschriften zurück.
  Sichtbare Pfeile in Sprint-12-Oberflächen sind deshalb SVG-Icons bzw. „›“.
  Native Datumsfelder zeigen das Format der Browsersprache (Sandbox:
  `mm/dd/yyyy`).

### K-22 · Private Beta & Networking: bekannte Grenzen (Sprint 12)

**Abschlussprüfung 2026-09-24:** 82/82 Worker-Browserchecks. Session-Verlust
nach Onboarding nicht reproduziert (6 getrennte Konten mit Cookie-/Reload-
Nachweis); korrigiert wurde der Browser-Testaufbau, nicht Auth-Code.
Siehe `08-testing.md` und `SPRINT-12-FINAL-REPORT.md`. Lint-Baseline bleibt
unverändert rot (K-15). Lokaler Wrangler-SELECT brach in einem Zwischenlauf
ab; vollständiger Wiederholungslauf grün. Read-only-Static-Cache-/Broken-Pipe-
Meldungen im lokalen Preview bleiben beobachtet, nicht als Anwendungsfix gelöst.


- **Produktions-D1 noch ohne Migration `0002`:** nur lokal angewendet. Vor bzw.
  mit dem Deploy `npm run cf:release` (enthält
  `wrangler d1 migrations apply DB --remote`) ausführen – der neue Code
  erwartet `BetaInvite`, `BetaAccess` und `Conversation.directKey`.
- **CPU-Zeit nur lokal gemessen** (`08-testing.md` §3c): Sprint-12-Seiten
  43–68 ms im lokalen workerd, gleiche Größenordnung wie das vorbestehende
  Dashboard; Startphase 50 ms (Limit 1 s). Über dem Free-Limit von 10 ms →
  Workers Paid nötig (K-24). Auf Cloudflare-Hardware und unter Last nicht
  gemessen.
- **Aktive Kontakte können einem Tester nach Ablauf weiter schreiben:** der
  abgelaufene Tester liest die Nachricht, kann aber nicht antworten (Hinweis
  statt Eingabefeld). Gleiches, vorbestehendes Verhalten wie zwischen
  Mitgliedern und Free-Kontakten; eine Sperre würde auch zahlende Mitglieder
  einschränken und wurde deshalb **nicht** eingebaut. **Gründerentscheidung
  offen:** so lassen, dem Absender einen neutralen Hinweis zeigen oder das
  Schreiben an Konten ohne Netzwerkzugang sperren.
- **Kontaktliste nach Ablauf:** liegt in der Inbox (Anfragen → Kontakte);
  `/app/network` ist dann gesperrt (bzw. zeigt während der 48-h-Demo die Demo
  mit Ende-Hinweis). Die Sperrseite verlinkt „Zum Posteingang“.
- **E-Mail-Benachrichtigungen** bei neuer Anfrage/Nachricht: **BLOCKED** –
  nur In-App (Inbox-Badge, Anfrage-Hinweis); braucht produktiven Mailversand
  (K-01) und eine Opt-in-Einstellung.
- **Profilfoto-Upload: NOT IMPLEMENTED** (K-10) – nur Bild-URL; ohne Foto
  zeigen Discover/Profil ruhige Initialen.
- **Kein Echtzeit-Transport:** Chat pollt alle 10 s, Badges aktualisieren
  sich bei Navigation. Bewusst (Auftrag: kein fragiles Realtime).
- **`AUTH_SECRET` rotieren entwertet alle noch nicht eingelösten
  Beta-Schlüssel** (gespeichert als HMAC mit diesem Secret). Laufende
  Beta-Zugänge sind nicht betroffen; offene Schlüssel neu ausstellen.
- **Rate-Limiter nicht atomar** (Lesen-dann-Schreiben): bei sehr vielen
  parallelen Versuchen sind einzelne Versuche über dem Limit möglich; bei
  80 Bit Schlüsselentropie praktisch ohne Wirkung. Das Einlösen selbst ist
  race-sicher (bedingtes `UPDATE … RETURNING`).
- **Alt-Chats** (vor Sprint 12) erhalten `directKey` erst beim ersten Öffnen;
  vorhandene Duplikate eines Paares werden nicht zusammengeführt (neue
  Duplikate sind ausgeschlossen, Unique-Index).
- **Skalierung:** Discover bewertet die 150 neuesten geeigneten Kandidaten,
  das Verzeichnis zeigt bis zu 60 – ausreichend für 10–30 Tester, für größere
  Communities ist Paginierung nötig.
- **Beta endet während der 48-h-Demo:** der Nutzer sieht wieder die
  Discovery-Demo **plus** Ende-Hinweis (gewollt; echte Mitglieder bleiben
  gesperrt).
- **Vorbestehend, nicht Teil von Sprint 12:** feste deutsche Kennzahl-Labels auf
  `/admin` (`src/app/admin/page.tsx`), `toLocale…("de-DE")` in älteren Seiten
  (Billing, Karte, Events – in EN deutsches Datumsformat, möglicher
  Hydration-Unterschied), gemischter Text `forYouDiscover` („Passende
  Connections in Discover“), Demo-Status dreifach im Demo-Dashboard (K-21).
- **Stripe:** siehe [`04-auth-membership.md`](04-auth-membership.md) §4a –
  Code geprüft und korrigiert, produktiv **BLOCKED** bis Schlüssel, Webhook
  und Testkauf vorliegen; Kundenportal PREPARED.

### K-23 · `lg:`-Spalten auf Profil und Einstellungen greifen nicht (vorbestehend)

- **Ursache:** `.ic-grid`/`.ic-span-*` stehen in `src/app/globals.css`
  außerhalb der Tailwind-Layer und überschreiben daher responsive Klassen wie
  `lg:col-span-5` (gleiche Spezifität, spätere Kaskade).
- **Wirkung:** `/app/profile` und `/app/settings` stapeln ihre Spalten auch
  auf dem Desktop (funktional korrekt, nur breiter als beabsichtigt). Für die
  Discover-Karte in Sprint 12 behoben (`col-span-12 lg:col-span-*`, siehe
  `10-design-freeze.md` §1.17).
- **Lösung:** dieselbe Umstellung auf den beiden Seiten oder die `.ic-*`-Regeln
  in `@layer components` verschieben (wirkt global → eigener, geprüfter
  Auftrag).

### K-24 · Login: hohe CPU-Zeit pro Anmeldung (vorbestehend)

- **Befund (Sprint 12 gemessen):** Ein Login inkl. Aufbau von `/app` kostet im
  lokalen workerd **~620–660 ms CPU** (vier Messungen); ein Seitenaufruf von
  `/app` allein ~53 ms. Im Profil sind **~47–56 ms eindeutig scrypt**
  zugeordnet (`src/lib/auth/crypto.ts`, N=16384, r=8, p=1). Ein wiederkehrender
  Block von **~195 ms** wird je Lauf einer anderen Funktion zugeschrieben
  (`getCwd`, `OpenNextNodeResponse`) – typisch für native Ausführung, die der
  Sampling-Profiler nicht exakt zuordnet; wahrscheinlich ebenfalls das native
  scrypt, **nicht bewiesen**. Registrierung und Passwort-Reset hashen ebenso
  (nicht einzeln gemessen).
- **Wirkung:** weit über dem **Free-Limit (10 ms CPU pro Request)**, deutlich
  unter dem **Paid-Standard (30 s)**. Mit Workers Paid unkritisch; auf dem
  Free-Plan drohen `Error 1102 – Worker exceeded resource limits` bei Login
  und Registrierung.
- **Lösung:** Workers Paid bestätigen (Gründer, Dashboard). Optional später:
  genaue Zuordnung mit einem Profil auf Cloudflare (DevTools/Workers Logs),
  danach ggf. Hash-Parameter prüfen (Hashes sind selbstbeschreibend
  `scrypt$N$r$p$…` und damit migrierbar) – nicht Teil von Sprint 12.

### K-21 · Discovery-Demo: bekannte Grenzen (Sprint 11)

- **Echte Zahlung nicht testbar:** ohne Stripe-Schlüssel ist der Weg
  Zustand 5 → 6 (Demo abgelaufen → bestätigte Mitgliedschaft) nur über den
  Membership-Service (Tests) bzw. die lokale Dev-Aktivierung nachgestellt;
  `/app/billing` zeigt das ehrlich („Zahlung noch nicht freigeschaltet“).
- **Marketplace-Liste** bleibt – wie vor Sprint 11 – für Free/Demo lesbar und
  nennt Anbieter (Firma/Name) der Listings; das ist bestehendes, dokumentiertes
  Verhalten (`06-permissions.md`), keine geschützte Geschäftsinformation.
  Falls die Gründer das ändern wollen: eigener Auftrag.
- **Netzwerk-Ergänzung für Mitglieder (Sprint 7)** ist seit **Sprint 12
  entfernt**: das echte Netzwerk zeigt nur echte, sichtbare Mitglieder und
  sonst den ehrlichen Leerzustand. `networkDemoSupplement()` und
  `matchPercentFromScore()` sind als DEPRECATED markiert (nicht mehr
  aufgerufen, Tests bleiben bis zum Aufräumen).
- **Trial-Kontaktanfragen-Zähler** (`registerTrialConnectionRequest`,
  `TRIAL_CONNECTION_LIMIT`) wird von keiner Action mehr verwendet; Service und
  Tests bleiben bewusst erhalten (Datenmodell unverändert). Aufräumen erst mit
  einer Schema-Entscheidung.
- **Dashboard zeigt den Demo-Status dreifach** (Seitenleiste mit Countdown,
  Kopfzeilen-Chip, Badge neben der Begrüßung) – vorbestehende Elemente der
  `AppShell`/`DashboardScreen`, in Sprint 11 nur umbenannt; Reduktion wäre eine
  Gestaltungsentscheidung (Design Freeze).
