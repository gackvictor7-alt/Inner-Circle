# 10 – DESIGN FREEZE

## DESIGN STATUS: APPROVED / DO NOT REDESIGN WITHOUT EXPLICIT FOUNDER REQUEST

**Stand:** 2026-09-30 (zuletzt ergänzt: 1.23 Post-Bilder im bestehenden Profilstil) · Der aktuelle visuelle Stand des Projekts ist vom
Gründer freigegeben und **eingefroren**. Diese Datei schützt ihn.

Ein KI-Agent, eine Entwicklerin oder ein Dienstleister darf die unten
aufgeführten Bereiche **nur** verändern, wenn der Gründer **ausdrücklich eine
Designänderung beauftragt**. „Sieht besser aus", „moderner", „aufgeräumter",
„konsistenter" oder eine stillschweigende Anpassung im Rahmen eines
Feature-Auftrags sind **keine** gültigen Gründe.

---

## 1. Geschützte Bereiche (Änderung nur auf ausdrücklichen Auftrag)

### 1.1 Öffentliche Startseite

- Reihenfolge und Aufbau der Sektionen (Desktop): Hero → Säulen („Was dir
  ermöglicht wird") → Trust & Reputation → Events & Community → Membership →
  FAQ → CTA. Mobile gilt die kompakte Reihenfolge aus Abschnitt 1.12
  (Gründerauftrag Sprint 5).
- Hero-Bildsprache, Headline-Größe, Abstände, CTA-Anordnung.
- Kennzahlen-Sektion (`StatsSection`) inkl. Zähl-Animation und
  `reduced-motion`-Verhalten.
- Dateien: `src/app/(site)/page.tsx`, `src/app/(site)/HomeContent.tsx`,
  `src/components/site/StatsSection.tsx`, `src/components/site/blocks.tsx`.

### 1.2 Bildsprache

- **Ausdrücklicher Gründungsauftrag 2026-09-21:** die Public-Bilder wurden auf
  die neue Bildrichtung regenerated (`docs/13-decisions.md`, ADR-013) und sind
  ab jetzt **erneut eingefroren**: `hero-home.jpg` (unverändert), `network.jpg`,
  `business.jpg`, `investments.jpg`, `marketplace.jpg`, `membership.jpg`,
  `events-*.jpg`, `public/images/demo/*` (4 Bilder) und
  `public/images/avatars/avatar-1..7.jpg`.
- Uniformes Format: 1376×768 (16:9), JPEG `-sampling-factor 4:2:0 -strip
  -quality 78 -interlace Plane`, 39–202 KB pro Datei. Keine HDR-/Aufheller-
  Kurven – Helligkeit kommt aus dem Motiv, nicht aus der Nachbearbeitung.
- Bildausschnitte (`object-cover`, Seitenverhältnisse), Overlays und Captions
  bleiben unverändert; `hero.jpg` (OG-Preview) bleibt der bestehende Hero.

### 1.3 Farbwelt

- Tokens in `src/app/globals.css`: `midnight-*`, `paper-*`, `electric-*`,
  `forest-*`, `sand-*`, `success/danger/warning`, semantische Tokens
  (`--background`, `--foreground`, `--surface`, `--border`, `--ring`).
- Midnight Navy `#10151E`, Electric Blue `#366CF5`, Forest Green `#12805C`,
  Sand `#CBB694`, Off White `#F7F8FA` bleiben die Markenfarben.
- Kein Rückbau auf metallisches Gold/Champagner (bewusst entfernt).

### 1.4 Typografie

- Inter (self-hosted, `src/app/fonts/InterVariable.woff2`, SIL OFL 1.1) als
  einzige Schriftfamilie; keine Web-Font-CDNs.
- Größen-/Gewichts-/Tracking-Stufen der Überschriften und Fließtexte bleiben.

### 1.5 Navigation

- Struktur des öffentlichen Headers: Logo → `network`, `business-deals`,
  `investments`, `marketplace`, `events`, `membership` → Sprach-/Theme-Umschalter
  → Login/Registrierung bzw. „Zur App".
- Mobile Menü: Panel als Geschwister-Element des Headers (kein Zurückstellen in
  den `backdrop-blur`-Teilbaum), Scroll-Lock, Escape, Fokus-Handling.
- Footer-Struktur, Spalten und Rechtliches-Links.
- Dateien: `src/components/site/SiteHeader.tsx`, `SiteFooter.tsx`, `Logo.tsx`.
- Mitgliederbereich-Navigation (Sidebar, Bottom-Bar, „Erstellen"-Sheet) in
  `src/components/app/AppShell.tsx`.
- **Sprint 3 (ausdrücklicher Gründerauftrag):** Die Primärnavigation wurde auf
  **sechs Bereiche** reduziert – Start · Discover · Erstellen · Inbox · Events ·
  Profil. Der öffentliche Header und der Footer sind **unverändert**; die
  Änderung betrifft ausschließlich den Mitgliederbereich. Alle bisherigen
  Punkte existieren weiter (zweite Sidebar-Gruppe „Bereiche", Profil-Konto-Block,
  Umleitungen von `/app/messages`, `/app/connections`, `/app/notifications`).

### 1.6 Grundlayout

- Shell-Klassen `.ic-shell`, `.ic-narrow`, `.ic-app-bottom-space`,
  `.ic-scroll-row`, `.ic-reveal`, `.ic-swipe-card` und ihre Breakpoints.
- Sektions-Rhythmus (Abstände), Kartenradien (`--radius-*`), Schatten
  (`--shadow-card`, `--shadow-lift`, `--shadow-pop`), Animationsdauern und
  Easing (`--ease-emphasized`).
- Karten-/Panels-Stil der Bereiche Membership, Events, Opportunities,
  Marketplace, Investments.
- **Sprint 3 (ausdrücklicher Gründerauftrag):** zusätzlich
  `.ic-app-main`, `.ic-grid`, `.ic-span-4|6|8|12`, `.ic-measure`,
  `.ic-measure-wide`. Bestehende Shell-Klassen wurden **nicht** geändert;
  `.ic-app-bottom-space` greift weiterhin ab 1280 px. Die neuen Klassen dienen
  nur dazu, die große freie Fläche rechts auf 1440–2560 px zu füllen.

### 1.7 Dark/Light-System

- Beide Modi müssen erhalten bleiben; kein Modus darf entfallen.
- Umschaltung und Persistenz (localStorage, FOUC-freies Init-Skript) bleiben.
- Kontrastverhältnisse dürfen technisch korrigiert, aber nicht neu gestaltet
  werden.

### 1.8 DE/EN

- Vollständige Zweisprachigkeit bleibt Pflicht; die Struktur der Wörterbücher
  (DE = EN) ist geschützt.
- Der Umschalter bleibt an der heutigen Stelle und in heutiger Form.

### 1.9 Visuelle Ausrichtung

- Junge Unternehmer, offen, modern, international, Premium durch Reduktion.
- Keine Rückkehr zu Seriositäts-Klischees (Gold, Serifenschrift, dunkle
  „Banken"-Optik), keine verspielte Consumer-Optik.

### 1.10 Mitgliederbereich

- Visuelle Sprache des Dashboards, der Karten, Tabellen, Filter-Chips,
  Empty-States und Sperrhinweise (Locked-State-Karten) bleibt bestehen.
- Dateien: `src/components/app/**`, `src/components/ui/**`.

### 1.11 Sprint-3-Follow-up: Start · Discover · Profil (2026-09-21)

**Ausdrücklicher Gründerauftrag** (Fortsetzung des unterbrochenen UX-Auftrags,
nach dem CPU-Incident-Fix PR #10) – nur diese drei Bereiche wurden angepasst,
Designsprache, Navigation, Farben, Typografie und Komponenten bleiben
unverändert:

- **Start (`/app`):** sechs Kernbereiche statt 3×2 jetzt als **2×3-Raster**
  (Desktop/Tablet 2 Spalten, Mobile 1 Spalte); Cards größer, ruhiger,
  flächenfüllend (`ic-span-6`, größere Polster/Icons).
- **Discover (`/app/discover`):** kompakte Filterleiste mit Standort, Umkreis,
  Rolle und Branche; „Mehr Filter“-Panel (Interesse, Typ, Ich suche, Ich biete,
  Investmentinteressen); aktive Filter als entfernbare Chips; „Filter
  zurücksetzen“. Kartendesign und Empty-States unverändert, keine
  Fake-Personen.
- **Profil (`/app/profile`):** kompakter Identity-Header, Statistikzeile
  (Follower · Folgt · Business Connections · Trust Score), separate
  Action-Zeile, deutlich kleinerer Profilfortschritt, zentrierte
  Tab-Navigation, Interessen & Ziele und sekundäre Informationen als
  Accordions (native `<details>` im bestehenden Kartenstil).

**Nicht angefasst:** öffentliche Homepage, Auth/Resend/Trial/Membership,
App-Navigation (Sidebar/Bottom-Bar), Member Card, Einstellungen.

### 1.12 Sprint 5: Mobile-Startseite · Hero · Sprachwahl · Auth-Formulare (2026-09-21)

**Ausdrücklicher Gründerauftrag** (Mobile UX, Login UX, Public-Polish) – nur
die folgenden Punkte wurden geändert; Farbwelt, Typografie, Bildsprache und
Premium-Stil bleiben unverändert. Dieser Stand ist seinerseits eingefroren:

- **Öffentliche Startseite mobil (`<lg`):** kompakter Hero (kürzerer Sublead
  „Finde Kunden, Geschäftspartner, Kapital und neue Business Opportunities an
  einem Ort." statt Marketing-Frage), drei Ergebnisse komprimiert, sechs
  Kernbereiche als klickbare Übersicht (Titel + Ein-Zeilen-Nutzen +
  „Mehr erfahren"-Link) statt sechs gestapelter Bild-Text-Sektionen,
  Membership mit Preis + CTA, Footer. **Desktop (`lg+`) behält** die reiche
  Bild-Text-Struktur (die ausführlichen Sektionen sind `hidden lg:block`).
- **Hero:** Headline unverändert („Dein Business braucht die richtigen
  Köpfe. Keine zusätzlichen Kontakte."), Text auf Desktop Richtung
  Bildmitte verschoben, mobil kompakt.
- **Sprachumschalter:** zeigt Flagge + vollen Sprachnamen (🇩🇪 Deutsch /
  🇬🇧 English) – Public (Header) **und** Member-Bereich (Account-Sheet +
  Einstellungen, `LocaleSwitch`). Nur die tatsächlich unterstützten Locales
  `de`/`en`; Umschalt- und Persistenzlogik (`ic-locale`) unverändert.
- **KI-/Marketing-Hinweis:** nicht mehr prominent am Hero-Bild, sondern als
  sachlicher Hinweis im Footer (`footer.disclaimer`); Demo-Inhalte im
  Member-Bereich bleiben mit Badges + Hinweisen gekennzeichnet.
- **Auth-Formulare:** Eingaben bleiben bei Fehlern erhalten (kein Reload),
  Fehlermeldung am Formular, Passwortregeln sichtbar (Live-Checkliste,
  Ein-/Ausblenden), OAuth-Buttons als echte `disabled`-Elemente (K-04).
  Aussehen unverändert.
- **Demo-Detail-Dialoge:** „Ansehen"-CTAs der Demo-Sektionen (Deals,
  Marketplace, Academy, Events, Discover) öffnen einen Modal-Dialog mit
  vollständigen (Demo-)Details statt toter Links; Next-Actions zeigen
  ehrlich den Weg zur echten Funktion (z. B. `/app/opportunities/new`).
- **Event-Bilder im Member-Bereich:** Karten (`/app/events`) und Detailseite
  zeigen die vorhandenen `imageUrl`-Bilder (wie die öffentliche Seite).
- **Kleine Visualisierungen:** Ziel-Allokationsbalken im Portfolio-Panel
  (CSS-only, klar als Ziel/Demo gekennzeichnet), Deal-Typ-Chips mit echten
  Zählungen auf `/app/opportunities` (nur wenn echte Daten existieren),
  Profil-Vollständigkeit (bestand bereits). Keine erfundenen Umsätze,
  Renditen oder Erfolgszahlen; keine neuen Dashboard-Sektionen.

### 1.13 Sprint 8: Mobile Public Homepage · Mobile Member App · Core Loop (2026-09-22)

**Ausdrücklicher Gründerauftrag** (produktiver Mobile-Sprint, kein Rewrite) –
die folgenden Änderungen sind beauftragt, umgesetzt und jetzt ihrerseits
eingefroren. Farbwelt, Typografie, Bildsprache (Desktop), Komponenten-Bausteine
bleiben unverändert.

- **Public Homepage mobil (`<lg`):** neue, radikal verkürzte
  Informationsstruktur – Hero (Headline + 1 Satz + CTA „INNER CIRCLE
  entdecken“ + kleine Zeile „48h Discovery starten“, Facts-Liste mobil
  ausgeblendet), 3 Outcomes (Titel + 1 kurze Zeile), 6 Kernbereiche als
  kompakte 2×3-Icon-Übersicht (keine Bilder), Trust als 3-Punkte-Zeile
  (keine große Section), Membership kompakt (Titel + beide Preise + 1 CTA),
  Footer mit 2-Spalten-Links unter `sm`. Events-/Kapital-/Final-CTA-Sections
  bleiben **nur** Desktop (`hidden lg:block`, unverändert).
- **Member Navigation mobil (`<xl`):** Desktop-Sidebar vollständig aus der
  mobilen Ansicht entfernt; feste Bottom-Nav `Start · Discover · + · Inbox ·
  Profil` (Icons + Labels, `+` = bestehendes Erstellen-Sheet); Avatar in der
  Top-Bar öffnet das Konto-&-Bereiche-Menü (Dialog) mit allen sekundären
  Bereichen (inkl. Academy) und Konto-Punkten. Keine zweite dauerhafte
  Navigation. Desktop-Sidebar unverändert.
- **Mobile-Chat:** 1:1-Chat auf Mobile wie Messaging-App (Header mit Person
  + zurück zur Inbox, Messages im Hauptscreen, Composer unten fixiert,
  1-Zeilen-Textarea); Desktop-2-Spalten-Layout unverändert.
- **Mobile-Kompaktierung der Member-App:** Start-Kernbereiche als kompakte
  2-spaltige Tiles (1 kurze Zeile) auf Mobile; Discover-Karte kompakt
  (1–2 Tags, max. 2 Match-Gründe) + Daumen-Actions (2-spaltig, Connect
  durchläuft die Zeile); MemberCard 2 Tags + full-width Action-Rows;
  Deals/Jobs/Investments listbasiert (1-Zeilen-Summary, Typ-Badges
  lokalisiert); Events image-led ohne Beschreibung in der Übersicht, CTA
  „Event ansehen“; Seiten-Leads unter `sm` ausgeblendet (Titel zuerst).
- **Start „Für dich“:** echte, relevante Einträge (Anfrage, ungelesene
  Nachricht, passendes Mitglied, Chance, Event, Investment) statt statischer
  Links; ohne Daten ehrliche Shortcuts.
- **Network:** View-Segmente Alle / Verbindungen / Anfragen.

**Nicht angefasst:** Auth, Resend, Trial, Membership, Stripe, Cloudflare-
Logik, Public-Desktop-Layout, Farbtokens, Bildsprache, Branding/Name/Logo.

### 1.14 Sprint 9: Alternierende Ecosystem-Sektion der Public Homepage (2026-09-23)

**Ausdrücklicher Gründerauftrag** (Finalisierung des Bereichs unterhalb der
freigegebenen „Drei Ergebnisse, die zählen.“, Maßstab ist das bereitgestellte
Navy-Referenzlayout mit alternierender Bild-/Text-Struktur) – der folgende
Zustand ist beauftragt, umgesetzt und jetzt seinerseits eingefroren:

- **Desktop (`lg+`):** sechs Kernbereiche als große, ruhige editorial Rows auf
  Deep Navy `#0a1628`, feste Reihenfolge: 01 Network → 02 Business Deals →
  03 Jobs & Projekte → 04 Investments → 05 Events → 06 Insights. Jede Reihe:
  großes Bild (~55 % Breite, `h-[360px]`/`xl:h-[420px]`, alternierend links/
  rechts beginnend mit Bild links), kleine Nummer + Haarlinie + Icon,
  Serif-Titel, 1–2 Sätze, CTA „Entdecken →“; feine horizontale Divider
  zwischen den Reihen. Abschnittskopf: Kicker + Serif-Titel links,
  „Alle Bereiche ansehen →“ rechts. Bewusster Übergang aus dem hellen
  Ergebnis-Bereich: vertikale Haarlinie + weicher Top-Gradient (kein harter
  zufälliger Cut).
- **Mobile (`<lg`):** dieselben Reihen kompakt gestapelt (Bild → Nummer →
  Serif-Titel → 1–2 Sätze → „Entdecken →“) auf Deep Navy; ersetzt die
  2×3-Icon-Übersicht aus Sprint 8. Übrige Mobile-Struktur (Hero, Outcomes,
  Trust-Zeile, Membership, Footer) unverändert.
- **Bilder der Sektion (eingefroren):** `network.jpg`, `business-deal.jpg`,
  `business.jpg`, `areas-investments-tower.jpg`, `areas-events-stage.jpg`,
  `areas-insights-desk.jpg` – ausschließlich bestehende Assets, keine neuen
  Bilder.
- **Texte:** DE+EN über `src/lib/i18n` (`dict/site-v2.ts`: `areasV3Items`,
  `areasV3Cta`), Parität getestet.

**Unverändert eingefroren bleiben:** freigegebener Header/Navigation,
VP-Branding/Monogramm, Desktop-Hero inkl. Headline „A stronger tomorrow,
together.“, Hero-Bild/Texte/Buttons/Pillars, „Drei Ergebnisse, die zählen.“,
Events-Band, Kapital-Hinweis, Membership, Final-CTA, Footer, gesamter
Mitgliederbereich sowie alle Logik/Routen/Auth/DB. Desktop-Breite/Proportionen
der Sektion: siehe 1.16 (Sprint 11).

### 1.15 Sprint 10: Live-Nachbesserungen nach PR #23 (2026-09-23)

Reine Fehlerbehebungen im Rahmen von §2 (Überlauf, abgeschnittene Inhalte,
fehlende Bedienelemente, falsche Texte) – **keine** Gestaltungsänderung an
Hero, Branding, Ecosystem-Sektion oder Mitgliederbereich:

- **Mobile Hero (`<lg`):** nutzt jetzt dasselbe freigegebene Motiv wie der
  Desktop (`/images/hero-alpine.jpg`, Alt-Text `home2.heroV3ImageAlt`) statt
  des alten `hero-home.jpg`. Layout, Texte, Buttons und kompakte Höhe
  unverändert; Bildausschnitt `object-[55%_50%] sm:object-[60%_45%]`, bei
  390 px geprüft (Gesicht rechts neben der Headline, Text über der
  Landschaft). Kein neues Asset.
- **Mobile Hero – Kicker und Headline (Gründerentscheidung „Option A“):**
  Kicker `PEOPLE · OPPORTUNITIES · PROGRESS` und Headline „A stronger
  tomorrow, together.“ (Schlüssel `home2.heroV3Kicker`/`heroV3TitleA`/
  `heroV3TitleB`, identisch mit dem Desktop-Hero) ersetzen mobil „Business-
  Netzwerk“ / „Dein Business braucht die richtigen Köpfe. Keine zusätzlichen
  Kontakte.“ **Ausdrücklich unverändert:** Lead-Text, CTA „INNER CIRCLE
  entdecken“, Zeile „48h Discovery starten“, Preishinweis, Layout, Größen,
  Abstände, Buttons, Bild, Akzentfarbe der zweiten Headline-Zeile, mobiler
  Header. Bei 360/390 px geprüft: Kicker einzeilig (283 px), Headline exakt
  zwei Zeilen, kein Überlauf; Hero dadurch ~60 px kompakter.
- **Desktop-Header (`xl+`, vorher `lg+`):** Die vollständige Kopfzeile
  (Doppel-Branding, sechs Navigationspunkte, Sprach-/Theme-Wahl, Login,
  „Zur Plattform“) wird erst ab 1280 px gezeigt; 1024–1279 px nutzen die
  kompakte Kopfzeile mit Hamburger-Menü, weil die Vollversion dort
  nachweislich den rechten Rand abschnitt. Der INNER-CIRCLE-Wortmarken-Block
  neben dem VP-Monogramm erscheint ab 1440 px; das VP-Monogramm bleibt immer
  sichtbar (im Dark Mode per `dark:invert`, weil die Navy-Bildmarke auf dem
  dunklen Header sonst unsichtbar war).
- **Sprach- und Theme-Wahl im Desktop-Header:** wieder vorhanden als zwei
  kompakte Trigger (Globus + „DE/EN“, Sonne/Mond-Icon) in der bestehenden
  Pill-Optik; die Menüs zeigen weiterhin Flagge + vollen Sprachnamen
  (🇩🇪 Deutsch / 🇬🇧 English) bzw. Hell / Dunkel / System mit Häkchen.
  Persistenz (`ic-locale`, `ic-theme`), Escape/Fokus-Handling und die
  Mobile-Variante (volle Labels im Menü-Panel) unverändert.
- **Texte (redaktionelle Korrektur nach §2):** Aussagen „Registrierung und
  Login werden mit Schritt 04 aktiviert“, „sobald die Registrierung startet“,
  „sobald Konten freigeschaltet werden“ (Membership-FAQ, Membership-CTA,
  Network-CTA) waren überholt – Registrierung/Login/48-h-Discovery sind live.
  Der Hinweis „Zahlungsfunktion noch nicht aktiv“ bleibt (zutreffend), ohne
  interne Roadmap-Nummer.

### 1.16 Sprint 11: Desktop-Breite der dunklen Kernbereichs-Sektion (2026-09-24)

**Ausdrücklicher Gründerauftrag** (Teil A von Sprint 11): Die in 1.14
eingefrorene alternierende Sektion nutzt auf dem Desktop (`lg+`) jetzt nahezu
die volle nutzbare Breite mit gleichmäßigen Premium-Rändern; Bild und Text
bilden eine ruhige Reihe. **Nur** Layoutbreite, Bild-/Textproportionen und
responsive Abstände wurden verändert – Reihenfolge, Bilder, Texte,
Farben, Typografie, Links, Hover-Zustände sowie Tablet/Mobile sind
unverändert (390/768 px pixelidentisch, Hero bei 1440/1920/768/390
pixelidentisch geprüft). Werte (`src/app/(site)/HomeContent.tsx`):

| Element | vorher | jetzt |
| ------- | ------ | ----- |
| Container | `max-w-[1480px] px-8 pt-14 pb-12 xl:px-14` | `max-w-[1800px] px-10 pt-14 pb-10 xl:px-14 xl:pb-12 2xl:px-16` (Seitenränder 40/56/64 px, bei 1920 px ≈ 124 px inkl. Auto-Rand) |
| Divider unter dem Abschnittskopf | `mb-16` | `mb-14` |
| Reihen | `gap-16 py-14` | `gap-12 py-10 xl:gap-16 xl:py-12` |
| Bild | `col-span-7 h-[360px] xl:h-[420px]`, `sizes="55vw"` | `col-span-7 aspect-[16/10] h-auto w-full object-cover` (`width={1200} height={750}`, `sizes="(min-width: 1800px) 980px, 56vw"`) → ≈ 755×472 px bei 1440, ≈ 950×594 px bei 1920 |
| Text | `col-span-5 max-w-[420px]` | `col-span-5 max-w-[460px] 2xl:max-w-[500px]` + `xl:pl-2` / `xl:pr-6` je nach Seite |

Kein horizontaler Überlauf zwischen 390 und 1920 px. Dieser Zustand ist ab
jetzt Teil des Freeze.

### 1.17 Sprint 12: Private Beta – Professionalisierung des eingeloggten Bereichs (2026-09-24)

**Ausdrücklicher Gründerauftrag** (Sprint 12): nur der eingeloggte Bereich
wird ruhiger und ehrlicher, **kein** Redesign. Öffentliche Seiten, Hero,
Bilder, Header, Navigation, Palette, Typografie und Tokens sind
**unverändert** (keine neuen Design-Tokens, keine neuen Farben).

| Bereich | Änderung | Grund |
| ------- | -------- | ----- |
| Discover-Karte (`DiscoverDeck.tsx`) | Match-%-Plakette, Kennzahlen-Kacheln (Kontakte/Chancen/Angebote/Nachweise) und Trust-Sterne entfernt; „Warum diese Empfehlung?“ zeigt nur nachprüfbare Gemeinsamkeiten | Auftrag: keine erfundenen Match-Wahrscheinlichkeiten, Kennzahlen oder Trust-Werte |
| Discover-Karte, Layout | Die in 1.11 beschriebene Aufteilung (Bild links `lg:col-span-5`, Inhalt rechts `lg:col-span-7`) greift jetzt wirklich: vorher überschrieb die ungeschichtete Klasse `.ic-span-12` (`globals.css`) die `lg:`-Klassen, das Porträt lief über die volle Kartenbreite und der Inhalt lag unter der Falz. Jetzt `col-span-12 lg:col-span-*` | Wiederherstellung des beabsichtigten Designs, kein neues |
| Discover-Filter „Mehr Filter“ | neues Auswahlfeld **Businessziel** (Auftrag: Filter nach Zielen); Raster jetzt `sm:grid-cols-2 lg:grid-cols-3` (zwei ruhige Reihen à drei Felder), die Textfelder „Ich suche“/„Ich biete“ füllen ihre Zelle wie die Auswahlfelder | Funktionslücke geschlossen, gleiche Bausteine, keine neuen Tokens |
| Discover-Karte ohne Foto | statt großem Blauverlauf mit weißen Initialen ein ruhiger neutraler Platzhalter (`border-border bg-surface-muted`, Initialen `text-foreground-muted`), `16:9` mobil / `4:3` Desktop. Karten **mit** Foto unverändert `4:5` | ruhige Karten, keine dekorativen Verläufe; Name und Aktionen bleiben ohne Foto über der Falz |
| Netzwerk-Karte (`MemberCard.tsx`) | toter, deaktivierter „Nur für Mitglieder“-Button entfernt; neutraler Zustand „Nicht angenommen“ nach Ablehnung | keine toten Buttons |
| Inbox/Chat (`MessagesView.tsx`, `ConnectionsView.tsx`, `NotificationsView.tsx`) | Chat-Liste mit Partner + Vorschau + Ungelesen, ruhiger Leerzustand, schreibgeschützter Verlauf nach Beta-Ende mit Hinweis statt Eingabefeld | Networking-Kernflow |
| Sperr- und Beta-Hinweise (`NetworkLocked.tsx`, `ClosedBetaNote.tsx`) | neue, ruhige Karten im bestehenden Kartenstil (Rahmen, `bg-surface`, keine Verläufe) | Closed-Beta-Erklärung, Beta-Ende |
| Dashboard (`DashboardScreen.tsx`) | Beta-Status statt Demo-Countdown für Tester; Pfeil in „Für dich“ als SVG-Icon (`ArrowRightIcon`) statt Textzeichen | Konsistenz; das Zeichen „→“ fehlt im Inter-Latin-Subset |
| Admin (`/admin/beta`) | neue Verwaltungsseite im bestehenden Admin-Layout | Schlüsselverwaltung |

**Bewusst nicht geändert:** Das gleiche `.ic-span-12`-Muster verhindert auch
auf `/app/profile` und `/app/settings` die `lg:`-Spaltenaufteilung (K-23). Diese
Seiten wurden in Sprint 12 nicht umgebaut, weil sie außerhalb des
Networking-Kernflows liegen; die Korrektur ist ein eigener, kleiner Auftrag.

### 1.18 Sprint 13: Profil-Editor – einheitliches Speichern & Foto-Upload (2026-09-24)

**Ausdrücklicher Gründerauftrag** (Foto-Upload + einheitlicher Speichervorgang
auf `/app/profile/edit`). Nur der Profil-Editor ändert sich; Startseite,
Navigationsstruktur, Palette, Typografie, Tokens und alle übrigen Bereiche
bleiben unverändert. Die neuen Bausteine nutzen ausschließlich bestehende
Design-Tokens (Cards, Button-Varianten, Warn/Danger-Farben, Chip-Stil).

| Bereich | Änderung | Grund |
| ------- | -------- | ----- |
| `/app/profile/edit` – Foto-Bereich | Neue Card „Profilfoto“ über den Feldern: Avatar-Vorschau (96 px, rund), Sekundär-Button **„Foto auswählen“** (öffnet Galerie/Dateiauswahl), Ghost-Button „Foto entfernen“, Hinweiszeile (JPG/PNG/WebP, max. 5 MB), darunter das bisherige URL-Feld als optionale Alternative | Auftrag 2: direkter Upload statt nur Bildlink |
| `/app/profile/edit` – Formularstruktur | Profilfelder, Foto **und** Interessen & Ziele liegen in **einem** `<form>` mit **einem** Primär-Button „Profil speichern“ (unten, rechts); der frühere zweite Speicherbutton „Interessen & Ziele“ entfällt; Speichern zeigt den bekannten grünen Erfolgs-Banner („Alle Änderungen gespeichert – Profilfelder, Foto, Interessen & Ziele“) und verlässt die Seite nicht mehr | Auftrag 1: ein einheitlicher, klar erkennbarer Speichervorgang |
| `/app/profile/edit` – Statuszeile | dezente Warn-Hinweiszeile „Ungespeicherte Änderungen …“ über dem Button; Browser-Warnung (beforeunload) nur mit tatsächlichen Änderungen | Auftrag 1: Änderungen dürfen beim Wechseln nicht unbemerkt verloren gehen |

### 1.19 Deal-Fee-Sprint: Investment Pool, Impact, Deal-Fee (2026-09-29)

**Ausdrücklicher Gründerauftrag** (Investment Pool darstellen, degressive
Deal-Fee integrieren, Impact-/Commitment-Darstellung, Deals gegen Umgehung
absichern). Bestehende freigegebene Flächen bleiben unverändert; hinzu kommen
**neue** Bausteine, die ausschließlich bestehende Tokens benutzen. **Kein**
Token in `globals.css` wurde geändert, **keine** Palette, **keine** Schrift,
**kein** Radius, **kein** Navigationspunkt.

| Bereich | Änderung | Grund |
| ------- | -------- | ----- |
| `/business-deals` | Neuer Abschnitt „Transparente Gebührenstruktur": links Titel/Lead + zwei Hinweiszeilen, rechts die Staffel als **Definitionszeilen** (kein `<table>`, auf Mobile gestapelt), darunter eine ruhige Vier-Spalten-Liste „Wofür der Plattformanteil steht" mit kleinen runden Markern | Auftrag: Fee erklären, nicht bewerben |
| `/investments` | Neuer Abschnitt „Vom Netzwerk zum eigenen Investment Pool": Fünf-Schritt-Streifen (01–05) wie die bestehende Prozessleiste, darunter die geplanten Kategorien als ruhige Linienliste; Badge „Geplantes Modell". Neuer Impact-Abschnitt: links Zielsetzung mit Sand-Kante, rechts eine `Callout tone="sand"` mit dem Ehrlichkeits-Hinweis | Auftrag: Investment Pool verständlich machen + Impact dezent statt Banner |
| `/app/investments` | Neuer `InvestmentPoolChart`: **flacher SVG-Ring** (160 px, 6 Segmente, `stroke` ohne Füllung) + Legende als einfache Liste. **Keine** Chart-Bibliothek, **keine** Schatten, **keine** Verläufe, **kein** Glow, **keine** Pillen | Auftrag: Kreisdiagramm, aber kein Crypto-Dashboard |
| `/app/opportunities/new` | Neuer Block „Deal-Bedingungen" über dem Publish-Button: eine Karte (`bg-surface-muted/40`), die Staffel als fünf ruhige Zeilen, ein optionales Volumenfeld, drei Aufzählungspunkte und **eine** Checkbox. Für Nicht-Deal-Typen rendert die Komponente **nichts** | Auftrag: professioneller kompakter Schritt statt AGB-Popup |
| `/app/deals` | Neue Seite nach dem Muster der bestehenden Listen: `Card` + Trennlinien, Badges, kleine Aktionen. Keine neue Kartenoptik | Auftrag: schlanker Flow im bestehenden Stil |

**Anti-AI-Pledge dieser Änderung (nachweisbar getestet in
`tests/unit/deal-views.test.tsx`):** keine Verläufe, keine `shadow-[…]`/
`drop-shadow`, kein `<canvas>`, keine erfundenen Beträge oder Prozentwerte,
jede Farbklasse aus der bestehenden Palette (electric/forest/sand + neutral),
Dark-Mode-Variante je Segment, Ring mit fester Quadratgröße, Legende
`flex-col` → `sm:flex-row`, Gebührenstaffel ohne horizontales Scrollen.

## 2. Ausdrücklich erlaubt (kein Designbruch)

- Technische Responsive-Bugfixes (z. B. Überlauf, abgeschnittene Inhalte,
  Touch-Ziele, Safe-Area) – solange die Gestaltungsrichtung unverändert bleibt.
- Barrierefreiheits-Fixes (Fokus, Labels, `aria-*`, Kontrast bei nachgewiesenem
  WCAG-Verstoß).
- Fehlerbehebungen, die keinen sichtbaren Stil ändern (Logik, Daten, Routing).
- Neue Seiten/Features, die den bestehenden Bausteinen aus
  `src/components/ui/*` und `src/components/site/*` folgen (keine neuen
  Designrichtungen).
- Redaktionelle Korrekturen an Texten, wenn sie inhaltlich falsch sind
  (z. B. Preisangaben) – mit Hinweis im PR.

## 3. Nicht erlaubt ohne ausdrücklichen Auftrag

- Redesign einzelner Sektionen, „Aufräumen" von Layouts, Umsortieren der
  Startseite.
- Austausch von Bildern, Icons, Illustrationen; neue Bildgenerierung.
- Änderung von Farbtönen, Radien, Schatten, Schriftgrößen oder Abständen
  „aus Konsistenzgründen".
- Neue Navigationspunkte, Umbenennung von Navigationslabels, neue Menüarten.
- Entfernen oder Umstellen von Sprach-/Theme-Umschaltern.
- Umgestaltung des Mitgliederbereichs (Sidebar-Typ, Kartenstil, Tabellenstil).
- Änderungen an `src/app/globals.css`-Tokens ohne Designauftrag.

### 3.1 Dokumentierte, ausdrücklich beauftragte Ausnahmen (2026-09-21)

Alle Punkte sind Gründungsaufträge, nach `## 4` protokolliert und damit
**erlaubt**; sie sind jetzt ihrerseits eingefroren:

1. **Breiten-System (Public):** `.ic-shell`, `.ic-shell-wide`, `.ic-shell-prose`
   in `src/app/globals.css` ersetzen das pauschale `max-w-6xl` pro Seite.
   Kein Token wurde angefasst (Farben, Radien, Schatten, Schriftgrößen bleiben).
2. **Hero-Preis + Bildrichtung:** der Hero nennt den Preis als Hinweiszeile
   (24,99 €/249,99 €), und die Public-Bilder wurden nach neuer Bildrichtung
   regeneriert (`13-decisions.md`, ADR-013). Hero-Bild `hero-home.jpg` selbst
   ist unangetastet.
3. **Sprint 5 (Mobile UX · Login UX · Public-Polish):** alle Änderungen sind
   in Abschnitt 1.12 einzeln dokumentiert und eingefroren (mobile
   Startseiten-Kompaktierung, Hero-Kürzung, Sprachwahl mit Flagge + Name,
   KI-Hinweis im Footer, Auth-Formular-Härtung, Demo-Detail-Dialoge,
   Event-Bilder im Member-Bereich, kleine Visualisierungen).
4. **Sprint 8 (Mobile Homepage · Mobile Member App · Core Loop):** alle
   Änderungen sind in Abschnitt 1.13 einzeln dokumentiert und eingefroren
   (radikal verkürzte Mobile-Homepage, Mobile Bottom-Nav + Konto-&-
   Bereiche-Menü, Mobile-Chat, Mobile-Kompaktierung der Member-App,
   „Für dich“ mit echten Einträgen, Network-Views).

## 4. Wenn ein Designauftrag kommt

1. Auftrag schriftlich festhalten (welche Bereiche, welches Ziel).
2. Dieses Dokument **zuerst** aktualisieren (neuer Status/Abschnitt).
3. Änderung auf den beauftragten Umfang begrenzen.
4. Light/Dark, DE/EN, Mobil und Desktop prüfen.
5. Screenshots/HTTP-Nachweise im PR dokumentieren.

## 5. Kurzfassung für Agenten

> Solange der Auftrag nicht ausdrücklich „Design ändern" lautet:
> **nichts Sichtbares verändern.** Keine Bilder, keine Farben, keine
> Typografie, kein Layout, keine Navigation, keine Mobile-Richtung, kein
> Redesign des Mitgliederbereichs.

## 6. Sprint 3 – Informationsarchitektur (Gründerauftrag, 2026-09-21)

Der Auftrag lautete ausdrücklich: **kein Redesign**. INNER CIRCLE soll sich wie
eine moderne Business-App anfühlen statt wie ein komplexes Dashboard. Folgendes
wurde deshalb **bewusst geändert** und gilt ab sofort als genehmigter Zustand:

| Bereich | Änderung |
| ------- | -------- |
| Navigation | 6 Primärbereiche (Start · Discover · Erstellen · Inbox · Events · Profil); alles andere darunter gruppiert, nichts gelöscht |
| Start | nur noch kompakte Kopfzeile (`Hallo, <Name>`, Trial-Chip, Inbox-Shortcut) + sechs Kernbereichs-Karten; die großen Discovery-Trial- und Profilfortschritts-Boxen sind ins Profil gewandert |
| Trust & Performance | kein Navigations-/Startbereich mehr; Daten und Funktionen vollständig unter `/app/profile?tab=performance` (+ `/app/trust`) |
| Discover | Hinge/Tinder-Mechanik auf Business-Identität; Connect **nur** mit Pflichtnachricht |
| Inbox | `/app/messages`, `/app/connections`, `/app/notifications` unter `/app/inbox` zusammengeführt (Tabs); alte Pfade leiten um |
| Erstellen | eigener Primäreintrag (Desktop-Button, Mobile `+`); **keine** Event-Erstellung für Mitglieder |
| Profil | Hauptbereich mit Header + Tabs Übersicht/Aktivitäten/Performance/Angebote; Konto-Punkte (Member Card, Mitgliedschaft, Einstellungen) hier gebündelt |
| Einstellungen | neuer Abschnitt „Darstellung" (Hell/Dunkel/System) über die bestehende `ThemeProvider`-Infrastruktur |
| Öffentliche Startseite | Sprint 4 (Gründerauftrag): Hero-Bild, Farbwelt und Typografie bleiben; Copy und Sektionsfolge auf Conversion (Reason Why → 3 Outcomes → 6 Bereiche → Audience → Flow → Trust → Membership → Portfolio → Events → CTA). Kein Rebranding, kein neues Logo. |

**Unverändert eingefroren bleiben:** Farbwelt, Typografie, Bildsprache
(Hero-Hintergrund, People-Bilder), Premium-/Apple-Richtung, Hero, Registrierung,
E-Mail-Verifizierung, Discovery-Trial, Mitgliedschaftslogik, DB-Logik, Auth.
LinkedIn bleibt entfernt. Keine erfundenen Daten.

## Konsolidierungs-Sprint: Anti-AI-Polish der betroffenen Seiten (2026-09-28, ausdrücklicher Gründerauftrag)

Der Gründer hat im Konsolidierungs-Sprint ausdrücklich einen **gezielten
visuellen Polish** der betroffenen Plattformseiten beauftragt („weniger
KI-Look“): klarere Hierarchie, weniger Container-in-Container, ruhige
Flächen, klare Linien/Trennungen, weniger Erklärungstexte, konsistente
Button-Größen – **ohne** neue Farbwelt, ohne Gold, ohne Verläufe/Glow, ohne
Redesign und unter Beibehaltung des Navy/Off-White/Blau/Dunkelgrün-Systems,
der Sidebar, des VP-Brandings und der Listenstrukturen. Umgesetzt, begrenzt
auf die vom Sprint betroffenen Seiten:

- **`/app/profile/edit`:** die Profilfelder sind jetzt in logische Abschnitte
  mit Trennlinien gegliedert (Identität → Beruflicher Kontext → Ich suche &
  Ich biete → Über mich → Links → Interessen & Ziele) statt drei
  aneinandergereihter Karten; der Fortschrittsblock zeigt Balken + Prozent +
  eine ruhige Zeile der offenen Punkte statt Pillen-Chips; redundante
  Foto-Hinweiszeile entfernt; doppelte Felder („Berufliche Rollen“, „Skills“)
  aus dem Formular entfernt. Die Beta-Welcome-Karte (inkl. Hakenliste) blieb
  erhalten.
- **`/app/opportunities/new`:** Formular auf sechs Felder reduziert; ruhige
  2-Spalten-Struktur; kürzere, ehrliche Intro-Zeile.
- **`/app/opportunities/[id]`:** Typ und Status werden in lesbarer Sprache
  statt als Rohwerte angezeigt; Metadaten erscheinen nur mit echtem Wert
  (keine „–“-Boxen); Legacy-Blöcke (Angebot/Suchen/Voraussetzungen) rendern
  nur bei vorhandenen Altdaten.
- **`/admin/users`:** ruhigere Zeilen – die drei Status (Mitglied, Private
  Beta, Founding Member) stehen getrennt als Badges, ergänzt um eine dezente
  Membership-Detailzeile statt Badge-Anhäufung; Aktionen rechtsbündig mit
  konsistenter `sm`-Größe.

Nicht berührt: Startseite, öffentliche Seiten, Sidebar, Navigation, Events,
Discover/Networking, Inbox/Chat, Trust, Theme-Tokens, Mobile-Richtung.

## Private-Beta-Auftrag: Theme-/Hover-Reparatur (2026-09-27)

Explizit beauftragte Korrektur, kein Redesign: Desktop-Nav verwendet
semantische Hover-/Fokusfarben; Homepage-Kernbereiche und Footer wechseln mit
dem bestehenden Theme. Light-Secondary-Text kontrastreicher, Bild-Hero bleibt
überlagert. Typografie, Bilder, Layout und CTA-Hierarchie unverändert.
DE/EN, 1440/390 px, Light/Dark im Worker geprüft. Belege und Grenzen:
[Private-Beta-Abnahme](15-private-beta-acceptance.md).

## 1.18 Sprint: Member-Plattform UX-Konsolidierung (2026-09-27)

Ausdrücklich beauftragte Konsolidierung der Plattform (kein Public-Redesign):

- App-Shell nutzt das vorhandene Venture & Partners-Monogramm `public/brand/vp-monogram.png`; Dark Mode invertiert nur die vorhandene Bildmarke. Sidebar-Breite und Navigation bleiben bestehen.
- Eigenes Profil ist als ein gemeinsamer Identity-/Trust-Header angeordnet; Trust Score bekommt 35–40 % Desktop-Fläche. Score und Trust-Angaben erscheinen ausschließlich bei vorhandenen verifizierten Bewertungsdaten. Follower, Following und Connections öffnen native, server-gerenderte Listen aus den vorhandenen Tabellen; kein neues Backend/Schema.
- Profil-Tabs sind eine volle, mobil horizontal scrollbare Unter-Navigation.
- Bestätigte und geplante Events sowie klar als Beispiel markierte Event-Vorschauen verwenden einzelne horizontale Bild-/Text-Zeilen. Event-Bilddateien und Zuordnungen, insbesondere Monaco Networking Weekend, wurden nicht geändert.
- Chancen, Jobs/Projekte, Investments und Marketplace verwenden knappe Teaser, durchgängige Detail-CTAs und reduzierte Trennlinien statt mehrspaltiger Card-Raster. Vorhandene Detailrouten bleiben zuständig für Langtexte. Reale Trust-Scores werden nur bei verifizierten Bewertungsdaten in Discover, Netzwerk, Chancen, Jobs und Marketplace gezeigt.
- Academy trennt „Meine Kurse“ und „Entdecken“ über eine mobile scrollbare Navigation; gespeicherter Kursfortschritt bleibt unverändert.
- Keine Farb-/Typografie-Tokens, Sidebar-IA, Kernsysteme oder Datenbanktabellen neu gebaut.

## 1.19 Follow-up-Sprint: Listenprinzip & Profilzähler (2026-09-27)

Dieser Follow-up-Sprint ist ausdrücklich beauftragt und konsolidiert nur die
zentralen Member-Listen; bestehende Brand-, Sidebar-, Event-, Discover-, Inbox-,
Trust- und Theme-Strukturen bleiben unverändert:

- `/app` zeigt keinen großen „Für dich“-Container und fragt dort keine
  Personalisierungsdaten mehr ab. Die sechs Kernbereiche führen als einzelne
  horizontale Zeilen direkt in die Bereiche.
- Profilbeiträge und Profilangebote stehen vertikal untereinander. Die drei
  Profilzähler öffnen jeweils ein sichtbares Modal mit X, sauberem Backdrop,
  Outside-Klick und Escape; die Liste enthält Avatar, Name, Handle, Rolle/Firma,
  vorhandenen Trust und „Profil öffnen“.
- Chancen, Jobs/Projekte, Marketplace und Academy („Meine Kurse“ / „Entdecken“)
  verwenden je Objekt eine horizontale Zeile mit kurzer Übersicht und
  konsistenter CTA. Detailinformationen bleiben hinter der bestehenden
  Detailroute bzw. dem bestehenden Demo-Dialog.
- Die echte Investment-Übersicht war bereits vertikal und bleibt inhaltlich
  unverändert. Nur die noch dichte Investment-Demo-Vorschau folgt ebenfalls
  dem Listenprinzip.
- Keine neuen Farben, Tokens, Tabellen, Migrationen, Auth-/Beta-/Resend-
  Änderungen oder Änderungen am Event-Layout. Desktop und Mobile nutzen
  dieselbe einspaltige Reihenlogik; lange Inhalte erzeugen keinen horizontalen
  Überlauf.

## 1.20 Follow-up: Start-Raster zurück & ruhigerer Dark-Ton (2026-09-28)

Ausdrücklich beauftragter, rein visueller Follow-up nach 1.19 (kein Redesign,
keine neuen Features). Er ersetzt für `/app` den in 1.19 beschriebenen
Zeilen-Look und verfeinert den Dark Mode. Nichts anderes wurde angefasst.

**Start `/app` (ersetzt den Listen-Look aus 1.19):**

- Kein „Für dich“-Container, keine leere Personalisierungsbox und keine
  Personalisierungsabfrage auf `/app` (Zustand aus 1.19 bleibt bestehen).
- Die sechs Kernbereiche (Network · Business Deals · Jobs & Projekte ·
  Investments · Marketplace & Academy · Events) sind wieder große, klar
  voneinander getrennte Karten: Desktop/Tablet **2 Spalten × 3 Reihen**,
  Mobile **einspaltig** untereinander, ohne horizontale Scrollbar.
- Jede Karte zeigt Icon-Kachel, Titel, kurze Beschreibung (Mobile: Kurztext),
  das Status-Badge („Demo“ bzw. „Mitgliedschaft erforderlich“) und den
  „Öffnen“-Hinweis; die gesamte Karte ist ein Link, Hover mit leichtem Lift
  und Electric-Border. Keine dünne Ein-Zeilen-Liste mehr.
- Kompakte Kopfzeile sowie Trial-, Beta- und Mitgliedschafts-Panels bleiben
  unverändert.

**Dark-Ton (semantische Token in `src/app/globals.css`, Block `.dark`):**

Der Dark Mode bleibt erhalten, die Flächenleiter folgt jetzt aber der
vorhandenen Midnight-Navy-Markenleiter – keine neue Farbe, kein Gold:

| Token | vorher | jetzt |
| ----- | ------ | ----- |
| `--background` | `#0a0e15` | `#10151e` (Midnight 900) |
| `--surface` | `#10151e` | `#1a212d` (Midnight 800) |
| `--surface-raised` | `#161d29` | `#202939` |
| `--surface-muted` | `#1a212d` | `#262f3e` (Midnight 700) |
| `--border` | `#242e3d` | `#2a3444` |
| `--border-strong` | `#35435a` | `#3c4a61` |
| `--foreground` | `#f7f8fa` | `#f2f5fa` (weiches Off-White) |
| `--foreground-muted` | `rgb(247 248 250 / 0.72)` | `rgb(242 245 250 / 0.78)` |
| `--foreground-subtle` | `rgb(247 248 250 / 0.5)` | `rgb(242 245 250 / 0.62)` |

Wirkung: Page-Hintergrund und Content-Flächen sind klar, aber ruhig getrennt
(surface/background 1,13:1 statt 1,06:1), Karten sind nicht mehr „schwarze Box
auf schwarzem Grund“, Borders wirken relativ zu den helleren Flächen
zurückhaltender (1,33:1), und Sekundärtext ist besser lesbar (muted 9,4:1,
subtle 6,5:1 auf einer Kartenfläche). Der `themeColor`-Eintrag (dark) in
`src/app/layout.tsx` folgt dem neuen `--background`.

Light-Modus-Token, die Markenfarben-Skalen (`midnight-*`, `paper-*`,
`electric-*`, `forest-*`, `sand-*`), Radien, Schatten und Typografie sind
unverändert.

**Unverändert geblieben:** Profil, Trust Score, Follower/Folgt/Connections,
Events, Chancen, Jobs, Investments, Marketplace, Academy, Sidebar, Auth, Beta,
Resend, Datenbank, DNS und Domain. Keine neue Migration.

---

## 1.21 Mobile-Polish & Cross-Device-QA (2026-09-28)

Ausdrücklich beauftragter Sprint **ausschließlich für kleine Viewports**
(„Auf dem Smartphone nicht wie eine verkleinerte Desktop-/AI-Website wirken").
Desktop (`lg`/`xl` und alles darüber) bleibt unverändert; es wurde **kein**
Desktop-Bereich umgebaut, kein Feature hinzugefügt, keine Bilddatei
ausgetauscht.

**1. Mobile Hero der öffentlichen Startseite (`lg:hidden`)**

- **Gleiche Datei** `hero-alpine.jpg` (2,33:1), keine neue Bilddatei, keine
  KI-Bilder.
- Vorher: vollflächiges Hintergrundbild hinter einem ~500 px hohen Textblock
  (`object-[55%_50%]`). Bei 360–430 pxViewport ergab das einen ~2,3-fachen Zoom,
  der nur ~31 % der Bildbreite zeigte und die Personengruppe anschnitt.
- Jetzt: das Bild ist ein **eigenes Band** mit der Seitenverhältnis-Nähe der
  Datei (`h-[clamp(150px,44vw,320px)]` phones, `sm:h-[clamp(220px,36vw,320px)]`
  Tablet, `object-[62%_45%]`), unten mit einem Verlauf in die dunkle
  Textfläche auslaufend. Dadurch ist bei 360 px rund **97 % der Bildbreite**
  sichtbar (Berge, See und die vollständige Gruppe), der Hintergrund ist nicht
  mehr dominant und der Text steht auf ruhigem Navy statt auf dem Foto.
- Eyebrow-Pill (Badge + Sparkle) → **Kicker-Zeile** im Desktop-Schema
  (`PEOPLE · OPPORTUNITIES · PROGRESS`, uppercase, getrackt). Desktop-Hero
  unverändert.

**2. Branding Header/Footer (mobile, `<xl`)**

- Neuer Baustein `src/components/site/BrandLockup.tsx` mit dem **bereits
  vorhandenen** Asset `public/brand/vp-monogram.png` (identisch zur Datei, die
  Desktop-Header und App-Shell nutzen). Keine neue Logo-Interpretation.
- `< 400 px` (kompakte Variante): `[VP] INNER CIRCLE` / `by VENTURE & PARTNERS`.
- `≥ 400 px`: `[VP] VENTURE & PARTNERS` / `INNER CIRCLE` – dieselbe
  Reihenfolge und Typografie wie der Desktop-Header.
- Ersetzt das alte `IC`-Kachel-Branding in Header, Mobil-Menü **und** Footer
  (`Logo.tsx` ist entfallen). Der Desktop-Header (`xl`) bleibt unangetastet;
  die Desktop-Sidebar der App behält ihre bisherige Monogramm-Darstellung.
- Rendering-Regel der Marke (`BrandMonogram`): Die PNG hat einen breiten
  transparenten Rand (sichtbare Deckkraft-Bounding-Box x 12,8–87,6 %,
  y 27,6–79,7 %). Sie wird 1,3-fach in ihre Box gerendert, die Box schneidet
  nur den transparenten Rand ab – die Marke ist dadurch nie abgeschnitten und
  optisch zentriert (0,4–1,5 px Nudge nach oben).

**3. Weniger AI-Look auf der mobilen Startseite**

- Eyebrow-Pill entfallen (siehe 1), Hero-CTA ohne Glow-Shadow und im
  Desktop-Hero-Schema (flach, Serifenschrift, 16 px auf Phones / 17 px ab
  `sm`, Höhe 48 px auf Phones / 52 px wie Desktop ab `sm`; `px-5` unter
  400 px, damit der englische Button „Go to the INNER CIRCLE platform" auch
  bei 360 px ohne Umbruch und ohne horizontalen Überlauf passt).
- Mobil-Menü-Panel: `rounded-b-3xl` → `rounded-b-2xl`, `100svh` +
  `overscroll-contain` + Safe-Area-Bottom.
- Typografie mobil geprüft und korrigiert: Hero-Eyebrow 11 px/0,24 em
  (einzeilig bis 360 px), Kernbereichs-Eyebrow 11 px → 12 px, Bereichs-CTA
  13,5 px → 14 px. Headlines bleiben 2–3 Zeilen, es wurde keine Schriftgröße
  oder Farbe des Design-Systems geändert.

**4. App-Shell mobil**

- Top-Bar: `min-h-14` + `py-1.5` + `.ic-safe-top` statt festem `h-14`;
  gemeinsames `BrandMonogram`; Inbox-Button 40 px Touch-Ziel.
- Konto-/Bereiche-Blatt: aktive Seite wird jetzt hervorgehoben
  (`aria-current` +Electric-Fläche), sonst unverändert (Dialog liefert X,
  Backdrop-Klick, Escape, Scroll-Lock, Fokusfalle).
- **Kein Umbau der Navigation**: Desktop-Sidebar bleibt ab `xl`, darunter
  Bottom-Navigation + Konto-Blatt wie bisher.

**5. Overlays (`src/components/ui/Dialog.tsx`, appweit)**

- Unter `sm` jetzt Bottom-Sheet: `max-h-[88svh]`, eigener Scrollbereich
  (`overscroll-contain`), **gekoppelter Kopf mit Titel + X** und optional
  gepinnter Footer. Vorher konnte eine lange Liste (z. B. 40 Follower) unter
  dem Bildschirmrand verschwinden und der Schließen-Button mitwandern.
- Ab `sm` bleibt die zentrierte Karte unverändert (nur `max-h-[85svh]` +
  Scrollschutz).
- `ProfilePeopleModal` hat seinen zweiten, kleineren Scrollbereich entfernt –
  das Dialog scrollt jetzt selbst.

**6. Formulare/Inputs (global, nur < 640 px)**

- `@media (max-width: 639px) { input/select/textarea { font-size: 1rem } }`:
  verhindert den iOS-Safari-Zoom (Fokus auf ein Feld < 16 px zoomt die ganze
  Seite). Reine Größenregel, keine Verhaltens- oder Validierungsänderung.
- Listen-CTAs (Events, Chancen, Jobs, Investments, Marketplace, Academy) auf
  Mobil 44 px (`h-11 sm:h-9`).

**7. Profil / Tabs / Inbox**

- Profilkopf: Avatar 56 px (< `sm`) / 72 px (ab `sm`), Rolle darf auf Mobil
  zweizeilig umbrechen (`line-clamp-2` < `sm`, einzeilig mit Ellipse ab `sm` –
  zwei Elemente statt `line-clamp-2 sm:truncate`, weil `truncate` den
  `-webkit-box`-Display nicht zuverlässig zurücksetzt), Trust-Block mobil
  etwas kleiner (Score 3xl/4xl statt 4xl).
- Profil-Tabs: horizontal scrollbar (`no-scrollbar`), kein Zeilenumbruch.
- Academy-Tabs: ebenfalls `no-scrollbar`.
- Inbox-Segment-Control: eine scrollende Zeile statt Umbruch – vorher
  zerbrach das `rounded-full` bei 360 px in zwei Reihen.

**8. Safe Areas / Viewport**

- `.ic-safe-top` (neu) für die beiden mobilen Top-Bars.
- `viewport-fit=cover` bleibt **bewusst aus**: die Links/Rechts-Inset-Werte
  im Querformat wären dann aktiv, ohne dass Container/Gutters darauf
  reagieren. Im normalen Browser (auch Instagram-In-App) sind die Insets 0,
  Header und Bottom-Navigation stehen daher nie unter Status- oder
  Browserleiste; die vorhandenen `env(safe-area-inset-bottom)`-Regeln bleiben.

**Unverändert:** Desktop-Startseite, Desktop-Header, Sidebar, Events-Desktop,
Datenmodell, Auth, Resend, Beta, Trust-Berechnung, Payment, Membership, DNS,
Domain. Keine Migration.

## 1.22 Sprint Informationsarchitektur & UX: Investments-Trennung, Discover-Dichte, Anti-AI (2026-09-29)

**Ausdrücklicher Gründerauftrag** (Informationsarchitektur-, UX- und
Design-Sprint). Ziel: klare Trennung der zwei Investment-Bereiche,
kompaktere öffentliche Investment-Seite, dichteres Discover, weniger
„generierte AI-Landingpage". **Kein** neues Token in `globals.css`,
**keine** neue Palette, **keine** neue Schrift, **kein** neuer
Hauptnavigationspunkt; bestehende Navy/Off-White/Grün/Blau-Welt bleibt.

| Bereich | Änderung | Grund |
| ------- | -------- | ----- |
| `/investments` (public) | Von der Dokumentations- zur Story-Seite: kompakter Text-Hero mit zwei CTAs (`#fuer-mitglieder`/`#portfolio`) → ein Abschnitt „Zwei Wege" mit Trennlinie statt Kartenstapel (links „Für Mitglieder/Hier investierst du", rechts „INNER CIRCLE Portfolio/Hier investiert INNER CIRCLE" inkl. 20/25/75-Hinweis) → **eine** kompakte Allocation-Figur (`AllocationDonut`, SVG ohne Chart-Bibliothek, 5/15/80 mit Legende, Badge „Geplante Struktur") → kompaktes Impact-Modell (Badge „Geplantes Impact-Modell", vorgesehene Bereiche, Ehrlichkeits-Callout) → CtaBand. Entfernt: Schritte-Streifen, Kategorien-Block, Feature-/Typen-Listen, Coming-soon-Panel, Doppel-Erklärungen. Detailmodell bleibt auf `/portfolio` | Auftrag: kürzer, klarer, zwei Wege in 2 Sekunden erkennbar |
| `/app/investments` | Landing/Hub analog Academy: zwei flache, bordered Einstiegs-Panel („Hier investierst du" → `?view=opportunities`, „Hier investiert INNER CIRCLE" → `?view=portfolio`) mit `InvestmentsHub`; Unteransichten mit „Zur Übersicht"-Link. `InvestmentPoolChart` (Ring) unverändert beibehalten, jetzt nur in der Portfolio-Unteransicht | Auftrag: Zwei-Bereiche-Struktur statt endloser Mischseite |
| `/app/discover` | Vom Ein-Karten-Deck zur **dichten Kartenliste**: kompakte Zeilen (Avatar 64–80 px · Name + Badges + Trust · Rolle/Firma/Standort · max. 4 Interessen · „Ich suche"/„Ich biete" als Einzeiler · rechts Match-Gründe + „Profil ansehen"/„Kontakt anfragen" + Überspringen/Folgen), 2 Spalten ab `xl`; Swipe-/Tastatur-Deck-Mechanik entfällt, „Überspringen" bleibt je Karte; Filterleiste unverändert | Auftrag: mehrere Profile effizient erfassbar, Business-Produkt statt Profil-Landingpage |
| Badges | Neue Komponente `VerifiedBadges`: rendert heute nur das bestehende Founding-Member-Badge, struktureller Slot für später 1–3 admin-verifizierte Badges neben Name/Trust Score; ohne echte Badges rendert sie nichts | Auftrag: Vorbereitung ohne Backend/Fake-Badges |

**Anti-AI-Pledge dieser Änderung (nachweisbar getestet in
`tests/unit/investments-discover-views.test.tsx`):** keine Kartenstapel,
Linien/Trennung statt neuer Boxen, keine neuen Pillen-Familien, kontrollierter
Weißraum (`Section tight`), keine erfundenen Beträge/Statistiken/
Portfoliounternehmen, Impact ohne emotionale Leid-Bebilderung, jede
Farbklasse aus der bestehenden Palette (electric/forest/sand/neutral),
Dark-Modus über semantische Tokens, Mobile ohne horizontal abgeschnittene
Daten (Discover-Zeilen brechen sauber um).

**Unverändert:** `/portfolio` (public), `InvestmentPoolChart`, Deal-Fee/
Deal-Terms, alle übrigen freigegebenen Flächen, Auth, Stripe, Resend, Beta,
DNS/Domain, Datenmodell. Keine Migration.

## 1.23 Post-Bilder im bestehenden Profilstil (2026-09-30)

Die Post-Erstellung unterstützt jetzt optionale JPG-/PNG-/WebP-Bilder bis
5 MB mit lokaler Vorschau. Hochgeladene Bilder erscheinen in den bestehenden
Post-Karten auf dem eigenen Profil und auf Profilen, die der Betrachter gemäß
der Beitrags-Sichtbarkeit sehen darf. Externe HTTP(S)-Bild-URLs bleiben
unterstützt. Es wurden weder Kartenstil, Farben oder Typografie noch Profil-
Tabs, App-Navigation oder Layout-Rhythmus verändert; kein neues Token und
keine neue UI-Fläche außerhalb des bestehenden Formulars und der Post-Karte.

## 1.24 Sprint Mobile + UX + Funktions-Check (2026-10-01, ausdrücklicher Gründerauftrag)

Gezielter Mobile-Polish ohne Redesign. Desktop-Sidebar, Farben, Typografie-
Stufen, Dark-/Light-Mode und DE/EN bleiben unverändert; kein neues Token.

- **Navigation (Phone):** Bottom-Bar-Ziele mit mindestens 48 px Höhe und
  11-px-Labels; das Konto-/Bereichs-Sheet listet jetzt **Events** als ersten
  Bereich (vorher auf dem Handy nur über Start-Karten erreichbar) und markiert
  die aktuelle Seite.
- **Start:** Bereichskarten auf dem Handy als kompakte Zeilen (Icon · Titel ·
  Kurztext · Pfeil, ganze Karte klickbar) statt ~195 px hoher Kacheln; ab `sm`
  unverändert. Header-Aktionen (Inbox · Glocke · Discover) als 44-px-Zeile.
- **Inbox:** Drei Tabs (Nachrichten · Anfragen · Benachrichtigungen) und die
  Unter-Tabs (Erhalten · Gesendet · Kontakte) sind auf dem Handy gleich breite
  Spalten und nie abgeschnitten; „Benachrichtigungen“ nutzt unter `sm` das
  Kurzlabel „Hinweise“/„Alerts“ (`app.inbox.tabNotificationsShort`). Chat,
  Composer, Umbruch langer Wörter/URLs und „Nachricht gelöscht“ waren bereits
  korrekt und bleiben unverändert.
- **Profil:** Stats (Follower · Folgt · Business Connections) als drei Spalten,
  Standortzeile bricht um statt abzuschneiden, Aktionen mit 44-px-Targets
  (gestapelt unter 380 px).
- **Create Post:** Reihenfolge Text → Bild (Upload/Preview) → Typ/Sichtbarkeit →
  aufklappbare optionale Felder Link-URL/Bild-URL (`app.posts.moreOptions`);
  Submit auf dem Handy volle Breite. Upload-, Validierungs- und Server-Logik
  sind unverändert (Feldnamen `imageFile`, `imageUrl`, `linkUrl` bleiben).

## 1.25 Sprint Profile, Badges & Mobile-Polish (2026-10-02, ausdrücklicher Gründerauftrag)

Festgeschrieben – Änderungen brauchen eine bewusste Entscheidung und einen
Eintrag hier:

- **Ein Profilsystem:** `/app/profile` und `/app/people/[handle]` rendern über
  dieselbe Komponente `src/components/app/ProfileView.tsx` – identische
  Struktur, Typografie, Spacing, Karten und Tabs; Unterschiede ausschließlich
  über Props (`isSelf`, `actions`, Tab-Gating, Privacy). Reihenfolge mobil:
  Kopf (Avatar/Name/Badge-Cluster/@handle/Bio) → Stats (Follower · Folgt ·
  Business Connections, 3 Spalten) → Trust Score → Verifizierte Badges →
  Tabs → Inhalt. Ab `xl` drei Spalten (Identität | Badges | Trust).
- **Profil-Tabs:** Beiträge | Übersicht | Performance | Angebote |
  **Interessen** (fester Fünfer-Order); Tab-Leiste als statisches
  `grid-cols-N`, Labels `text-[10px]`/ab `sm` `text-[13px]`, Touch-Targets
  `min-h-12`, aktiver Tab mit `border-b-2` electric.
- **Badges:** jedes Badge hat eine eigene, handgezeichnete SVG-Glyph im
  INNER-CIRCLE-Stil (navy/electric/forest, Strichstärke 1.8, **kein Gold,
  keine Trophäen**), einheitliche Größenlogik; verifizierter Status sichtbar;
  Klick öffnet kompaktes Detail (Name, Bedeutung, Verifizierungsstatus,
  „Verifiziert am"-Datum, Vergabeart „Geprüfter Verifizierungsantrag" bzw.
  „Direkte Vergabe durch INNER CIRCLE"). Leerzustand „Noch keine Badges"
  bleibt auf **beiden** Profilen sichtbar; eigenes Profil zusätzlich mit
  Erklärung + „Mehr über Badges". Der Badge-Katalog (15 Badges) ist
  vollständig erhalten.
- **Admin „Badge direkt vergeben":** `/admin/badges` – Mitglied-Dropdown
  (echte Mitglieder, inkl. eigenes Admin-Konto) + Badge + interner Grund
  (Pflicht) + optionaler Zeitraum; jeder Grant wird audit-loggiert
  (`badge.granted`). Antrags-Selbstgenehmigungsschutz bleibt getrennt
  unangetastet.
- **Profil-Kontakt-Chips:** Website · X · Instagram · **TikTok**
  (Sprint 2026-10-02) als ruhige Chips mit 13-px-Stroke-Icons unter dem
  Profilkopf – identisch auf eigenem und fremdem Profil; TikTok-Handle
  wird zu `https://www.tiktok.com/@…` normalisiert, volle URLs bleiben
  unverändert; `rel="noopener noreferrer nofollow"`, `target="_blank"`.
- **Mobile-Typografie systematisch:** geteilte Seiten-H1s mobil `text-xl`
  (ab `sm` unverändert `text-3xl`); Seiten-Wrapper-Abstände mobil
  `space-y-5`/`space-y-4` (ab `sm` `space-y-8`/`space-y-6`); Bottom-Bar,
  44/48-px-Touch-Targets und Dialog-Bottom-Sheets gemäß §1.21/§1.24
  unverändert. Kein horizontaler Overflow (Audit 390 px; Admin-Tabellen
  bleiben in `overflow-x-auto`).
- **Website-CTA-Hierarchie (Membership):** primär **„Jetzt Mitglied werden"**
  (`home2.heroJoinCta`, `nav.join` DE/EN) → `/register`, electric; sekundär
  „Mehr erfahren" → `#outcomes`, outline; Plattform-Link nur noch leise
  (underline) in der Preishinweis-Zeile direkt unter den Hero-CTAs
  (24,99 €/Monat · 249,99 €/Jahr · monatlich kündbar, Werte aus `PLANS`).
  MembershipBlock mobil: gleicher CTA statt „Zur Plattform". Die
  Sprint-15-Pins in `tests/e2e/sprint15-browser.mjs` wurden auf diese neue,
  gewollte Hierarchie aktualisiert (alte Pins: „Mehr erfahren" primär).
