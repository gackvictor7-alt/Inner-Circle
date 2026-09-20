# INNER CIRCLE – Projektdokumentation

**Arbeitsname:** INNER CIRCLE (finaler Markenname noch offen)
**Stand:** Schritt 01 – Projekt-Fundament
**Letzte Aktualisierung:** 2026-09-20

Dieses Verzeichnis ist die verbindliche Projektspezifikation.
Jede Entwicklungsphase aktualisiert diese Dokumente, insbesondere
`04-progress.md` (Fortschritt) und `05-decisions.md` (Entscheidungen).

## Dokumente

| Datei               | Inhalt                                                    |
| ------------------- | --------------------------------------------------------- |
| `00-overview.md`    | Diese Übersicht                                           |
| `01-product-vision.md` | Produktvision, Geschäftsmodell, Erlösströme, Zielmarkt |
| `02-architecture.md`| Technik-Stapel, Repository-Struktur, Datenmodell, Sicherheit |
| `03-roadmap.md`     | Der 20-Schritte-Entwicklungsplan mit Abnahmekriterien     |
| `04-progress.md`    | Fortschrittsprotokoll aller Phasen (wird laufend gepflegt)|
| `05-decisions.md`   | Architektur- und Produktentscheidungen (ADRs)             |
| `06-access-roles.md`| Zugangsstufen, Rollen, Berechtigungsmatrix (Zielbild)     |
| `07-external-services.md` | Externe Dienste, Konten, Kosten, Zeitpunkte         |
| `08-testing.md`     | Test- und Abnahmeverfahren pro Phase                      |
| `09-deployment.md`  | Deployment-Strategie, Umgebungen, Checklisten             |
| `10-mvp-scope.md`   | MVP-Umfang vs. Vollprodukt, Abhängigkeiten, Risiken       |

## Grundregeln (aus der Master-Spezifikation)

1. Ein Schritt nach dem anderen – kein unkontrollierter Gesamtbau.
2. Echte Funktion schlägt Attrappe: Fertig heißt Backend + Daten + Rechte + Tests.
3. Keine erfundenen Nutzer, Transaktionen oder Erfolge als echt darstellen.
4. Mitgliedschaft ist kein Anlageprodukt; keine Renditeversprechen.
5. Geheimnisse nur in Umgebungsvariablen, nie im Client-Code.
6. Deutsch + Englisch in jeder ausgelieferten Oberfläche (zentrales i18n).
7. Light- und Dark-Mode in allen Komponenten.
8. Jede Phase endet mit Verifikation + Fortschrittseintrag.
