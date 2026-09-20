# Externe Dienste & Gründer-Aufgaben

**Regel:** Keine Zugangsdaten im Chat teilen. Der Gründer legt Konten
selbst an; der Agent liefert Schritt-für-Schritt-Anleitungen und bindet
nur öffentliche/unkritische Kennungen bzw. Platzhalter ein.
Produktions-Geheimnisse landen ausschließlich in Env-Variablen.

## Übersicht (wann wird was gebraucht?)

| Dienst | Wofür | Ab Schritt | Kosten-Erwartung (Start) |
| ------ | ----- | ---------- | ------------------------ |
| GitHub | Code, Versionierung | 01 ✅ vorhanden | 0 € |
| Vercel | Hosting + Previews | 03 | 0 € (Hobby); Pro später ~20 $/Mo. |
| Neon o. ä. | PostgreSQL (managed) | 04 | 0 € (Free-Tier); Wachstum kostenpflichtig |
| Resend o. ä. | Transaktions-E-Mails | 04 | 0 € (Free-Tier, z. B. 3.000/Mo.) |
| Stripe | Abos (Test → Live) | 05 | 0 € Grundgebühr; Transaktions-% |
| PayPal Business | Alternative Zahlart | 05+ (optional) | Transaktions-% |
| Object Storage (S3-komp.) | Avatare, Videos, Dokumente | 06 | Free-Tier/low € einstellbar |
| Google/Apple OAuth | Soziale Logins | 04+ (progressiv) | 0 € (Developer-Konten ggf. Apple 99 $/Jahr später für Apps) |
| Domain + DNS | Produkt-Domain | 20 (ggf. früher) | ~10–20 €/Jahr |
| Video-Hosting | Kursvideos (falls nötig) | 13 | Entscheidung in Schritt 13 (z. B. Mux/Bunny ab ~0–20 €) |
| Rechtsberatung | AGB, Datenschutz, Provisionen, Investment-Recht | 09/11/19 | **Pflicht-Budget einplanen** (größter Posten neben Zeit) |

## Budget-Einordnung (< 500 € Start)

- Entwicklung bis Schritt ~10 fast vollständig auf Free-Tiers machbar.
- Erste echte Kosten: Domain (~15 €), ggf. Vercel Pro bei Launch,
  Transaktionsgebühren erst bei Umsatz.
- **Rechtsprüfung ist kein Free-Tier:** Provisionsordnung,
  Marktplatzbedingungen, Investment-Struktur, AGB/Datenschutz brauchen
  menschliche Prüfung vor kommerzieller Aktivierung.
- Apple Developer (99 $/Jahr) erst bei nativen Apps relevant.

## Was der Agent NICHT kann

- Keine Konten im Namen des Gründers erstellen (Verifizierung/ID nötig).
- Keine Zahlungen auslösen oder Tarife buchen.
- Keine Rechtsberatung ersetzen – nur Fragen/Checklisten vorbereiten.

## Gründer-Aufgaben pro Schritt (Vorschau)

- **Schritt 03:** Vercel-Konto verbinden (Anleitung folgt).
- **Schritt 04:** DB-Konto (Neon) + E-Mail-Konto (Resend) anlegen,
  Verbindungsdaten in `.env.local` eintragen (Anleitung folgt).
- **Schritt 05:** Stripe-Konto (Testmodus), Jahrespreis-Entscheid.
- **Schritt 09/11:** Provisionsordnungs-Entwurf + Rechtsfragen klären.
- **Schritt 20:** Domain, Stripe-Live-Freigabe, Launch-Entscheide.
