# 01 – Produkt, Geschäftsmodell & Umfang

**Stand:** 2026-09-21 · Übernommen und konsolidiert aus
`01-product-vision.md` und `10-mvp-scope.md` (beide ersetzt diese Datei).

## 1. Kernidee

INNER CIRCLE ist ein digitales Business-Ökosystem für ambitionierte Menschen:
Gründer, Unternehmer, Investoren, Creator, Freelancer, Berater und Unternehmen.
Die Plattform verbindet **Netzwerk**, **Geschäfte**, **Wissen**,
**Kapitalzugang** und **Erlebnisse** in einer Anwendung.

**Leitprinzip: Zugang schafft Chancen.**

- Offen für alle, die den Mitgliedsbeitrag zahlen und die Regeln einhalten.
- Kein Wohlstands- oder Prominenten-Club als Voraussetzung.
- Junge Gründer willkommen, erfahrene Profis gleichermaßen zu Hause.
- Kein Unterhaltungs-Feed, sondern wirtschaftliche Aktivität aus Beziehungen.

## 2. Geschäftsmodell (Zielbild)

1. **Mitgliedschaft:** 24,99 €/Monat und 249,90 €/Jahr („2 Monate geschenkt",
   16 % Vorteil) – identisch auf Homepage, `/membership` und `/app/billing`.
2. **Deal-Provisionen:** erfolgsbasiert, kategorieabhängig (Engine statt
   Hardcoding) – **noch nicht implementiert**.
3. **Marktplatz-Provisionen:** kategorieabhängig – **noch nicht implementiert**.
4. **Creator-Akquise:** 20 € pro qualifiziertem zahlendem Neumitglied –
   **noch nicht implementiert**.
5. **Events & Experiences:** Tickets + kuratierte Premium-Erlebnisse –
   Event-Bewerbungen vorhanden, Ticketing nicht.
6. **Ausgewählte B2B-Dienstleistungen** (später).
7. **Langfristige Unternehmensbeteiligungen:** Ziel-Allokation 20 % des
   Umsatzes (davon 5 Prozentpunkte für Ökosystem-Projekte) – Strategieabsicht,
   **kein Renditeversprechen**, Umsetzung erst nach Steuern, Kosten, Rücklagen
   und Rechtsprüfung.

## 3. Zielmarkt

- Start: Deutschland / DACH, von Beginn an **Deutsch + Englisch**.
- Architektur internationalisierbar ohne Neuaufbau (zentrales i18n,
  Zeitzonen/Mehrwährung später erweiterbar).
- Erste Community: ca. 50 bekannte Personen als Keimzelle – **nicht**
  automatisch als Mitglieder oder Erfolgsgeschichten darstellen.

## 4. Abgrenzungen (nicht verhandelbar)

- Mitgliedschaft ≠ Anlageprodukt; keine Erfolgs- oder Renditegarantien.
- Investment-Bereich startet als **Discovery + Anbahnung**; Ausführung nur über
  regulierte Partner nach Rechtsprüfung (bis dahin deaktiviert).
- Keine eigene Zahlungs-Verwahrlösung, keine eigene Krypto-Auth – etablierte
  Anbieter nutzen (Stripe, S3-kompatibler Storage).
- Keine fiktiven Erfolgsgeschichten, Nutzerzahlen oder Transaktionen.
- Demo-Daten sind im Datenmodell als Demo markiert (`isDemo`, `seedTag`) und
  werden in der UI nicht als echt dargestellt.

## 5. Produktbereiche und ihr Bezug zum Code

| Bereich | Produktversprechen | Code-Orte |
| ------- | ------------------ | --------- |
| A. Public Website | Marke, Previews, Registrierung | `src/app/(site)/*`, `src/components/site/*` |
| B. Mitgliedschaft & Identität | Konten, Verifizierung, Sessions | `src/lib/auth/*`, `src/app/actions/auth.ts` |
| C. Netzwerk | Finden, folgen, verbinden, schreiben | `src/app/(app)/app/{network,discover,connections,messages,notifications}`, `src/app/actions/network.ts`, `messages.ts` |
| D. Business Deals | Chancen entdecken/bewerben | `src/app/(app)/app/{opportunities,jobs}`, `src/app/actions/business.ts` |
| E. Investments | Chancen anbahnen (keine Ausführung) | `src/app/(app)/app/investments/*`, `/admin/investments` |
| F. Marktplatz & Academy | Produkte, Services, Kurse | `src/app/(app)/app/{marketplace,learn}` |
| G. Creator & Referrals | Akquise-Provisionen | **kein Code** – NOT IMPLEMENTED |
| H. Vertrauen & Reputation | Trust Score, Reviews, Badges | `src/app/(app)/app/trust`, `src/lib/platform/queries.ts` |
| I. Events & Experiences | Events, Bewerbungen, Tickets | `src/app/(app)/app/events`, `public-site /events` |
| J. Administration | Betrieb, Prüfungen, Audit | `src/app/admin/*`, `src/app/actions/admin.ts` |
| K. Infrastruktur | Hosting, DB, Deployment | `wrangler.jsonc`, `drizzle/`, `docs/09-deployment.md` |

## 6. Umfang: Was heute nutzbar ist – und was nicht

### Nutzbar heute (WORKING, ohne externe Schlüssel)

- Öffentliche Website inkl. Previews und Rechts-Platzhaltern (DE/EN, hell/dunkel).
- Registrierung, Login, Logout, Sessions, Passwort-Zurücksetzen (Mechanik).
- E-Mail-Verifizierung **im Dev-Postausgang** (geschützt: nur Admin, optional
  Empfänger-Allowlist) – solange kein E-Mail-Anbieter konfiguriert ist.
- 48-h-Discovery-Trial mit serverseitigen Grenzen und Ablauf.
- Mitgliedschaft: Aktivierung über den Membership-Service (Stripe-Pfad
  implementiert, aber ohne Schlüssel nicht nutzbar; Dev-Aktivierung außerhalb
  Produktion erlaubt und klar gekennzeichnet).
- Mitgliederbereich: Dashboard, Netzwerk, Discover, Verbindungen, Nachrichten,
  Mitteilungen, Profil, Einstellungen, Mitgliedskarte, Billing, Trust,
  Chancen, Jobs, Marketplace, Academy, Investments, Events.
- Chancen-Bewerbungen, Kurs-Einschreibungen, Investment-Prüfung, Events-Bewerbungen.
- Admin-Konsole mit Nutzer-, Investment-, Antrags- und Löschantragsverwaltung.
- Automatisierte Tests (56) und Cloudflare-Build.

### Bewusst noch nicht im Produkt

- Deal-Räume/Brokerage, Provisions-Engine.
- Investment-Ausführung (Zeichnung, Zahlung, Dokumente) – Rechtsprüfung offen.
- Marktplatz-Bezahlung, Verkäuferauszahlungen, Bestellungen.
- Trust-Review-Erfassung und Verifikations-Pipeline.
- Ticketing/Check-in, Event-Erstellung im Backend.
- Creator-/Referral-Programm.
- Gruppen/Communities, Firmenprofile.
- OAuth (Google/Apple), SMS-Verifizierung, echtes Transaktions-Mailing.

### MVP-Einordnung

Das MVP-Ziel (Konten, Mitgliedschaft, Dashboard/Profil, Netzwerk + Nachrichten,
Events-Basis, Admin-Minima) ist **im Code weitgehend erreicht**, aber außerhalb
der Sandbox erst nutzbar, wenn E-Mail-Versand (und für Bezahlung Stripe)
konfiguriert sind. Der erste funktionale Schritt ist daher
**E-Mail-Verifizierung mit echtem Versand** – siehe
[`12-roadmap.md`](12-roadmap.md).
