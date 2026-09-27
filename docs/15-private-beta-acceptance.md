# Private-Beta-Abnahme – 2026-09-27

Basis: neuester `origin/main` @ `901364079d7a928d90f45d2013c9d062025c2a01`.
Session-Branch: `arena/01a0e4b7-inner-circle`. Kein Merge/Deployment.

## Ergebnis und minimale Änderungen

- **Beta WORKING:** Admin legt einmalige Keys an, optional E-Mail-gebunden,
  Einlösefrist getrennt von Zugangslaufzeit. Registrierung → E-Mail-Code →
  Onboarding → Free/Demo → `/app/beta` → Einlösen → reales Netzwerk.
- **Gefundener Beta-UX-Bug:** auch vollständige Profile landeten immer im Editor.
  Server Action verwendet nun die vorhandene `access.profileComplete`-Regel
  (Headline, Bio, Standort). Vollständig → Discover, sonst Editor. Beide Ziele
  zeigen Erfolg, verbleibende Tage und Ablaufdatum; kein flüchtiger Toast.
  `?welcome=beta` zeigt nur bei tatsächlich aktivem serverseitigem Beta-Zugang
  eine Erfolgsmeldung. Discover behandelt auch leere Ergebnislisten.
- Ungültig, deaktiviert, abgelaufen, verwendet, falsche E-Mail getestet.
  E-Mail-Binding im Browser einschließlich Groß-/Kleinschreibung und erneutem
  Einlösen durch das richtige Konto. Bestehender atomarer Single-Use-Service
  unverändert. Kein Admin-Grant, keine bezahlte Membership durch Beta.
- Beta-Fehlertext nutzte nicht definierte `danger-700/200`-Tokens; verwendet
  jetzt vorhandene kontrastierende Farben (`danger-600/500`).
- **Hover behoben:** dunkle hartkodierte Hoverfarbe übersteuerte die helle
  Dark-Mode-Schrift. Nun semantische Textfarben und dezenter Hintergrund,
  auch für Tastaturfokus. Keine neue Animation.
- **Light Mode funktional im geprüften Scope:** Provider, HTML-Klasse,
  localStorage und semantische Tokens waren bereits funktionsfähig. Große
  Homepage-Kernbereiche und Footer waren fest dunkel; diese folgen jetzt dem
  Theme. Vorhandener subtiler Light-Text war zu blass (46 % → 62 % Deckkraft).
  Layout, Bilder, Typografie, Dark-Richtung und fotografischer Hero bleiben.
  Keine neue Theme-Architektur. Header, Navigation, Flächen, Cards, Inputs,
  Buttons, Borders, Footer, Dialoge und App-Navigation geprüft.
- **CTA unverändert korrekt:** primär blau „Mehr erfahren“ → `#outcomes`,
  sekundär „Zur INNER CIRCLE Plattform“ → `/app` → Login für Besucher.
  DE/EN × Desktop/Mobile: Reihenfolge, Farben, Anchor, Ziel und Overflow grün.
  Gemessener Hero-CLS in den finalen Läufen < 0,01, kein relevanter Layout-Sprung
  (nicht pauschal als exakt null behauptet).
- **Networking WORKING:** echte, lokal registrierte getrennte Testkonten;
  Discover → Pflichtnachricht → Request → Empfänger-Inbox/Badge → Accept →
  genau ein Chat → Nachrichten in beiden Richtungen, Polling ohne Reload,
  Inbox-Vorschau; Request-Notification wird beim Annehmen aufgelöst.
  Kein Networking-Produktionscode musste geändert werden.

## Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| Vorher `npm test` | 37 Dateien / 274 grün |
| Nachher `npm test` | 37 Dateien / 275 grün |
| `npm run typecheck` | grün |
| `npm run lint` | Baseline unverändert: 5 Fehler / 7 Warnungen; nicht lint-clean |
| `npm run i18n:audit` | 2603 Schlüssel je DE/EN, Parität grün |
| `npm run cf:build` | grün |
| `npm run cf:dry-run` | grün, OpenNext + Wrangler, kein Upload |
| `sprint15-browser.mjs` erweitert | 122/122 (inkl. Binding, beide Redirects, App-Themes) |
| `sprint12-browser.mjs` unverändert | 82/82 (Beta-Sonderfälle, Networking, Zugriff) |
| `theme-browser.mjs` neu | 140/140 (echter Toggle, Persistenz, Hover/Fokus ≥ 4,5:1, Dialoge) |

Nachweise ohne Schlüssel/Session-/Reset-Tokens: `preview/private-beta/checks.json`.
Vier komprimierte Screenshots daneben (DE Desktop / EN Mobile, jeweils Light/Dark).
Die bestehenden Screenshot-Verzeichnisse wurden nicht mit neuen Testkonten überschrieben.

## Reproduktion / Grenzen

Lokaler echter OpenNext-Worker (`wrangler dev --ip 0.0.0.0 --port 8787`),
D1/R2 lokal emuliert, bestehende Migrationen und Taxonomie lokal angewendet.
Keine Schemaänderung oder neue Migration. Browser: headless Chromium 133,
1440×900 und 390×844; keine echten iOS-/Android-Geräte, kein Safari-Test.

Browserpakete außerhalb des Repos, keine neue Projekt-Abhängigkeit:

```sh
npm install --prefix /tmp/pw playwright-core @sparticuz/chromium@133
# Falls NSS fehlt: bundled Runtime einmal entpacken
node -e "require('/tmp/pw/node_modules/@sparticuz/chromium/build/lambdafs.js').default.inflate('/tmp/pw/node_modules/@sparticuz/chromium/bin/al2023.tar.br')"
LD_LIBRARY_PATH=/tmp/al2023/lib node tests/e2e/sprint15-browser.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node tests/e2e/sprint12-browser.mjs
LD_LIBRARY_PATH=/tmp/al2023/lib node tests/e2e/theme-browser.mjs
```

Die bestehenden Auth/Networking-Suites brauchen eine isolierte lokale D1 und
bereinigen lokale `@innercircle.test`-Fixtures. Niemals gegen eine gemeinsame
Testdatenbank ausführen. `.dev.vars`: nur lokale AUTH_SECRET, HTTPS-Test-Origin
für `NEXT_PUBLIC_SITE_URL`, `ENABLE_DEV_OUTBOX=true`,
`DEV_OUTBOX_RECIPIENTS=@innercircle.test`. Keine Resend-Secrets erforderlich.

E-Mail-Codes stammen aus dem **lokalen Dev-Postausgang**. Kein externer
Resend-/Gmail-Zustellnachweis, kein Production-End-to-End-Test, keine
Cloudflare-Hardware-/Lastmessung. Admin-Promotion und Zeitablauf-Fixtures
werden lokal per bestehendem Bootstrap/SQL hergestellt, nicht durch Warten.
Die Netzwerk-Suite erzeugt zusätzlich eine lokale Dev-Membership für die
separate Member-Abgrenzung – **niemals durch Beta-Einlösung**.

## Geschützter Scope

Keine Production-Webdomain-Umstellung, kein DNS, keine Production-Secrets,
keine Migration, kein Payment-/Membership-/Auth-Rewrite, keine neue Beta-
Architektur, keine neuen Networking-Features. Review/Merge bleibt beim Owner.
