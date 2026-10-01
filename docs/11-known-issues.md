# 11 – Known Issues

**Stand:** 2026-09-30 (Sprint 18: Post-Bilder, Inbox-Lesestatus,
Beta-/Trial-Präzedenz) · davor `main` @ `98814bc` (Sprint 17 –
Stripe-Sandbox-Billing, Profil-/Opportunity-UX). Sprint 18 schließt den
Post-Bild-Upload einschließlich serverseitiger Sichtbarkeitsprüfung und den
Inbox-Lesestatus-Race; Beta-/Trial-Präzedenz ist durch Regressionstests
abgesichert. Die gezielte authentifizierte Browser-Abnahme lief gegen den
lokalen Worker **101/101**; ein echter externer Stripe-Testmodus-Durchlauf und
die visuelle Abnahme anderer Oberflächen bleiben offen. Davor: Sprint 16 schließt
**K-08 teilweise** (verifizierte Bewertungen, serverseitige Verifikation,
Missbrauchsschutz, Score-Berechnung, Detailansicht, Listen-Integration,
Admin-Moderation), ergänzt **K-27** (Event-Teilnahme technisch nicht
nachweisbar → kein Event-Kontext im Trust) und aktualisiert K-15 sowie K-08 in
[`12-roadmap.md`](12-roadmap.md). Vorheriger Stand 2026-09-27: Branch
`arena/01a0e2ea-inner-circle` (Basis `main` @ `530be5f`, Sprint 15) – Sprint 15
schließt **K-01** (eigene
Absenderdomain `innercirclevp.com` bei Resend verifiziert, `EMAIL_FROM` gesetzt;
DNS-/Domainwechsel der Website bewusst offen, `09-deployment.md` §7a) und
behebt den Root Cause der Passwort-Reset-Weiterleitungsmeldung (absoluter
HTTPS-Link in der Mail, `04-auth-membership.md` §2.5).
Vorheriger Stand 2026-09-24: Branch `arena/01a0d435-inner-circle`
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

### K-01 · E-Mail-Zustellung im Spam-Ordner (Test-Domain `resend.dev`) — **ERLEDIGT (Sprint 15)**

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
  - **2026-09-27 (Inbox-Feinschliff):** Verifizierungs-Betreff ohne Code
    (DE „Dein Bestätigungscode für INNER CIRCLE“ / EN „Your INNER CIRCLE
    verification code“), rein transaktionaler Inhalt ohne Slogan/Links/Bilder,
    optionaler dedizierter Absender `EMAIL_FROM_VERIFICATION` (Empfehlung
    `verify@innercirclevp.com`, da Resend `no-reply` beanstandet), keine
    Tracking-Header im Versand; Resend-Cooldown bleibt 60 s (Client-Countdown
    + serverseitiges Limit). Restliche Gmail-Platzierung: siehe K-25.
- **Erledigt (Stand Sprint 15):** Die Domain **`innercirclevp.com` ist bei Resend
  verifiziert** (SPF/DKIM/DMARC von Resend verwaltet) und
  `EMAIL_FROM="INNER CIRCLE <noreply@innercirclevp.com>"` ist gesetzt – die
  geteilte Test-Domain wird nicht mehr verwendet. Bewusst **nicht** Teil dieses
  Sprints: der DNS-/Namensserverwechsel für die Website (siehe `09-deployment.md`
  §7a); die Domain dient aktuell nur dem Versand.

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

- **Auflösung:** Gründerentscheidung: 24,99 €/Monat und 249,99 €/Jahr sind die
  kommunizierten Preise. `/membership`, die Homepage (`heroMembershipHint`,
  `MembershipBlock`) und `/app/billing` nennen durchgehend denselben Preis;
  der Jahresplan zeigt den Vorteil als „2 Monate geschenkt" (16 % Ersparnis).
  Die alten „Preis folgt"-Keys (`home.membershipAnnual*`) sind gelöscht.
- **Offen bleibt:** Ein echter Stripe-Testmodus-Durchlauf gegen den freigegebenen
  Worker (Checkout, Folgezahlung, Kündigung und Portal) sowie das Setzen der
  Sandbox-Variablen durch die zuständige Person. Der Codepfad ist implementiert;
  Live-Stripe bleibt ausdrücklich außerhalb des Scopes.

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

### K-08 · Trust-System ohne Erfassung — **TEILWEISE BEHOBEN (Sprint 16)**

- **Symptom (offen):** eine Bewertung ist nur möglich, wenn zwischen zwei
  Mitgliedern eine *technisch nachweisbare* Plattform-Interaktion existiert.
  Im Datenmodell sind das aktuell drei Kontexte: abgeschlossene Opportunity
  (`OpportunityApplication.status = 'accepted'`), abgeschlossene Kurs-/
  Leistungsbuchung (`Enrollment.completedAt`) und Investment-Interaktion
  (`InvestmentInterest`). Eine bestätigte Verbindung allein reicht bewusst
  **nicht**, und eine Event-Interaktion ist noch nicht nachweisbar, weil
  `EventApplication` keinen Attendance-Status erhält (siehe K-27).
- **Behoben:** Erfassung, serverseitige Verifikation, Missbrauchsschutz,
  Score-Berechnung, Detailansicht, Listen-Integration und Admin-Moderation
  (`src/lib/trust/*`, `src/app/actions/trust.ts`, `/admin/reviews`).
- **Lösung (Rest):** Attendance je Event technisch erfassen, dann
  `event` als vierten Kontext in `src/lib/trust/contexts.ts` ergänzen.

### K-27 · Event-Teilnahme ist nicht nachweisbar

- **Symptom:** `EventApplication.status` verlässt `applied`/`canceled` nie;
  ein „dabei gewesen" existiert nicht in den Daten, deshalb ist eine
  Event-Bewertung nicht verifizierbar.
- **Risiko:** gering – Events sind im Trust-Bereich (Sprint 16) bewusst
  ausgeschlossen, es wird nichts erfunden.
- **Lösung:** Check-in/Attendance in der Event-Verwaltung ergänzen und
  `event` als Kontexttyp nachziehen.

### K-28 · Deal-Bedingungen und Deal-Fee sind rechtlich noch nicht geprüft

- **Symptom:** Die auf `/business-deals` und im Plattform-Schritt sichtbaren
  **Deal-Bedingungen sind Produkttext, kein geprüfter Vertrag**. Sie sind bewusst
  knapp und enthalten **bewusst keine** Vertragsstrafen, keine Schadensersatzregelung
  und keine steuerliche oder haftungsrechtliche Aussage.
- **Risiko:** mittel – die Plattform-Fee ist derzeit **reine Kommunikation**. Sie
  wird berechnet (`calculateDealFee()`), angezeigt und mit Versionsstempel
  dokumentiert, aber **nicht eingezogen**. Es fließt kein Geld.
- **Lösung:** juristische Prüfung der Formulierung, Prüfung der Bemessungsbasis,
  Steuerberatung, Entscheidung über die Ausschüttung. Bis dahin keine
  Aktivierung mit realen Geldflüssen. Keine Buchhaltung implementiert, keine
  Auszahlung programmiert.

### K-29 · Investment Pool und Impact sind Zielsetzungen, keine Programme

- **Symptom:** Der Investment Pool existiert **nicht als Fonds** – keine
  investierten Mittel, kein AUM, keine Positionen, keine Rendite. `/app/investments`
  zeigt deshalb **gleich große Struktursegmente ohne Prozentangabe**, statt eine
  scheinbar exakte Allokation zu suggerieren.
- **Risiko:** gering – die Darstellung ist durchgehend als „Geplantes Modell"
  gekennzeichnet und enthält keine Zahl.
- **Lösung:** Datenquelle austauschen, sobald echte Investments vorliegen; bis dahin
  bewusst leer. Die Impact-Aussage („5 % unserer Gewinne") ist eine **Zielsetzung** –
  Stiftung/gemeinnützige Struktur sind **nicht** gegründet und **nicht** rechtlich
  geprüft, die Bemessungsbasis „Gewinn" steht nicht fest. Die Website behauptet
  ausdrücklich **nicht**, dass bereits gespendet werde.

### K-30 · Browser-Abdeckung anderer Oberflächen weiterhin offen

- **Stand 2026-09-30:** Ein echter lokaler Worker-Browserlauf ist jetzt für
  Beta A–G, Zwei-Konten-Unread, JPG/PNG/WebP-Postbilder und 390-px-Inbox/
  Conversation/Post/Profile dokumentiert und bestanden (101/101):
  `tests/e2e/sprint18-private-beta-browser.mjs`. Das löst die gezielten
  Abnahmepunkte, ist aber keine allgemeine Screenshot-/Pixel-Abnahme.
- **Noch offen:** Deal-Fee-Staffel, Deal-Bedingungen, Investment-Pool-Ring und
  Deal-Bestätigung in Light/Dark und bei 320 px visuell im Browser prüfen.
  Komponentenabdeckung besteht (`deal-views.test.tsx`); reale Mobilgeräte und
  ein Gerätefarm-Durchlauf wurden nicht verwendet.

### K-09 · Ungeprüfte Rechtstexte

- **Symptom:** `/imprint`, `/privacy`, `/terms` sind Platzhalter.
- **Risiko:** kein öffentlicher Start ohne geprüfte Rechtstexte.
- **Lösung:** Rechtsberatung (siehe [`12-roadmap.md`](12-roadmap.md) → LEGAL).
- **Stand 2026-10-01 (Launch-Copy-Cleanup) – weiterhin offen, bewusst nicht erfunden:**
  - `/imprint`, `/privacy`, `/terms`: Platzhalterseiten (`LegalPage`), kein echter Inhalt.
  - **Kontakt:** Der Footer-Link zeigt auf `mailto:hello@inner-circle.example` mit dem Zusatz
    „(Platzhalter bis zum Launch)“ (`SiteFooter.tsx`, `footer.contactNote`). Eine echte Adresse
    muss der Betreiber vorgeben.
  - **Investments:** `/investments` enthält einen Rechtshinweis („Rechtlicher Rahmen und
    Prüfprozesse werden vor dem Launch finalisiert“, `pages.investments`). Formulierung und
    Freigabe liegen beim Betreiber bzw. der Rechtsberatung.
  - Footer-Link „Design-System (intern)“ (`/design`) und der Bildhinweis „Stimmungsbild ·
    vorläufiger Platzhalter“ (`common.imageNote`) sind Produktentscheidungen, nicht geändert.

### K-31 · Zahlung: Stripe nur im Testmodus, Live ist im Code gesperrt

- **Symptom:** Checkout, Customer-Portal und signierter Webhook sind implementiert
  (`/api/billing/checkout`, `/api/billing/portal`, `/api/webhooks/stripe`), laufen aber
  ausschließlich mit `sk_test_`-Schlüsseln: `getStripe()` liefert für `sk_live_` `null`, die
  Checkout-Route verlangt `!liveMode` (`src/lib/payments/stripe.ts`, `src/lib/env.ts`).
  Ohne vollständige Konfiguration (Secret, beide Price-IDs, Webhook-Secret) antwortet die Route
  mit `?error=stripeNotConfigured`. Echte Zahlungen sind damit nicht möglich.
- **Konsequenz für die Copy:** Die Aussage „Die Zahlungsfunktion ist noch nicht aktiv“ auf
  `/membership` (`pages.membership.payNote`, `membershipFootnote`, FAQ) bleibt korrekt und wurde
  nicht geändert.
- **Offen bis zur Aktivierung:** (1) bewusste Code-/Konfigurationsentscheidung für Live-Keys,
  (2) Live-Preise und Webhook-Endpoint im Stripe-Dashboard, (3) der noch ausstehende echte
  externe Testmodus-Durchlauf (siehe K-30/Sprint 18), (4) geprüfte AGB/Widerrufsbelehrung (K-09).
  Danach die Texte auf `/membership` anpassen.

### K-25 · Gmail-Inbox-Platzierung der Verifizierungs-Mail — **OFFEN (Beobachtung)**

- **Symptom (produktiv, Stand 2026-09-27):** Resend markiert gesendete
  Verifizierungs-Mails an Gmail-Adressen als **Delivered**, und dieselbe
  Adresse erhält die Passwort-Reset-Mail sichtbar im Postfach – die
  Verifizierungs-Mail taucht in Gmail jedoch weder im Postfach noch bei Suche
  mit `in:anywhere` auf. Der Code funktioniert (aus dem Resend-Log kopierbar),
  Registrierung/Verifizierung sind also nicht blockiert; betroffen ist die
  Sichtbarkeit beim Endnutzer.
- **Eingrenzung:** Kein Auth-, DNS- oder Code-Problem (DKIM/Sending-Records
  verified, Versand über `innercirclevp.com`). Es wirkt eine
  nachgelagerte Gmail-Seite (Klassifizierung/Filter), die vom Mailinhalt
  mitgesteuert wird – nicht vom Verify-Flow.
- **Im Code umgesetzt (2026-09-27):** Betreff ohne sechsstelligen Code,
  schlanker rein transaktionaler Inhalt (HTML+Text, große Code-Darstellung,
  Ablaufzeit, Ignore-Hinweis, keine Links/Bilder/Marketingzeilen),
  kein Open-/Click-Tracking im API-Aufruf, optionaler Absender
  `EMAIL_FROM_VERIFICATION` (Empfehlung `INNER CIRCLE <verify@innercirclevp.com>`,
  da Resend Insights `no-reply` beanstanden), Resend-Cooldown unverändert.
- **Offen/nicht testbar hier:** echtes Inbox-Placement (Zustellung im
  Postfach eines echten Gmail-Kontos) ist in der Arena-Sandbox nicht prüfbar
  (K-19) – nach dem Setzen von `EMAIL_FROM_VERIFICATION` (Deployment-Var,
  keine DNS-Änderung) manuell mit frischem Gmail-Konto verifizieren. Sollte
  Gmail die Mail weiterhin verstecken: Postmaster-Tools-Daten der Domain und
  Resend-Logs (Anzahl/Einwilligungen) prüfen; inhaltlich ist kein weiterer
  Hebel im Code bekannt.

### K-26 · Kein systemweit installiertes Chromium — **TEILWEISE ENTSCHÄRFT**

- **Ursache bleibt:** In der Arena-Sandbox schlägt `npx playwright install
  chromium` beim CDN-Download weiterhin mit `ECONNRESET` fehl; es gibt keine
  systemweite Chrome-/Chromium-Installation und kein Browserpaket als
  Repo-Dependency.
- **Nachtrag 2026-09-30:** Ein isolierter Workaround mit externem
  `@sparticuz/chromium` + `playwright-core` in `/tmp/pw` funktioniert. Damit
  lief der echte lokale Worker-Browser-Test
  `tests/e2e/sprint18-private-beta-browser.mjs` **101/101**. Die Abnahme
  begrenzt `BASE_URL` auf `localhost:8787`/`127.0.0.1:8787` und nutzt lokale
  Wrangler-D1/R2-Befehle.
- **Grenze:** Das behebt weder allgemeine Screenshots/Pixelvergleiche noch
  Browser-QA aller Seiten; übrige Lücken stehen in K-30. Die benötigten
  Browsermodule sind temporär und nicht Teil der Repo-Dependencies.

### K-32 · Funktions-QA Kernplattform (2026-10-01): bewusst offene Beobachtungen

Beim lokalen Browser-Durchlauf (Navigation, Profil/Netzwerk, Inbox, Posts,
Marketplace, Events, Chancen/Jobs/Investments, Auth, Mobile) sind die echten
Fehler behoben (Formular-Reset nach Serverfehlern, rohe Status-/Enum-Werte,
`{minutes}`/`{count}`-Platzhalter, tote Demo-Profil-Links, abweichende
Profilvollständigkeit). Offen und absichtlich nicht angefasst:

- **Deep-Link nach Login:** `requireUser("/app")` im `(app)`-Layout setzt `next`
  immer auf `/app`; ein Deep-Link (z. B. aus einer Benachrichtigung) landet nach
  dem Login auf der Startseite. Ein genauer Rücksprung bräuchte Pfad-Zugriff
  (Middleware) und damit eine Änderung der Auth-Architektur.
- **Demo-Chancen/-Investments:** Auf den Detailseiten ist „Interesse senden“ /
  „Interesse bekunden“ auch für Demo-Datensätze möglich und schreibt einen echten
  Datensatz samt Admin-Benachrichtigung. Das ist eine Produktentscheidung
  (sperren oder zulassen), keine reine Fehlerkorrektur.
- **Generische Validierungsfehler:** Marketplace- und Investment-Formulare melden
  zu kurze Texte nur mit „Bitte prüfe deine Eingaben.“ (Mindestlängen: Titel 6,
  Kurzfassung 20, Beschreibung 40 bzw. 60 Zeichen); Chancen zeigen feldgenaue
  Hinweise. Ungültige optionale Beträge werden stillschweigend ignoriert.
- **Nach dem Posten** landet das Mitglied auf `/app?posted=1` (Startseite ohne
  Bestätigung); der Beitrag erscheint im Profil. Die E2E-Spezifikation erwartet
  diese URL.
- **Kleinigkeiten:** `/login` zeigt eingeloggten Nutzern weiterhin das Formular;
  die „Konto existiert bereits“-Meldung erscheint doppelt; ein Filter ohne
  Treffer im Marketplace zeigt den Leerzustand „Noch keine Angebote
  veröffentlicht“; Datumsformat in Events uneinheitlich (seit K-33-Sprint behoben); „Meine Chancen“ verlinkt auf beendete Chancen (404 für
  Nicht-Eigentümer).

## P2 – mittelfristig

### K-10 · Weitere Medientypen ohne Upload – Profil- und Post-Bilder gelöst

- **Sprint 13:** Profilfoto-Upload ist **WORKING** (R2-Binding `MEDIA`,
  JPG/PNG/WebP, max. 5 MB, Magic-Byte-Prüfung in Browser und Server,
  Auslieferung über `/api/media/<key>` oder `R2_PUBLIC_BASE_URL`).
- **Sprint 18:** Post-Bild-Upload ist ebenfalls **WORKING**: gleicher R2-Bucket,
  eigenes `posts/<userId>/`-Präfix, JPG/PNG/WebP bis 5 MB, Server-Magic-Byte-
  und Größenprüfung, URL-only in `Post.imageUrl`, streng allowlisted
  `/api/media`-Auslieferung. Die Route prüft eine vorhandene Post-Zeile,
  Beitrags-Sichtbarkeit, Verbindung und Blockierungen erneut; Post-Bilder
  werden `private, no-store` ausgeliefert (Avatar-Cache unverändert). Profil-
  Ansicht und Bereinigung prüfen Autor/Eigentum; direkte relative
  `/api/media/posts/...`-Referenzen auf fremde Autoren-Präfixe werden
  abgewiesen.
- Weiterhin offen: Cover, Kursvideos und Nachrichten-Anhänge sind URL-Felder
  ohne Upload.
- **Lösung (Rest):** denselben R2-Weg für verbleibende Medientypen nutzen
  (Key-Präfixe trennen, private Bereiche getrennt halten).

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

### K-15 · Lint nicht fehlerfrei (vorbestehend) – **BEHOBEN (2026-10-01)**

- **Stand 2026-10-01:** `npm run lint` meldet **0 Fehler / 0 Warnungen**. Behoben
  ohne Regel-Deaktivierung und ohne `eslint-disable`: `SiteHeader` (Menü ist für
  einen Pfad geöffnet, schließt bei Navigation ohne Effekt), `StatsSection`
  (Reduced-Motion über `useSyncExternalStore`, zeigt sofort den Endwert),
  `lib/auth/presence.ts` (`useSyncExternalStore`, Server-Snapshot = Besucher),
  `app/events/page.tsx` (Zeitfilter in Modul-Funktion außerhalb des Renderns),
  `scripts/seed.ts` (`module` → `courseModule`) sowie sechs ungenutzte
  Importe/Variablen. Der folgende Verlauf ist historisch.

- `npm run lint` meldet aktuell **11 Probleme**: 5 Fehler („setState in effect"
  in `SiteHeader`, `StatsSection` und `lib/auth/presence.ts`; „impure function
  during render" (`Date.now()`) in `app/events/page.tsx`; `module`-Zuweisung in
  `scripts/seed.ts`) und 6 Warnungen (ungenutzte Importe/Variablen).
- **Sprint 16:** Baseline vor dem Sprint **11 (5 / 6)**, nach dem Sprint
  **11 (5 / 6)** – die zwei zunächst neuen Warnungen (ungenutzter
  `RatingStars`-Import und die nicht mehr benötigte `score`-Variable in
  `app/people/[handle]/page.tsx`) wurden entfernt, **kein** neuer Befund.
- **Deal-Fee-Sprint (2026-09-29):** Baseline **11 (5 / 6)**, Endstand
  **11 (5 / 6)** – fünf zunächst neue Warnungen (ungenutzter `dealRecords`-Import,
  ungenutzter `_kind`-Parameter, zwei ungenutzte Variablen in den neuen Tests)
  wurden entfernt. Der synchron exportierte Helfer `quoteDealFeeForForm` wurde
  ganz gestrichen (Next.js verbietet Nicht-`async`-Exporte in `"use server"`-Dateien).
- **Konsolidierungs-Sprint (2026-09-28):** Baseline **11 (5 / 6)**, Endstand
  **11 (5 / 6)** – zwischenzeitlich aufgetretene neue Befunde (`prefer-const`
  in `membership/service.ts`, ungenutzter Import in `admin/users/page.tsx`,
  Impurity-Fehler `Date.now()` beim Rendern in `admin/users/page.tsx`,
  Destrukturierungs-Warnungen im Profiltest) wurden korrigiert bzw. durch
  serverseitige Helper (`betaIsActive`, `membershipRowIsActive`) vermieden,
  **kein** neuer Befund.
- **Sprint 12:** vor dem Sprint gemessen **14 (5 / 9)** (die Doku zählte
  zuletzt 13), nach dem Sprint **12 (5 / 7)** – zwei ungenutzte Variablen in
  `actions/network.ts` und `api/webhooks/stripe/route.ts` entfernt, **kein**
  neuer Befund (Abgleich pro Datei/Regel gegen die Baseline).
- Verlauf: 21 (7 Fehler / 14 Warnungen) → 15 (5 / 10) → 14 (4 / 10) →
  13 (5 / 8) → 14 (5 / 9) → 12 (5 / 7) → **11 (5 / 6)**. Sprint 5 hat **keine** neuen Befunde eingeführt; die
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


- **Sprint 18 – Beta-/Trial-Präzedenz und Plattformrechte:** Worker-Browser-
  Abnahme A–G **101/101** plus Integrationstests bestätigen: Trial ohne Beta
  bleibt Demo, aktives Beta ersetzt die Demo auch nach Trial-Ablauf durch echte
  ausgewählte Plattformbereiche, und abgelaufenes Beta fällt auch bei sonst
  aktivem Trial auf Free zurück. Beta-Tester erhalten keine Membership-,
  Payment- oder Admin-Rechte; aktive Membership/Admin bleiben vorrangig.
  Browsing/Connect/Follow/Feed/Posts und ausdrücklich freigegebene Opportunity-,
  Marketplace- und Investment-Bereiche wurden browserseitig geprüft; Seller-,
  Deal-Management-, Paid-Course-, Investment-Einreichungs- und Event-
  Anmelderechte blieben gesperrt. Membership war eine lokale Test-Fixture,
  keine Stripe-Zahlung. Der Report stammt ausschließlich aus isolierter
  lokaler D1/R2; Produktions-D1 blieb unberührt.
- **Produktions-D1 wurde in dieser Session nicht abgefragt oder verändert.**
  Die notwendige Lesestatus-Migration `0006` ist lokal gegen workerd-D1
  getestet; der Produktions-Migrationsstand ist damit nicht verifiziert. Vor
  einem späteren Deploy die ausstehende Migration prüfen und nur im
  freigegebenen Release-Prozess anwenden.
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
- Profil- und Post-Bild-Uploads sind seit Sprint 13/18 **WORKING** (K-10);
  übrig bleiben Cover-, Kursvideo- und Nachrichten-Anhang-Uploads.
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
  Sandbox-Code inkl. Checkout, sechs Webhook-Ereignissen, Idempotenz,
  Lifecycle-Reconciliation und Kundenportal ist implementiert. Offen bleibt
  nur der echte Testmodus-Durchlauf gegen den Worker; keine Live-Konfiguration.

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

- **Echter Provider-Durchlauf offen:** Der Weg Zustand 5 → 6 (Demo abgelaufen
  → bestätigte Mitgliedschaft) ist lokal über Service-/Webhook-Tests abgedeckt.
  Ein echter Stripe-Testmodus-Durchlauf gegen den Worker ist in dieser Umgebung
  wegen fehlender externer Sandbox-Konfiguration noch nicht erfolgt;
  `/app/billing` bleibt ohne diese Variablen ehrlich gesperrt.
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

### K-33 · Locale-/Zeitzonen-Sprint (2026-10-01): bewusst offene Punkte

Behoben: Event-Zeit ohne Zeitzone, harte `de-DE`-/`"de"`-Formate im App-Bereich,
rohe Labels auf `/app/card`, doppelter Investment-Disclaimer, deutsche
`/portfolio`-Platzhalter, fehlende App-404/-Error-Seiten. Offen und absichtlich
nicht angefasst:

- **Serverseitige Label-Auswahl über `user.locale`:** Interessen-, Ziel- und
  Reputations-Labels (`interestLabelsFor`, `goalLabelsFor`, `reputationBadgesFor`,
  `ProfileBadgeCluster`-Props) sowie Datenlabels in `queries.ts` folgen dem
  Registrierungs-Locale, nicht dem Live-Umschalter. Die Sprache liegt nur
  clientseitig (`localStorage`); eine Lösung braucht ein Locale-Cookie und damit
  eine Architekturänderung.
- **Event-Zeitzone:** `events` hat keine Zeitzonenspalte; alle Zeiten erscheinen
  in `APP_TIME_ZONE` (Europe/Berlin). Für Events außerhalb dieser Zone wäre eine
  Schemaänderung nötig (Migration, nicht Teil des Sprints).
- **Admin-Seiten, `DevOutboxList`:** unverändert (intern, deutsch).
- **Statische deutsche `<title>`** auf EN-Seiten und deutsches Alt-Attribut in
  `HomeContent.tsx` (Audit 5).
- **Demo-Profil-Inhalte** (`people/demo/[key]`) und Datenlabels folgen weiterhin
  `user.locale` (siehe erster Punkt); die Seite hat selbst keine `aria-label`.
- **Englische Produktbegriffe als `aria-label`** (`Investments`, `Investment
  Opportunities`, `INNER CIRCLE Investment Pool`, `Events`, `Inbox`, `Academy`)
  sind in beiden Sprachen gleich und bleiben bewusst.
- **`/app?trial=…`, `?denied=admin`, `?admin=1`:** weiterhin ohne sichtbaren
  Hinweis (nachrangig, Wortlaut zur Trial-Sperre wäre eine Produktentscheidung).
- **404-Darstellung:** `notFound()` in dynamischen App-Seiten liefert in Next
  einen Streaming-404 (Status 404, Body wird nach der Hydration clientseitig
  gerendert). Das war schon vor K-33 so (Baseline `3fd1f10` verglichen) und ist
  kein Folgefehler der App-404. Unbekannte **öffentliche** URLs (z. B. `/xyz`)
  zeigen weiterhin die englische Framework-404 ohne Branding; eine Root-
  `not-found.tsx` wäre ein eigener Auftrag. Sichtprüfung im Browser steht aus.
