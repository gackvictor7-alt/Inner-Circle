# 08 – Test- und Qualitätssicherung

**Stand:** 2026-09-21 (Sprint 5 – Mobile UX, Login-UX, Public-Polish) · Lauf auf
Branch `arena/01a0c5b7-inner-circle` (Basis `main` @ `c211e20`):
`npm test` = **20 Dateien / 106 Tests grün**, `npx tsc --noEmit` grün,
`npm run cf:build` grün, `npx wrangler deploy --dry-run` grün
(9 228 kB / gzip 1 850 kB, Bindings `DB`/`ASSETS`/`NEXTJS_ENV`),
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
| `tests/unit/access-levels.test.ts` | Entitlement-Matrix free/trial/member/admin | Unit |
| `tests/unit/membership-plans.test.ts` | 24,99 €/249,90 €, Jahresvorteil, Provider-Status-Mapping; **Sprint 5**: Preisstrings (`formatMoney`) und Homepage-Hinweis in DE/EN zitieren exakt die SoT-Preise | Unit |
| `tests/unit/trial-rules.test.ts` | 48 h, Verbindungslimit, OTP-Grenzen | Unit |
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
| `tests/integration/connection-request.test.ts` | **Sprint 3**: Anfrage **ohne** Nachricht wird abgelehnt (`connectionMessageRequired`), mit gültiger Nachricht wird `ConnectionRequest` + Benachrichtigung geschrieben, Trial-Limit wird verbraucht | Integration (DB) |
| `tests/integration/profile-preferences.test.ts` | **Sprint 3**: „Ich biete" wird gespeichert, Kennzahlen-Sichtbarkeit je Metrik (ungültige Werte verworfen, Fallback `performanceVisibility`), Interessen/Ziele nach dem Onboarding änderbar | Integration (DB) |
| `tests/integration/resend-provider.test.ts` | konfigurierter `RESEND_API_KEY` → Versand über die Resend-API (Endpoint, Auth-Header, Absender `EMAIL_FROM` bzw. `onboarding@resend.dev`), Code bleibt gültig, Ablehnung durch Resend → ehrliches `send_failed` + Entwertung, „Code erneut senden" geht an Resend statt in den Postausgang | Integration (DB, `fetch` gestubbt) |

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
| Public | Responsive 320–430 px, kein horizontales Scrollen | OFFEN (Prüfung nur über Tailwind-Klassen und Code-Review, kein Browser in der Sandbox) |
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
  Breakpoints, Fokus-Fallen. In der Sandbox ist kein Chromium installierbar;
  diese Punkte bleiben manuelle Prüfung.
- **Server Actions mit Next-Request-Kontext** (Registrierung, Login, Connect)
  laufen in Tests über die Service-Ebene; der vollständige HTTP-Pfad wird
  manuell gegen `npm run cf:preview` geprüft.
- **Externe Provider** (Resend, Twilio, Stripe live): erst nach Schlüsseln
  testbar; bis dahin gilt die Regel „ehrlicher Zustand statt Fake-Erfolg".

## 6. Testdaten-Regel

Testkonten klar kennzeichnen (z. B. `…@innercircle.test`), niemals als echte
Mitglieder oder Erfolge präsentieren. Keine Produktionsdaten in Tests.
Seed-Daten sind fiktiv und im Schema als Demo markiert (`isDemo`, `seedTag`).
