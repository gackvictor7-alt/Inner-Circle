# Test- & Abnahmeverfahren

## Definition of Done (jede Funktion)

- [ ] Bedienbar (UI + Fehlerfälle) und responsiv (mobil/desktop).
- [ ] Backend-Verhalten korrekt, Daten persistent.
- [ ] Berechtigungen server-seitig erzwungen (Besucher/Registriert/
      Mitglied + Freigaben), nicht nur versteckt.
- [ ] DE + EN (kein Hardcodetext), Light + Dark lesbar.
- [ ] Basis-Barrierefreiheit (Labels, Fokus, Kontraste, Reduced-Motion).
- [ ] Relevante Tests/Prüfprotokolle vorhanden.
- [ ] Keine bekannten kritischen Sicherheitsprobleme.
- [ ] Externe Abhängigkeit benannt: Code fertig vs. Sandbox-getestet
      vs. Produktion-aktiv (drei Stufen, ehrlich unterscheiden).

## Standard-Verifikation pro Schritt

1. `npm run lint` grün.
2. `npm run build` grün.
3. Manuelle Klickpfade der Phase in DE + EN, hell + dunkel, mobil + desktop.
4. Negativtests: verbotene Zugriffe (URL direkt aufrufen, fremde IDs,
   abgelaufene Trials, stornierte Zahlungen) werden abgewiesen.
5. Fortschrittseintrag in `04-progress.md` + Commit.

## Phasen-Checklisten (Auszug)

- **04 Auth:** Registrieren→Verifizieren→Login→Logout→Recovery;
  Rate-Limits; keine Enumeration sensibler Infos.
- **05 Abo:** Trial-Ablauf 48 h; Webhook-Tests (Zahlung/Storno/Refund);
  kein Abo über Erfolgs-URL erschleichbar.
- **07 Netzwerk:** Zwei Testkonten: Anfrage→Annahme→Chat; Blockieren;
  Fremde können nicht schreiben.
- **09–10 Deals:** Restricted-Inhalte erst nach Freigabe; Dokument-
  Widerruf; Audit-Historie.
- **11 Investments:** Unberechtigte sehen keine Details; kein
  Empfehlungs-/Rendite-Wording irgendwo.
- **12–13 Kauf:** Testkauf + Storno + Auszahlung; Provision je Kategorie.
- **14 Referral:** Attribution→Zahlung→Provision; Selbst-/Doppel-
  schutz; Storno kehrt Provision um.
- **16 Events:** Buchen→Ticket→QR-Check-in; Kapazität/Warteliste.
- **19 Security:** Routen-/API-Audit, OWASP-Basics, Backup-Nachweis.

## Testdaten-Regel

Testkonten klar als solche kennzeichnen (z. B. `test+…`), niemals als
echte Mitglieder/Erfolge präsentieren. Keine Produktionsdaten in Tests.

## Automatisierte Tests (Sprint 2.0)

```bash
npm test            # Vitest, alle Unit- und Integrationstests
npm run test:watch  # Watch-Modus
npm run typecheck   # tsc --noEmit
npm run test:keys   # jede im Code referenzierte i18n-Kodierung existiert in DE + EN
npm run i18n:audit  # DE/EN-Struktur + Schlüsselzahlen
```

Aufbau, Umfang und Grenzen stehen in [`tests/README.md`](../tests/README.md):

- **Unit:** Passwort-/Session-Hashing, OTP-Erzeugung, Entitlement-Matrix
  (Free/Trial/Member/Admin), Pläne (24,99 € / 249,90 €, Jahresvorteil),
  Trial-Regeln (48 h, 3 Anfragen), DE/EN-Parität der Wörterbücher.
- **Integration (Wegwerf-Datenbank `.test.db`):** Mitgliedschaft anlegen,
  Karte ausstellen, Kündigung zum Periodenende, sofortiger Ablauf,
  Zahlungsfehler, Rechnungs-Idempotenz, Trial-Start/Limit-/Missbrauchsschutz,
  Webhook-Signaturprüfung, Verbindungs- und Nachrichten-Autorisierung.
- **Bewusst nicht automatisiert:** alles, was einen Browser braucht
  (Hamburger-Menü, Theme-Wechsel, Swipe-Gesten, Breakpoints) – dafür gilt
  weiterhin die manuelle Checkliste; Server-Actions mit Next-Request-Kontext
  (Registrierung, Login, Anfragen) werden manuell mit den Testkonten geprüft.
