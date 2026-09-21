# AGENTS.md – Startanweisung für KI-Agenten

**Gilt für jede Session, jeden Auftrag und jeden Agenten in diesem Repository.**

---

## 1. Zuerst lesen – in dieser Reihenfolge

1. **[`docs/00-SOURCE-OF-TRUTH.md`](docs/00-SOURCE-OF-TRUTH.md)** – zentrale
   Source of Truth: Was existiert, was funktioniert, was ist offen, was ist
   geschützt. **Immer zuerst lesen.**
2. **[`docs/10-design-freeze.md`](docs/10-design-freeze.md)** – der visuelle
   Stand ist freigegeben und eingefroren.
3. Das zum Auftrag passende Detaildokument:
   `01-product` · `02-architecture` · `03-routes` · `04-auth-membership` ·
   `05-database` · `06-permissions` · `07-integrations` · `08-testing` ·
   `09-deployment` · `11-known-issues` · `12-roadmap` · `13-decisions` ·
   `14-environment`.

## 2. Die acht Regeln

1. **Erst Source of Truth lesen, dann arbeiten.** Nicht auf alte Chat-Aussagen
   verlassen – der Code auf `main` ist die technische Wahrheit.
2. **Bestehende Funktionen nicht neu bauen.** Was in
   `docs/00-SOURCE-OF-TRUTH.md` als **WORKING** steht, wird nicht neu
   geschrieben, nicht umbenannt und nicht „verbessert", außer der Auftrag
   verlangt es ausdrücklich.
3. **Design nur auf ausdrücklichen Auftrag ändern.** Keine Bilder, Farben,
   Typografie, Layouts, Navigation, Mobile-Richtung, kein Redesign des
   Mitgliederbereichs. Technische Responsive- und Barrierefreiheits-Fixes ohne
   Richtungsänderung sind erlaubt.
4. **`main` ist die technische Ausgangsbasis.** Vor Änderungen den aktuellen
   Stand prüfen (`git log`, `git status`); auf dem Session-Branch arbeiten und
   per Pull Request nach `main` liefern.
5. **Tests vor und nach Änderungen ausführen.** Mindestens
   `npm run typecheck`, `npm test`, bei Infrastrukturbezug `npm run cf:build`
   oder `npm run cf:dry-run`. Lint-Befund mit bekanntem Stand vergleichen
   (K-15) und nichts verschlechtern.
6. **Secrets niemals committen.** Keine Zugangsdaten im Repository, in Logs
   oder im Chat. Nur Variablennamen nennen
   ([`docs/14-environment.md`](docs/14-environment.md)). `.env`/`.dev.vars`
   bleiben lokal.
7. **Dokumentation nach jeder größeren Änderung aktualisieren** – immer
   `docs/00-SOURCE-OF-TRUTH.md` plus das betroffene Detaildokument.
8. **Status korrekt verwenden:** WORKING · PARTIAL · PREPARED · BLOCKED ·
   NOT IMPLEMENTED · DEPRECATED. Eine UI allein macht nichts zu WORKING.

## 3. Change Protocol (vor jeder größeren Änderung)

1. Source-of-Truth-Dokument lesen.
2. Aktuellen `main`-Stand prüfen.
3. Relevante Tests ausführen (Ausgangslage).
4. Keine angrenzenden Bereiche unnötig ändern.
5. Keine funktionierenden Features neu schreiben.
6. Keine Designänderung ohne ausdrücklichen Auftrag.
7. Änderung in kleinem, nachvollziehbarem Scope durchführen.
8. Tests erneut ausführen.
9. Dokumentation aktualisieren.
10. Pull Request mit klarer Beschreibung erstellen (betroffene Bereiche,
    Tests, Risiken, was **nicht** angefasst wurde).

## 4. Projektregeln (verbindlich)

- **Keine Dead Buttons / keine Fake Features.** Jeder sichtbare Button
  funktioniert, ist deaktiviert oder klar als „Demnächst verfügbar" /
  „Einrichtung erforderlich" gekennzeichnet. Keine UI behauptet eine Funktion,
  die das Backend nicht hat. Aktuell bekannte Abweichungen:
  [`docs/11-known-issues.md`](docs/11-known-issues.md) (K-04, K-05).
- **Ehrliche Zustände:** Nachrichten melden `provider` / `dev` / `none`;
  Zahlungen aktivieren nur signaturgeprüfte Webhooks; keine erfundenen
  Nutzerzahlen, Bewertungen oder Erfolge.
- **Autorisierung immer serverseitig** (`src/lib/access/server.ts`,
  `getAccessContext()` in jeder Server Action). UI-Verstecken ist keine
  Berechtigung; Änderungen immer in `docs/06-permissions.md` spiegeln.
- **Schemaänderungen nur mit Migration** (`npm run db:generate`) und Update von
  `docs/05-database.md`.
- **Texte nur über `src/lib/i18n`** (DE und EN, Parität wird getestet);
  Light und Dark prüfen.
- **Keine neuen Abhängigkeiten ohne Notwendigkeit**; keine neuen
  Designrichtungen, keine neuen Design-Tokens.

## 5. Nächster funktionaler Schritt (falls kein anderer Auftrag vorliegt)

**Echter E-Mail-Versand für die Account-Verifizierung** (Resend-Key +
verifizierte Absenderdomain, `EMAIL_FROM`, Test des kompletten Flows,
Dev-Postausgang deaktivieren). Details: `docs/12-roadmap.md` → NEXT (N-1).
Dieser Schritt ist **noch nicht umgesetzt** und in einem eigenen Auftrag zu
bearbeiten.

## 6. Nützliche Befehle

```bash
npm install                 # Abhängigkeiten
npm run dev                 # Node-Entwicklung (0.0.0.0:3000)
npm test                    # 12 Dateien / 56 Tests (Stand main @ f22c19e)
npm run typecheck           # tsc --noEmit
npm run lint                # 21 bekannte Hinweise (K-15) – nicht schlechter werden
npm run cf:build            # Produktionsbuild für Cloudflare (OpenNext)
npm run cf:dry-run          # Build + Wrangler-Konfiguration prüfen
npm run cf:preview          # App in workerd gegen lokale D1 (Port 8787)
npm run db:push && npm run db:seed   # lokale Datenbank + fiktive Demodaten
npm run dev:outbox          # Dev-Postausgang lesen
```
