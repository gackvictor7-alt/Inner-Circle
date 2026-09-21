# 10 – DESIGN FREEZE

## DESIGN STATUS: APPROVED / DO NOT REDESIGN WITHOUT EXPLICIT FOUNDER REQUEST

**Stand:** 2026-09-21 · Der aktuelle visuelle Stand des Projekts ist vom
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
   (24,99 €/249,90 €), und die Public-Bilder wurden nach neuer Bildrichtung
   regeneriert (`13-decisions.md`, ADR-013). Hero-Bild `hero-home.jpg` selbst
   ist unangetastet.
3. **Sprint 5 (Mobile UX · Login UX · Public-Polish):** alle Änderungen sind
   in Abschnitt 1.12 einzeln dokumentiert und eingefroren (mobile
   Startseiten-Kompaktierung, Hero-Kürzung, Sprachwahl mit Flagge + Name,
   KI-Hinweis im Footer, Auth-Formular-Härtung, Demo-Detail-Dialoge,
   Event-Bilder im Member-Bereich, kleine Visualisierungen).

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
