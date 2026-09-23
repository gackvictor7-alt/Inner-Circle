# 08 – Test- und Qualitätssicherung

**Stand:** 2026-09-24 (Sprint 11 – Discovery-Demo + Homepage-Sektion) · Lauf
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

## 6. Testdaten-Regel

Testkonten klar kennzeichnen (z. B. `…@innercircle.test`), niemals als echte
Mitglieder oder Erfolge präsentieren. Keine Produktionsdaten in Tests.
Seed-Daten sind fiktiv und im Schema als Demo markiert (`isDemo`, `seedTag`).
