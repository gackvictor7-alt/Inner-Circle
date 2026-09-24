# 08 – Test- und Qualitätssicherung

**Stand:** 2026-09-24 (Sprint 12 – Private Beta & echtes Networking, zweite
Prüfrunde) · Branch `arena/01a0d435-inner-circle` (Basis `main` @ `8a1b5ea`,
**nicht gemergt**): `npx vitest run` = **35 Dateien / 246 Tests grün** (62 neu,
siehe §3a), `npm run typecheck` grün, `npm run test:keys` grün (616 Schlüssel,
DE+EN), `npx eslint .` = **12 Befunde (5 Fehler, 7 Warnungen)** – Abgleich pro
Datei/Regel gegen `main` @ `8a1b5ea` (14 = 5/9, in einem separaten Worktree
gemessen): **0 neu, 2 behoben**; `npm run cf:build` grün; `wrangler deploy
--dry-run` grün (Upload 9287,12 KiB / gzip 1859,17 KiB, Bindings `DB`, `ASSETS`, `NEXTJS_ENV`); D1-Migrationskette `0000`→`0001`→`0002` auf einer
**frischen** lokalen D1 mit `wrangler d1 migrations apply --local` angewendet
(52 Tabellen). **Browser-E2E** gegen den echten Worker-Preview: **65/65 Prüfungen bestanden (Lauf 827861, Build #8; Ergebnisliste `preview/sprint12/e2e-results-827861.json`)**
(§3b). **CPU-Zeit** im lokalen workerd gemessen (§3c).

Vorheriger Stand (Sprint 11 – Discovery-Demo + Homepage-Sektion) · Lauf
auf Branch `arena/01a0d03a-inner-circle` (Basis `main` @ `87a244a`):
`npm test` = **27 Dateien / 184 Tests grün** (neu: `tests/unit/demo-discover.test.ts`
8 Tests, `tests/integration/discovery-demo.test.ts` 15 Tests; erweitert:
`access-matrix` 26 Fälle mit Demo-Semantik und Trial-Render-Test,
`access-levels`, `trial-rules`, `network-demo-supplement`; `core-loop`,
`connection-request`, `network-directory` nutzen Mitglieds-Fixtures, weil ein
Trial keine echten Anfragen mehr senden darf), `npm run typecheck` grün,
`npm run test:keys` grün, `npm run lint` = 13 vorbestehende Hinweise (K-15,
unverändert), `npm run cf:build` grün, `npm run cf:dry-run` grün (Bindings
`DB`/`ASSETS`/`NEXTJS_ENV`). Browserprüfung mit echten Screenshots (headless
Chromium außerhalb des Repos, Desktop 1440/1920 + Mobile 390/768, Light/Dark,
DE/EN) für Startseite, Discovery-Demo, Demo-Profil, simulierte Kontaktanfrage,
echtes Event ohne Mitgliedschaft, Ablaufzustand, Mitglied und Admin – siehe
Sprint-11-PR.
Vorheriger Lauf (Incident-Fix D1-Date-Binds, K-20, Branch
`arena/01a0cb12-inner-circle`, Basis `main` nach PR #19):
`npm test` = **24 Dateien / 134 Tests grün** (6 neu: `for-you-d1` –
`forYouItems()` gegen echte D1 in `workerd`, Negativ-Nachweis mit
`D1_TYPE_ERROR` ohne den Fix),
`npx tsc --noEmit` grün, `npm run cf:build` grün, `npm run cf:dry-run` grün,
`/app` + Member-/Public-Routen im `workerd`-Preview (lokale D1) verifiziert.
Vorheriger Lauf (Sprint 8):
`npm test` = **23 Dateien / 128 Tests grün** (5 neu: `core-loop`),
`npx tsc --noEmit` grün, `npm run cf:build` grün, `npm run cf:dry-run` grün
(Bindings `DB`/`ASSETS`/`NEXTJS_ENV`),
`npm run test:keys` + `npm run i18n:audit` grün (DE/EN identisch),
`npm run lint` = **13 bestehende Hinweise (5 Fehler, 8 Warnungen)** –
vorbestehend, siehe K-15; **keine** neuen Befunde aus diesem Sprint.

---

## Sprint-12-Abschlussprüfung auf dem gesicherten Stand

Fortsetzung auf `arena/01a0d501-inner-circle` ab `6eebc3d` (2026-09-24).
Aktueller vollständiger Worker-Lauf **82/82**, Run `1790281164922`, Ergebnis
`preview/sprint12/e2e-results-final.json`. Der oben dokumentierte Lauf 827861
ist die historische zweite Prüfrunde, nicht der aktuelle Abschlusslauf.
35 Testdateien / 246 Tests erneut grün; Typecheck und 616 i18n-Schlüssel grün.
`npm run cf:build` und `npm run cf:dry-run` grün (9287,12 KiB / gzip
1859,11 KiB im letzten Dry-Run). Lint **Exit 1**, 5 Fehler / 7 Warnungen,
byte-identische Ausgabe vor/nach dieser Fortsetzung. Kein neuer Lint-Befund.

Erweiterungen am vorhandenen E2E-Skript:
- Pro Konto Session-Cookie vor/nach Onboarding identisch, Secure + HttpOnly,
  Hard-Reload weiterhin authentifiziert (12 zusätzliche Assertions).
- Drei mobile Ansichten ergänzt, inkl. Overflow-Checks (3 Assertions).
- Free-Demo-Drittkonto: fremden Chat direkt öffnen + RSC-Payloads von vier
  geschützten Routen enthalten keine geprüften privaten Daten (2 Assertions).
- Link-Crawl nutzt Browser-Navigation statt `context.request.get`: der separate
  HTTP-Client sendet Secure-Cookies hier nicht über HTTP-Loopback; ein
  Redirect auf Login darf nicht als erfolgreicher App-Link gezählt werden.
  33 Tester- und 36 Demo-Links authentifiziert geprüft. Testpfad `/app/academy`
  auf die tatsächliche Route `/app/learn` berichtigt.
- Vollständige Run-ID und exakte Key-Labels begrenzen SQL-Änderungen auf den
  aktuellen Lauf. Screenshots/Selektoren benötigen weiterhin eine frische,
  ausschließlich synthetische lokale D1 (keine produktive DB zurücksetzen).

**Reproduktion:** Voraussetzungen/Befehle im Kopf von
`tests/e2e/sprint12-browser.mjs`; Build + `wrangler dev --ip 0.0.0.0 --port 8787`,
alle D1-Befehle ausschließlich `--local`. Browserpakete außerhalb des Repos.
In dieser Sandbox fehlten NSS/NSPR-Systembibliotheken; sie wurden aus dem
mitgelieferten `@sparticuz/chromium/bin/al2023.tar.br` lokal extrahiert und
via `LD_LIBRARY_PATH` bereitgestellt (keine Projektabhängigkeit geändert).
`cookies()` ohne HTTP-URL-Filter verwenden: ein Filter auf die lokale HTTP-URL
blendete vorhandene Secure-Cookies aus und erzeugte falsche Negativbefunde.
Der bereits im Ausgangsskript vermiedene Chromium-`--single-process`-Modus
bleibt vermieden; seine historische Fehlerursache wurde nicht erneut bewiesen.

Zwischenläufe: 74/80 wegen dieses Cookie-Filters; danach 80/80.
Nach Erweiterung um die zwei Free-/RSC-Prüfungen einmal Abbruch bei einem
lokalen Wrangler-SELECT (62/63; derselbe SELECT unmittelbar danach erfolgreich),
anschließend unveränderter vollständiger Test **82/82**. Keine Assertion wurde
zum Erzwingen eines grünen Laufs entfernt. Worker-Preview meldet außerdem
Read-only-Static-Cache- und bei Navigation Broken-Pipe-Hinweise; kein
fehlgeschlagener funktionaler Check im letzten Lauf, kein Edge-Lastnachweis.

Details und Grenzen: [Abschlussbericht](SPRINT-12-FINAL-REPORT.md).

## 1. Definition of Done (jede Funktion)

- [ ] Bedienbar (UI + Fehlerfälle), responsiv (mobil/desktop).
- [ ] Backend-Verhalten korrekt, Daten persistent.
- [ ] Berechtigungen **serverseitig** erzwungen (nicht nur versteckt).
- [ ] DE + EN vollständig (zentrales i18n, kein Hardcodetext).
- [ ] Light + Dark lesbar, Fokus/Labels/Kontraste gegeben, Reduced-Motion respektiert.
- [ ] Relevante Tests oder dokumentiertes manuelles Prüfprotokoll vorhanden.
- [ ] Keine bekannten kritischen Sicherheitsprobleme.
- [ ] Status korrekt klassifiziert (WORKING/PARTIAL/PREPARED/BLOCKED).
- [ ] Dokumentation aktualisiert (`docs/00-SOURCE-OF-TRUTH.md` + Detaildokument).

## 2. Befehle

| Befehl | Wirkung |
| ------ | ------- |
| `npm test` | Vitest, alle Unit- und Integrationstests gegen Wegwerf-DB |
| `npm run test:watch` | Watch-Modus |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (bekannte Hinweise siehe oben) |
| `npm run test:keys` | jede im Code referenzierte i18n-Kodierung existiert in DE + EN |
| `npm run i18n:audit` | DE/EN-Struktur und Schlüsselzahlen |
| `npm run cf:dry-run` | Build + `wrangler deploy --dry-run` (Bindings prüfen, kein Upload) |
| `npm run cf:preview` | App in `workerd` gegen lokale D1 (Port 8787) |
| `npm run dev:outbox` | Dev-Postausgang lesen (`--local`, `--remote`, `--to=`, `--limit=`) |

## 3. Automatisierte Tests (Bestand)

| Datei | Umfang | Art |
| ----- | ------ | --- |
| `tests/unit/auth-crypto.test.ts` | scrypt-Hashing/Vergleich, Session-Token-Hash, OTP-Erzeugung | Unit |
| `tests/unit/access-levels.test.ts` | Entitlement-Matrix free/trial/member/admin; **Sprint 11:** `trial` = `free` + `demoAccess`, keine echten Mitglieder-/Geschäftsrechte, `member`/`admin` nie `demoAccess` | Unit |
| `tests/unit/membership-plans.test.ts` | 24,99 €/249,90 €, Jahresvorteil, Provider-Status-Mapping; **Sprint 5**: Preisstrings (`formatMoney`) und Homepage-Hinweis in DE/EN zitieren exakt die SoT-Preise | Unit |
| `tests/unit/trial-rules.test.ts` | 48 h, Verbindungslimit-Konstante, OTP-Grenzen; **Sprint 11:** Demo-Semantik statt `TRIAL_VISIBLE`-Mengen | Unit |
| `tests/unit/demo-discover.test.ts` | **Sprint 11:** Demo-Profile nutzen gültige Slugs der echten Taxonomie (Interessen/Ziele) mit DE/EN-Paar, Avatare nur aus dem freigegebenen Satz oder neutral, Demo-Deals/-Jobs/-Investments ohne abgeschlossene Zustände/Renditeversprechen; `demoDiscoverCandidate` (Präfix-ID `demo:`), `demoDiscoverResults` mit den echten Filtern (Standort, Rolle DE/EN, Interesse, Branche, Investmentinteresse, Typ, Umkreis) und Sortierung nach Interessen/Zielen des Betrachters | Unit |
| `tests/integration/discovery-demo.test.ts` | **Sprint 11 – komplette Journey:** verifiziert ohne Demo (Zustand 3) → Onboarding speichert Interessen und startet die Demo genau einmal (48 h, zweiter Start abgelehnt) → Discover/Network/Chancen/Jobs/Investments rendern nur Demo (keine echten Handles im Elementbaum, Filter + Leerzustand, Sortierung nach eigenen Interessen) → Demo-Profil offen, echtes Profil gesperrt → Connect/Follow/Bewerbung/Interesse serverseitig `membershipRequired`, Datenbank vorher = nachher, Demo-IDs ungültig → echtes Event mit realer Kapazität lesbar (19 von 20 Plätzen frei), Sperrkarte statt Formular, `applyToEventAction` abgewiesen, Mitglied kann sich weiterhin anmelden → Ablauf lazy, `already_used`, erneutes Onboarding legt keinen zweiten Trial an, Demo-Seiten gesperrt, eigenes Profil/Events/Billing erreichbar → Checkout ohne Provider und ohne Dev-Schalter legt keine Mitgliedschaft an → Mitglied sieht echte Daten, nie Demo | Integration (DB, `flags.devMembershipActivation=false` gemockt) |
| `tests/unit/i18n-parity.test.ts` | DE/EN gleiche Struktur, keine leeren Strings | Unit |
| `tests/integration/auth-flow.test.ts` | Registrierung, OTP-Verifizierung, Login-Routing, Recovery (Dev-Postausgang); **Sprint 5**: fehlende/ungültige Login-Eingaben als Feldfehler, identische Antwort für unbekanntes Konto und falsches Passwort (keine Enumeration), gesperrte Konten (`accountSuspended`), Passwortregeln-Fehlercodes beim Reset (`passwordTooShort`/`passwordNeedsBoth`/`passwordMismatch`) | Integration (DB) |
| `tests/unit/password-rules.test.ts` | **Sprint 5**: eine gemeinsame Quelle für Client-Checkliste und Server-Validierung (≥10 Zeichen, Buchstabe + Ziffer), Regelzustände pro Zeichen, gleiche Fehlercodes wie die Actions, DE/EN-Beschriftungen für jede Regel | Unit |
| `tests/unit/auth-error-messages.test.ts` | **Sprint 5**: jeder von `src/app/actions/auth.ts` zurückgebbare Fehlercode hat eine echte DE- **und** EN-Meldung (oder dokumentiertes Handling), Feldfehler-Codes vorhanden, `serverError`-Meldung vorhanden | Unit (Quelltext + Wörterbücher) |
| `tests/integration/onboarding.test.ts` | Interessen/Ziele per ID **und** Slug, Trial startet genau einmal, unverifiziert/anonym abgewiesen | Integration (DB) |
| `tests/integration/trial.test.ts` | Trial-Start, einmal pro Konto, Fingerprint-Missbrauch, Anfragenlimit | Integration (DB) |
| `tests/integration/membership.test.ts` | Aktivierung, Karte, Kündigung zum Periodenende, Ablauf, Zahlungsfehler, Rechnungs-Idempotenz | Integration (DB) |
| `tests/integration/webhook.test.ts` | ohne Signatur/Secret niemals ein „verifiziertes" Event | Integration (DB) |
| `tests/integration/messaging-authorization.test.ts` | Messaging nur zwischen bestätigten Verbindungen, Blockierung in beide Richtungen | Integration (DB) |
| `tests/integration/message-delivery.test.ts` | produktionsnaher Zustand → ehrliches `none`, kein hängender Code, `ENABLE_DEV_OUTBOX` + Allowlist, Code nie an den Browser, Cooldown ≠ fehlender Versandweg, Outbox-Link nur Admin | Integration (DB) |
| `tests/unit/discover-matching.test.ts` | **Sprint 3**: `scoreMatch`/`rankCandidates` (Interessen, Ziele, Branche, Suche↔Biete, Rolle, Skill, Standort, Firma), Filter nach Rolle/Branche/Standort/Interesse/Typ, **UX-Nachtrag**: „Ich suche“/„Ich biete“, Investmentinteressen, Umkreis (`geocodeLocation`/`haversineKm` über gebündelte Städtetabelle, inert ohne auflösbaren Ursprung), `matchPercentFromScore`-Grenzen | Unit |
| `tests/unit/event-permissions.test.ts` | **Sprint 3**: keine `eventsCreate`-Freigabe in der Matrix, keine `insert`/`update`/`delete` auf `events` in Server-Actions, deaktivierter Create-Eintrag in `AppShell`, Kuratoren-Hinweis auf `/app/events` | Unit (Quelltext) |
| `tests/integration/connection-request.test.ts` | **Sprint 3**: Anfrage **ohne** Nachricht wird abgelehnt (`connectionMessageRequired`), mit gültiger Nachricht wird `ConnectionRequest` + Benachrichtigung geschrieben; **Sprint 11:** Fixtures sind Mitglieder (ein Trial sendet keine echten Anfragen mehr) | Integration (DB) |
| `tests/integration/profile-preferences.test.ts` | **Sprint 3**: „Ich biete" wird gespeichert, Kennzahlen-Sichtbarkeit je Metrik (ungültige Werte verworfen, Fallback `performanceVisibility`), Interessen/Ziele nach dem Onboarding änderbar | Integration (DB) |
| `tests/integration/resend-provider.test.ts` | konfigurierter `RESEND_API_KEY` → Versand über die Resend-API (Endpoint, Auth-Header, Absender `EMAIL_FROM` bzw. `onboarding@resend.dev`), Code bleibt gültig, Ablehnung durch Resend → ehrliches `send_failed` + Entwertung, „Code erneut senden" geht an Resend statt in den Postausgang | Integration (DB, `fetch` gestubbt) |
| `tests/unit/network-demo-supplement.test.ts` | **Sprint 7**: Mixing-Regeln des Netzwerks (Mitglieder) – leere echte Liste → komplette Demo-Sammlung (8), kleine Listen auf Ziel-Total 8 aufgestockt, Limit respektiert, **ab 8 echten Mitgliedern automatisch Rückzug**; `filterDemoProfiles` (Suche Name/Firma/Positionierung DE+EN, Rolle DE+EN, Standort, Interesse DE- oder EN-Label, AND-Semantik); `demoProfileHandle` (Diakritik-Normierung) | Unit |
| `tests/integration/network-directory.test.ts` | **Sprint 7**: `listDirectoryMembers` zeigt echte Mitglieder (nie sich selbst), **richtungsabhängige Anfrage-Zustände** (`outgoingRequestId` beim Sender, `incomingRequestId` beim Empfänger), Zurückziehen nur vom Sender (freit den Zustand), Ablehnen → keine Connection, Annehmen → Connection, Rolle-Filter via `jobTitle`/`rolesJson`, Standort-Filter | Integration (DB) |
| `tests/integration/core-loop.test.ts` | **Sprint 8**: vollständiger Core Loop – Annehmen → Connection + Notification-Deep-Link `/app/inbox?tab=requests&sub=connections` + **kein implizites Follow**; Ablehnen → keine Connection/Follow + neutraler Hinweis + Trial-Slot frei; Zurückziehen nur vom Sender + Trial-Slot frei; `connectionRequestState()` richtungsabhängig; `forYouItems()` zeigt nur echte Daten (Anfrage, passendes Mitglied ohne offene Anfrage, neueste Chance), max. 5 Einträge; `interestLabelsFor()` je Locale | Integration (DB) |

### 3a. Neue Tests (Sprint 12)

| Datei | Umfang | Art |
| ----- | ------ | --- |
| `tests/unit/beta-keys.test.ts` (7) | Format `ICB-XXXX-XXXX-XXXX-XXXX` aus dem eindeutigen Alphabet, 2 000 Schlüssel ohne Kollision, alle 80 Zufallsbits genutzt, Normalisierung (Groß-/Kleinschreibung, Leerzeichen, Präfix, Crockford-Verwechsler), Ablehnung unmöglicher Eingaben, Hinweis zeigt max. 4 Zeichen, Dauer 1…365 (Standard 30) | Unit |
| `tests/unit/beta-grant.test.ts` (7) | Beta-Grant enthält **genau** die Networking-Rechte; für `free`/`trial` bleiben alle bezahlten Geschäftsrechte aus; Mitglieder/Admins unverändert, nie „bezahlt“; Privatsphäre-Regeln (reduzierte Karte, Kontaktlinks nur für Kontakte, Standort/Kennzahlen nach Schalter) | Unit |
| `tests/unit/stripe-worker-signature.test.ts` (3) | asynchrone Signaturprüfung funktioniert, synchrone Variante scheitert im Worker-Build (Begründung für `constructEventAsync`), gefälschte Signatur abgelehnt | Unit |
| `tests/integration/beta-access.test.ts` (18) | Schlüssel nur als Hash; Einlösen → sofort Networking, keine Mitgliedschaft/kein Admin/nicht bezahlt; Dauer pro Schlüssel; ungültig/unbekannt/benutzt/deaktiviert/abgelaufen/falsche E-Mail; unverifiziert + Mitglieder lösen nicht ein (Schlüssel bleibt frei); Brute-Force-Limit; kein Stapeln; **Race:** zwei Konten, ein Schlüssel → genau einer gewinnt; ein Konto, zwei Schlüssel → ein Grant, anderer Schlüssel zurückgerollt; Ablauf entzieht sofort, neue Session bringt nichts zurück; Admin widerruft/verlängert; Mitglied unberührt; alle Admin-Actions für Nicht-Admins (inkl. Tester/Mitglieder) abgewiesen; Admin-Seite ohne Klartextschlüssel | Integration (DB) |
| `tests/integration/beta-networking.test.ts` (15) | kompletter Flow Discover → Profil → Anfrage mit Nachricht → Annehmen → Chat (persistiert, ungelesen, privat); gegenseitige Anfrage → eine Verbindung; gleichzeitige Anfragen/Annahmen/„Chat öffnen“ → eine Verbindung, ein Chat; Selbst/verbunden/unbekannt/gelöscht/Demo/blockiert/geschlossen abgewiesen; abgelaufene Beta (kein Senden, nicht kontaktierbar, Kontakte + Verlauf bleiben, Ablehnen möglich); Ablehnen ohne Push + Cooldown; Zurückziehen entfernt Hinweis; Trennen/Wiederverbinden; unsichtbare Profile/verborgener Standort; Kontaktlinks nur für Kontakte; Demo/Echt strikt getrennt; ehrlicher Leerzustand ohne Demo-Füller/Match-%; keine Benachrichtigung pro Nachricht | Integration (DB) |
| `tests/integration/beta-network-d1.test.ts` (4) | dieselben kritischen Pfade gegen **echte D1 in workerd** (Miniflare): Einlösen race-sicher (`UPDATE … RETURNING`, `UPSERT … WHERE`), Widerruf/Verlängerung/Admin-Übersicht, Verzeichnis nur echte Teilnehmer, ein Chat bei parallelen Aufrufen + Ungelesen-Zähler | Integration (D1) |
| `tests/integration/profile-save.test.ts` (4) | alle Profilfelder inkl. Website/X/Instagram werden gespeichert und wirklich geleert (Sprint-12-Fix: falsche Formularschlüssel), nur der Name ist Pflicht, unsichere Link-Schemata abgewiesen, geführtes Beta-Onboarding führt weiter zu Discover | Integration (DB) |
| `tests/integration/stripe-webhook-route.test.ts` (2) | signierte Events gegen die echte Route: abgeschlossener, aber unbezahlter Checkout aktiviert **nicht**, `async_payment_succeeded` aktiviert; bezahlter Checkout aktiviert, `subscription.deleted` beendet ohne 500 | Integration (DB) |

Erweitert (zweite Prüfrunde): `discover-matching` (+1, **Businessziel-Filter**:
Slug, kombinierbar, deterministisch, `hasActiveFilters`) und `demo-discover`
(+1, derselbe Filter auf den Demo-Profilen).

Angepasst: `access-matrix` (Beta-Zeilen), `core-loop`, `discovery-demo`,
`for-you-d1` (gemeinsame D1-Hilfen in `tests/d1-helpers.ts` statt fest
kodierter Migrationsliste), `tests/helpers.ts` (Beta-Fixtures).

### 3b. Browser-E2E gegen den Worker-Preview (Sprint 12)

**Skript im Repo:** `tests/e2e/sprint12-browser.mjs` (nicht Teil von
`npm test`, **keine** neue Projektabhängigkeit – `playwright-core` und
`@sparticuz/chromium` werden außerhalb des Repos installiert; Aufruf und
Voraussetzungen stehen im Kopf der Datei). Es läuft gegen `npm run cf:build` +
`opennextjs-cloudflare preview` (workerd, lokale D1, `NEXTJS_ENV=production`,
Dev-Postausgang nur für `@innercircle.test`) und verweigert jede andere
Adresse als localhost.

**Testkonten:** sechs klar gekennzeichnete Konten pro Lauf
(`<rolle>-<lauf>@innercircle.test`, Namen mit „(Testkonto)“, Firmen
„(fiktiv)“): Admin, drei Beta-Tester (Anna, Ben, Carla), eine Free-/Demo-
Nutzerin (Dora) und ein zahlendes Mitglied (Mia). Registrierung und
E-Mail-Verifizierung laufen über die echte UI; der Code kommt aus dem
Dev-Postausgang (Tabelle `DevOutbox`, derselbe Inhalt wie `/dev/outbox`).

**Datenbank-Eingriffe (bewusst, dokumentiert):** Admin-Rolle über das
vorhandene `scripts/admin-bootstrap.ts --local`; Einlöse-Frist eines Schlüssels,
`BetaAccess.endsAt` und danach `Trial.expiresAt` eines Testers in die
Vergangenheit (Tage abwarten ist nicht möglich); **eine** Test-Mitgliedschaft
(Provider `dev`) für die Mitglieds-Prüfung, weil Stripe nicht konfiguriert ist
– es wird nirgends eine Zahlung simuliert. Alle übrigen SQL-Zugriffe sind nur
lesend.

**Letzter Lauf: 65/65 Prüfungen bestanden (Lauf 827861, Build #8; Ergebnisliste `preview/sprint12/e2e-results-827861.json`)** (Desktop 1440×900, Mobil 390×844, DE + EN, hell +
dunkel). Geprüft:

- **Admin & Schlüssel:** `/admin/beta` nur für Admins; 5 persönliche
  Schlüssel im Format `ICB-XXXX-XXXX-XXXX-XXXX`; DB enthält nur 64-stelligen
  Hash + 4-stelligen Hinweis, nie den Schlüssel; unbenutzten Schlüssel in der
  UI deaktivieren.
- **Einlösen:** unbekannter Schlüssel → klare Meldung; alte Meldung
  verschwindet beim Tippen; Einlösen mit Kleinbuchstaben/Leerzeichen → sofort
  Zugang, geführter Profilschritt; separater 30-Tage-Zugang ohne
  `Membership`-Zeile, Rolle bleibt `user`.
- **Abweisungen:** bereits benutzter, deaktivierter und abgelaufener Schlüssel
  (je eigene Meldung); **Brute-Force-Sperre** beim 9. Versuch in einer Stunde;
  kein Fehlversuch erzeugt einen Zugang.
- **Free-/Demo-Nutzer:** Discover und Verzeichnis nur mit gekennzeichneten
  Beispielprofilen + Closed-Beta-Hinweis, kein echtes Mitglied; direkte URL
  eines echten Profils bleibt gesperrt; mobil ohne horizontales Scrollen.
- **Discover (echt):** bester Treffer ist das passende echte Mitglied, ohne
  Prozentwerte/Demo, zweispaltige Karte; **Businessziel-Filter** über das
  echte Formular mit Chip; Filter kombinierbar (Ziel UND Standort → ehrlicher
  Leerzustand); Zurücksetzen stellt die Reihenfolge wieder her; Verzeichnis
  nur echte Tester; mobil ohne horizontales Scrollen.
- **Kernablauf mit zwei echten Testkonten:** Profil (eigene Angaben) →
  Kontaktanfrage mit Nachricht → „Anfrage gesendet“ nach Reload, genau eine
  gespeicherte Anfrage → Badge 1 beim Empfänger → Anfrage mit Nachricht in der
  Inbox → **Annehmen öffnet den Chat** mit der Anfragenachricht → genau eine
  aufgelöste Anfrage-Mitteilung, keine Mitteilung pro Nachricht, Badge wieder
  0 → Antwort erscheint per Polling ohne Reload → Inbox mit Partner + Vorschau
  → „Nachricht“ vom Profil öffnet denselben Chat (eine Konversation pro Paar).
- **Sicherheit:** HTML in Nachrichten wird als Text angezeigt, nie ausgeführt
  (XSS); Drittkonto kann den Chat nicht öffnen; alle fünf `/admin`-Routen
  leiten Tester **und** Mitglieder um (10/10); `/dev/outbox` zeigt
  Nicht-Admins weder Codes noch Empfänger; ohne Session leiten App- und
  Admin-Routen zum Login.
- **Zahlendes Mitglied:** sieht das echte Netzwerk ohne Schlüssel,
  `/app/beta` erklärt „kein Schlüssel nötig“ (kein Formular), echte
  Geschäftsbereiche statt Demo, nie eine Beta-Zeile.
- **Widerruf (Admin):** Admin sieht die drei Tester (nicht das Mitglied) und
  beendet einen Zugang; danach Ende-Hinweis, keine echten Mitglieder in
  Discover/Verzeichnis, Profile gesperrt; neue Session (Cookies gelöscht, neu
  eingeloggt) stellt nichts wieder her.
- **Ablauf:** Verlauf lesbar, kein Eingabefeld, Discover mit Ablaufhinweis,
  Kontakte bleiben (Inbox → Kontakte), Tester wird anderen nicht mehr
  vorgeschlagen; **nach Ende der 48-h-Demo** (realistischer Zustand nach
  30 Tagen) Sperrseite mit Ende-Hinweis und Link zum Posteingang – weder Demo
  noch Mitglieder.
- **Tote Links:** alle internen Links auf 17 App-Seiten für einen Tester und
  eine Demo-Nutzerin per GET geprüft – keiner liefert ≥ 400.
- **Protokolliert, kein Prüfkriterium:** Ein aktiver Kontakt kann einem
  abgelaufenen Tester weiterhin schreiben (siehe K-22).

**Screenshots** (`preview/sprint12/`, alle aus dem letzten Lauf): 01/01b/01c
Discover, Verzeichnis, Businessziel-Filter (Desktop) · 02/02b mobil · 03/03b/03c
Einlösen, Willkommens-Profil, deaktivierter Schlüssel · 04/04b echtes Profil
(hell DE, dunkel EN) · 05 eingehende Anfrage · 06/06b/06c Chat nach Annahme
(Desktop, mobil, dunkel EN) · 07/07b/07c Discovery-Demo (Desktop, Dashboard,
mobil) · 08/08b Admin (Schlüssel erstellt, Verwaltung) · 09/09b/09c beendet,
abgelaufen mit lesbarem Chat, abgelaufen nach der Demo · 10 Dashboard Tester ·
11 Mitglied ohne Schlüssel.

### 3c. CPU-Zeit und Worker-Limits (Sprint 12, lokal gemessen)

**Methode:** V8-Sampling-Profiler (50 µs) über den Inspector des lokalen
Worker-Previews (`ws://127.0.0.1:9229/ws`, Origin-Header nötig); CPU = alle
Samples außer „(idle)“. Kalibrierung: 1 s ohne Request = **0,0 ms** CPU.
Seitenaufrufe: je 1 Aufwärmen + 5 Messungen, Median (Maximum in Klammern).
Startphase: `wrangler check startup`. Messskript: `tests/e2e/cpu-profile.mjs`
(Aufruf im Dateikopf).

| Messung (lokal, Sandbox-CPU) | CPU-Zeit |
| ---------------------------- | -------- |
| Worker-Startphase (`wrangler check startup`) | 50,0 ms aktiv (inkl. 1,4 ms GC) |
| `GET /` (öffentliche Startseite) | 9,1 ms (10,1) |
| `GET /app` (Dashboard, Tester) – vorbestehend | 52,8 ms (67,1) |
| `GET /app/discover` (echtes Netzwerk) | 67,5 ms (68,8) |
| `GET /app/discover?goal=…&location=…` | 44,8 ms (62,5) |
| `GET /app/network` (Verzeichnis) | 61,5 ms (68,9) |
| `GET /app/people/<handle>` (Profil) | 47,8 ms (51,9) |
| `GET /app/inbox?tab=messages&c=…` (Chat) | 56,7 ms (61,3) |
| `GET /app/beta` | 44,2 ms (48,3) |
| `GET /admin/beta` | 42,6 ms (53,5) |
| `POST` Login inkl. Aufbau von `/app` – vorbestehend (davon eindeutig scrypt: ~47–56 ms, Rest siehe K-24) | 620–660 ms |

**Einordnung** (Cloudflare-Limits, Stand der Doku 05.09.2026,
<https://developers.cloudflare.com/workers/platform/limits/>): CPU pro
HTTP-Request **Free 10 ms**, **Paid 30 s Standard (bis 5 min)**; Startzeit
**1 s**; Speicher 128 MB pro Isolate. Die Sprint-12-Seiten liegen in derselben
Größenordnung wie das vorbestehende Dashboard, die Startphase weit unter 1 s.
Seitenaufbau und vor allem die Login-Aktion überschreiten das Free-Limit
bereits **vor** Sprint 12 → **Workers Paid ist Voraussetzung** (K-24). Nicht gemessen: Cloudflare-Hardware (die Sandbox-CPU ist vermutlich
langsamer), Kaltstarts im Edge-Betrieb, Last.

**Testinfrastruktur:** `tests/global-setup.ts` löscht `.test.db`, erzeugt das
Schema per `drizzle-kit push`; `tests/setup.ts` setzt `AUTH_SECRET`, Test-DB,
Dev-Flags, löscht `STRIPE_*`/`RESEND_*` und vergibt pro Testdatei eine eigene
Fake-IP (Rate-Limits addieren sich nicht über Dateien).
Stubs: `server-only` und `next/headers` (`tests/stubs/*`).

## 4. Testmatrix (Bereiche × Abdeckung)

Legende: **AUT** = automatisiert vorhanden · **MAN** = manuell verifiziert
(dokumentiert in [`archive/04-progress-log.md`](archive/04-progress-log.md)) ·
**OFFEN** = nicht abgedeckt.

| Bereich | Prüfpunkt | Status |
| ------- | --------- | ------ |
| Public | Startseite lädt (DE/EN), Navigation, alle Routen erreichbar | MAN (HTTP-Smoke 25 Routen war grün) |
| Public | DE/EN-Umschaltung + Persistenz | OFFEN (nur Dictionary-Parität AUT) |
| Public | Light/Dark/System + Persistenz | OFFEN |
| Public | Responsive 320–430 px, kein horizontales Scrollen | MAN (Sprint 11: Screenshots 390/768/1440/1920 mit headless Chromium, `scrollWidth === clientWidth` geprüft) |
| Zugang | Discovery-Demo: keine echten Profile/Deals ohne Mitgliedschaft, simulierte Anfrage ohne Datenbankzeile, echte Events lesbar + Anmeldung serverseitig gesperrt, Ablauf ohne Neustart, Mitglied unverändert, keine Mitgliedschaft ohne bestätigte Zahlung | AUT (Sprint 11: `discovery-demo.test.ts`, `access-matrix.test.ts`) + MAN (HTTP-Prüfung der Seiten inkl. RSC-Payload mit Trial-Cookie) |
| Public | Bilder werden ausgeliefert | MAN |
| Auth | Registrierung (Erfolg, Validierungsfehler, E-Mail belegt) | AUT |
| Auth | Verifizierung (OTP korrekt, falsch, abgelaufen, zu viele Versuche) | AUT |
| Auth | Login-Routing (unverifiziert → `/verify`, verifiziert → `/onboarding` bzw. `/app`) | AUT |
| Auth | Login-Fehlermeldungen (Feldfehler, keine Enumeration, `accountSuspended`, DE/EN-Abdeckung aller Codes) | AUT (Sprint 5) |
| Auth | Passwortregeln identisch in UI-Checkliste und Server-Validierung (≥10 Zeichen, Buchstabe + Ziffer) | AUT (Sprint 5) |
| Auth | Logout/Session-Widerruf | OFFEN (Code vorhanden, kein Test) |
| Auth | Passwort-Reset (Antwort ohne Enumeration, Token, Session-Widerruf) | AUT (teilweise: Request + Token-Fluss) |
| Auth | Rate-Limits greifen (Register/Login/Verify/Forgot) | AUT indirekt (Limits im Code, Tests nutzen eigene IPs) |
| Auth | E-Mail-Zustellung über echten Provider | OFFEN / BLOCKED (kein Key) |
| Auth | Google/Apple-Login | nicht implementiert |
| Trial | Interessen-Auswahl speichert | AUT |
| Trial | Trial startet genau einmal, 48 h, Flag-Abhängigkeit | AUT |
| Trial | Trial-Ablauf und Rückfall auf `free` | AUT (Regeln) / MAN (lazy Expiry im UI) |
| Trial | Einschränkungen (3 Anfragen, kein Messaging/Posten) | AUT (Entitlements) + MAN |
| Member | Dashboard lädt | MAN |
| Member | Profil ansehen/bearbeiten | MAN (Action-Test nicht vorhanden) |
| Member | Follow / Connect / Annehmen / Ablehnen / Zurückziehen | AUT (Autorisierung) + MAN |
| Network (Sprint 7) | Mitglieder: echte Mitglieder zuerst, Demo-Ergänzung < 8 echt, Rückzug ≥ 8 echt; Discovery-Demo: nur Demo-Profile (Sprint 11) | AUT (`network-demo-supplement`, `discovery-demo`) + MAN (HTTP-Check: 1 echt → 7 Karten, 8 echt → keine Demo; Trial-Cookie → 8 Demo-Karten, kein echtes Handle im HTML/RSC) |
| Network (Sprint 7) | Verbindungsstatus auf der Karte: gesendet → „Anfrage gesendet" + Zurückziehen, erhalten → Annehmen/Ablehnen | AUT (`network-directory`) + MAN |
| Network (Sprint 7) | Filter Suche/Rolle/Standort/Interesse wirken auf echt + Demo | AUT (Demo-Filter) + MAN (HTTP-Check `?role=`/`?location=`) |
| Network (Sprint 7) | „Profil ansehen" auf Demo-Karte → `/app/people/demo/[key]`, Connect erzeugt keine Anfrage (Demo-Meldung) | MAN (HTTP-Check: 200 + Badge + keine DB-Zeile) |
| Member | Messaging nur mit Verbindung | AUT |
| Member | Notifications lesen/als gelesen markieren | MAN |
| Member | Mitgliedskarte + öffentliche Verifizierung | MAN |
| Member | Paywall-Weiterleitungen | MAN |
| Business | Opportunity anlegen/veröffentlichen | MAN |
| Business | Bewerbung + Antwort des Owners | MAN |
| Business | Deal Rooms | nicht implementiert |
| Marketplace | Listing anlegen (Kurse erzeugen `Course`) | MAN |
| Marketplace | Kurs-Enrollment + Lektionsfortschritt | MAN |
| Marketplace | Kauf/Bezahlung | nicht implementiert |
| Investments | Einreichen + Admin-Freigabe + Sichtbarkeit | MAN |
| Investments | Absichtserklärung | MAN |
| Events | Bewerbung/Abbestätigung mit Authentifizierung | AUT (Autorisierung) + MAN |
| Trust | Leerer Score ohne Bewertungen | MAN |
| Admin | Zugriff nur mit Rolle `admin` (307 sonst) | MAN |
| Admin | Sperren, Founding Member, Prüfungen, Audit-Einträge | MAN |
| Infra | D1-Schema/Migration anwenden (`--local`) | AUT-ähnlich via global-setup (drizzle-kit push) |
| Infra | Cloudflare-Build (`npm run cf:build`) | MAN (in dieser Session erneut grün) |
| Infra | Deploy (`cf:release`) inkl. Migrationen | MAN (Gründer, Dashboard) |
| Infra | Typecheck/Lint | AUT (`typecheck` grün, `lint` mit bekannten Hinweisen) |

## 5. Nicht abgedeckt (bewusst)

- **Browserverhalten:** Hamburger-Menü, Theme-Wechsel, Swipe-Gesten,
  Fokus-Fallen bleiben manuelle Prüfung. Seit Sprint 11 sind Screenshot-
  Prüfungen (Breakpoints, Dialog-Flows) mit einem headless Chromium außerhalb
  des Repos möglich (nicht Teil der Testsuite, kein neues Repo-Paket).
- **Server Actions mit Next-Request-Kontext** (Registrierung, Login, Connect)
  laufen in Tests über die Service-Ebene; der vollständige HTTP-Pfad wird
  manuell gegen `npm run cf:preview` geprüft.
- **Externe Provider** (Resend, Twilio, Stripe live): erst nach Schlüsseln
  testbar; bis dahin gilt die Regel „ehrlicher Zustand statt Fake-Erfolg".
  Stripe ist über signierte Test-Events gegen die echte Route abgedeckt
  (§3a), **nicht** gegen Stripe selbst.
- **Sprint 12:** CPU-Zeit nur **lokal** gemessen (§3c), nicht auf
  Cloudflare-Hardware und nicht unter Last; die D1-Migration `0002` ist nur
  **lokal** angewendet (frische Kette geprüft), nicht auf der Produktions-D1;
  Swipe-Gesten und echte Mobilgeräte (iOS/Android) nicht geprüft – nur
  Chromium mit mobilem Viewport; Stripe nur mit signierten Test-Events.

## 6. Testdaten-Regel

Testkonten klar kennzeichnen (z. B. `…@innercircle.test`), niemals als echte
Mitglieder oder Erfolge präsentieren. Keine Produktionsdaten in Tests.
Seed-Daten sind fiktiv und im Schema als Demo markiert (`isDemo`, `seedTag`).
