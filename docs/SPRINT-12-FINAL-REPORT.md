# Sprint 12 – Abschlussbericht: Private Beta & Real Networking

**24.09.2026 · Fortsetzung, kein neuer Sprint · Review ausstehend · nicht gemergt**

## Ergebnis

**Der vollständige Networking-Ablauf mit zwei getrennten Testkonten funktioniert
in der tatsächlichen lokalen Worker-Preview.** 82/82 Browserchecks und
246/246 Unit-/Integrationstests bestanden. Die technische Prüfung ist mit
Ausnahme der unveränderten, bekannten Lint-Baseline erfolgreich. Das ist
**keine uneingeschränkt grüne Gesamtpipeline und keine Produktionsfreigabe**.

Ausgangsbasis geprüft: `git merge-base --is-ancestor
6eebc3d5b8ec9619959ff5515ccf3f0d36171b68 HEAD` erfolgreich, sauberer Arbeitsbaum,
Arbeitsbranch `arena/01a0d501-inner-circle`. Nicht von altem main gestartet.

## Erfolgreich getestet

Anna und Ben durchlaufen in getrennten Browser-Kontexten:

1. Registrierung über die echte UI.
2. E-Mail-Verifizierung mit echtem OTP aus dem **lokalen Dev-Postausgang**.
3. Onboarding, Interessen/Ziele, unveränderte Secure-/HttpOnly-Session und Reload.
4. Persönlichen Beta-Key einlösen, geführtes Profil speichern.
5. Echte Daten des anderen Testkontos in Discover und im Profil entdecken.
6. Kontaktanfrage mit persönlicher Nachricht senden; Badge, Persistenz prüfen.
7. Anfrage im Empfängerkonto annehmen und Chat öffnen.
8. Nachrichten austauschen; Nachrichten bleiben erhalten, kein zweiter Chat
   beim erneuten Öffnen; HTML/XSS-Testinhalt wird nur als Text angezeigt.

Zusätzlich Admin, weiteres Beta-Konto, Free-Demo und reguläres Mitglied:
- Keys: HMAC statt Klartext, einmalig, Einlösefrist, deaktiviert/benutzt/ungültig,
  serverseitige Prüfung; parallele Einlösungen in Integrationstests inkl. D1.
- Beta: separater 30-Tage-Zugang, **keine Membership-Zeile, keine Zahlung,
  Rolle weiterhin user**. Widerruf/Ablauf entziehen Netzwerkzugang; erneutes
  Login stellt ihn nicht wieder her.
- Free-Demo: keine echten Mitglieder in Discover/Verzeichnis, direktes Profil
  gesperrt, fremder Chat nicht abrufbar. Vier direkte RSC-Abrufe enthalten
  keine geprüften privaten Profil-/Nachrichtentexte.
- Mitglieder: Netzwerk ohne Key, keine Beta-Zeile, echte Geschäftsbereiche.
  Mitgliedschaft ausschließlich als lokale `provider=dev`-Fixture; **kein Testkauf**.
- Admin: Keys erstellen/deaktivieren, Tester widerrufen; fünf Admin-Routen
  für Tester und Mitglied gesperrt (10/10); anonym zum Login; kein Dev-Outbox-Leak.
- 33 interne Links für Tester und 36 für Demo im authentifizierten Browser geprüft.

## Fehleranalyse und tatsächliche Änderungen

**Kein reproduzierter Session-Fehler in der Anwendung.** Das Onboarding schreibt
Profil/Taxonomie/Trial, widerruft aber keine Session. Bei allen sechs Konten
blieb derselbe Session-Cookie vorhanden; Hard-Reload blieb authentifiziert.

Korrigiert wurde der bestehende **Testaufbau**:
- Der bisherige Link-Crawl über `context.request.get` sendete Secure-Cookies
  über HTTP-Loopback nicht mit. Login-Redirects mit anschließendem HTTP 200
  erschienen dadurch fälschlich als erfolgreiche App-Links. Jetzt echte
  Browsernavigation; Login als Endziel ist ein Fehler.
- `cookies(http-URL)` blendete bei der neu ergänzten Session-Assertion vorhandene
  Secure-Cookies aus. Jetzt `cookies()` ohne diesen Filter (keine Tokens im Log).
- Die im Ausgangsstand vorhandene Warnung vor Chromium `--single-process`
  bleibt beachtet. Dieser historische Browserfehler wurde hier nicht erneut
  provoziert; eine endgültige Zuordnung des früheren Vorfalls allein dazu
  wäre nicht belegt.
- Falschen Testpfad `/app/academy` auf `/app/learn` korrigiert.
- Run-ID vollständig statt sechsstelliger Zeitrest; Beta-Key-Labels/SQL-Updates
  exakt auf den aktuellen Lauf begrenzt.
- 17 Assertions ergänzt: 12 Session/Reload, 3 Mobile-Overflow, 2 Free/RSC.
- Screenshots neu aufgenommen; Mobile-Beta-Key, -Profil, -Anfrage ergänzt.

**Keine Änderungen an `src/`, Homepage, Styles, Produktfunktionen, Schema,
Migrationen, Paketabhängigkeiten oder Produktionskonfiguration.** Kein
unbegründeter Auth-Fix und kein erneuter Sprint-12-Neubau.

## Technische Checks

| Check | Ergebnis |
|---|---|
| Typecheck (`npm run typecheck`) | PASS, Exit 0 |
| Gesamte Testsuite (`npm test`) | PASS, 35 Dateien / 246 Tests |
| Relevante Integrationstests | PASS als Teil der Suite: Auth/Onboarding, Beta-Zugang, Networking, Rechte-Matrix, Demo, Messaging, D1-Races/Migrationen, signierte Stripe-Route |
| i18n (`npm run test:keys`) | PASS, 616 Referenzen in 196 Dateien, DE/EN vorhanden |
| Lint (`npm run lint`) | **FAIL, Exit 1: 5 Fehler / 7 Warnungen**, Ausgabe byte-identisch zur vor Änderung gemessenen Basis (K-15) |
| Cloudflare (`npm run cf:build`) | PASS |
| Build + Wrangler (`npm run cf:dry-run`) | PASS, 9287,12 KiB / gzip 1859,11 KiB, DB/ASSETS/NEXTJS_ENV |
| Frische lokale D1-Migrationskette + Bootstrap | PASS, 0000 → 0001 → 0002, ausschließlich `--local` |
| Browser im gebauten Worker | PASS, **82/82**, Run `1790281164922` |
| Mobile | Beta-Key, Discover, Verzeichnis, Profil, Anfrage, Chat ohne horizontales Overflow bei 390 px |
| Hell/Dunkel, DE/EN | Screenshots der vorhandenen Varianten; englisches Chat-Label geprüft |

Lint wurde bewusst nicht durch Abschalten von Regeln oder Änderungen an
unbeteiligten eingefrorenen Bereichen „grün gemacht“. Die fünf Fehler liegen
in Seed, Events, SiteHeader, StatsSection und Auth-Presence; keine Regression.
Der Review-PR kennzeichnet diese Baseline-Ausnahme ausdrücklich, nicht als PASS.

**Zwischenläufe transparent:** zuerst 74/80 (falscher Cookie-Filter), danach
80/80. Nach den zusätzlichen Free/RSC-Checks einmal 62/63 mit Abbruch eines
lokalen Wrangler-SELECT; derselbe SELECT danach erfolgreich. Abschließender
vollständiger Lauf unverändert 82/82. Fehlende Browserbibliotheken wurden
außerhalb des Repos bereitgestellt. Keine echten Daten wurden verwendet.

[Technische Protokolle](../preview/sprint12/checks/) ·
[Einzelne Browser-Ergebnisse](../preview/sprint12/e2e-results-final.json).

## Offen / nicht getestet / Deployment-Grenzen

- **Lint weiterhin rot (K-15)**; ausstehende Gründerprüfung und ausdrückliche Merge-Freigabe.
- Kein echter E-Mail-Provider-Versand: OTP-Verifizierung lokal getestet,
  Zustellbarkeit/Absenderdomain nicht. Keine produktiven Stripe-Zahlungen.
- Keine Remote-D1-Migration, kein Deployment, kein Lasttest auf Cloudflare;
  Workers-Paid-Voraussetzung aus vorheriger CPU-Messung unverändert (K-24).
- Eigene bestehende Chats/Kontakte bleiben nach Beta-Ende lesbar; kein Schreiben
  durch den abgelaufenen Tester. Aktive Kontakte können weiter schreiben.
  Das ist das bestehende Produktverhalten, keine allgemeine Free-Freigabe
  fremder Nachrichten; Gründerentscheidung dazu noch offen (K-22).
- Lokale Preview meldet `Request.cf`-Fallback (Netzwerk), read-only Static-Cache
  und bei Navigation gelegentlich Broken-Pipe/Connection-reset. Keine
  fehlgeschlagene Funktionsprüfung im Abschlusslauf; diese Meldungen wurden
  nicht als behoben ausgegeben.
- Nur headless Chromium und mobile Viewports; kein echtes iOS/Android/Safari,
  keine Tastatur-/Swipe-Vollabnahme. Die Browser-Suite verlangt eine frische
  isolierte D1; sie ist kein gegen beliebige Bestandsdaten laufender Test.
- Weitere bekannte Sprint-12-Grenzen bleiben in `11-known-issues.md` K-22/24.

## Screenshots und Review

**[Screenshot-Galerie – Desktop und Mobile](../preview/sprint12/README.md)**

| Bereich | Desktop | Mobile |
|---|---|---|
| Beta-Key | [03](../preview/sprint12/03-beta-key-redemption.png) | [03d](../preview/sprint12/03d-beta-key-mobile.png) |
| Discover | [01](../preview/sprint12/01-network-discover-desktop.png) | [02](../preview/sprint12/02-network-discover-mobile.png) |
| Profil | [04](../preview/sprint12/04-real-member-profile.png) | [04c](../preview/sprint12/04c-real-member-profile-mobile.png) |
| Anfrage | [05](../preview/sprint12/05-incoming-request.png) | [05b](../preview/sprint12/05b-incoming-request-mobile.png) |
| Chat | [06](../preview/sprint12/06-chat-after-accept.png) | [06b](../preview/sprint12/06b-chat-mobile.png) |

Alle Dateien sind echte Screenshots des Abschlusslaufs, keine generierten
Mockups. Nur synthetische Testkonten, Initialen statt erfundener Mitgliederfotos.
Die Galerie enthält außerdem Dark/EN, Demo, Admin, Fehler- und Ablaufzustände.
SHA-256-Prüfsummen stehen in `preview/sprint12/screenshots-manifest.json`.

**Nicht automatisch mergen.** Der Stand wird auf dem Arbeitsbranch bereitgestellt;
Review gegen main erst nach den oben dokumentierten funktionalen Prüfungen,
mit offengelegter Lint-Ausnahme. Merge/Deploy ausschließlich nach Freigabe.
