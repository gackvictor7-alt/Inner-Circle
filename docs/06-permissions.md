# 06 – Zugangsstufen, Rollen & Berechtigungen (Ist-Zustand)

**Stand:** 2026-09-21 · Quelle im Code: `src/lib/access/levels.ts` (Matrix,
client-safe) und `src/lib/access/server.ts` (Durchsetzung, serverseitig).
Ersetzt das frühere Zielbild in `06-access-roles.md`.

---

## 1. Zwei getrennte Achsen

1. **Mitgliedsstatus** (Zugangsstufe) – `visitor < free < trial < member < admin`.
2. **Aktivitätsfreigaben** – z. B. Verkäuferstatus (`SellerProfile.status`),
   Founding Member (nur Anerkennung, **kein** Recht), Admin-Rolle.
   Rollen in Profilen (`rolesJson`, `Profile.headline`) sind Selbstbeschreibung
   und **öffnen keine** Rechte.

**Grundregel:** Eine Rolle ist keine Berechtigung. Die einzige Ausnahme ist
`User.role = "admin"`.

## 2. Zugangsstufen

| Stufe | Code | Voraussetzung | Kernrechte |
| ----- | ---- | ------------- | ---------- |
| Besucher | `visitor` | keine | öffentliche Seiten/Previews, Login, Registrierung |
| Registriert (frei) | `free` | Konto, unabhängig von Verifizierung: **Bereich `/app` erst nach Verifizierung** | Dashboard, eigene Profil-/Einstellungs­seiten, Verbindungen ansehen, Benachrichtigungen, Marketplace- und Event-Liste, Billing |
| Trial | `trial` | verifiziert + gestarteter 48-h-Trial | Netzwerk/Discover/Follow, eingeschränktes Connect (Vorgabe 3 Anfragen), Chancen + Investments + Events lesen/bewerben, Trust-Sicht; **kein** Messaging, **kein** Posten, **kein** Verkaufen, **kein** Vollprofil |
| Mitglied | `member` | aktive, aus dem Membership-Service stammende Mitgliedschaft | zusätzlich Messaging, Posten, Chancen anlegen, Verkaufen, Vollkurse, Investments einreichen, Mitgliedskarte, Vollprofil |
| Admin | `admin` | `User.role = "admin"` | alles aus `member` + Admin-Konsole, Prüfungen, Sperren, Audit, Dev-Postausgang |

**Ableitung** in `getAccessContext()` (einzige Wahrheit, pro Request gecacht):

```
admin            wenn User.role === "admin"
member           wenn Membership aktiv (status active/trialing, kein endedAt, currentPeriodEnd in der Zukunft)
trial            wenn Trial.status === "active" (lazy Ablaufprüfung, serverzeit-basiert)
free             sonst (angemeldet)
visitor          kein gültiges Session-Cookie
```

## 3. Berechtigungsmatrix (implementiert)

Zeichen: ✅ erlaubt · ➖ nicht erlaubt · ⚠️ eingeschränkt (siehe Fußnote) ·
🔒 nur mit Admin-Rolle.

| Bereich / Aktion | Visitor | Free | Trial | Member | Admin |
| ---------------- | ------- | ---- | ----- | ------ | ----- |
| Öffentliche Seiten/Previews sehen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mitgliederverzeichnis sehen | ➖ | ➖ | ✅ (max. 12 pro Seite) | ✅ | ✅ |
| Swipe-Discovery nutzen | ➖ | ➖ | ✅ | ✅ | ✅ |
| Profil eines Mitglieds sehen | public Preview-Seite `/member/[publicId]` | ➖ | ⚠️ anonymisiert/eingeschränkt | ✅ voll | ✅ voll |
| Eigenes Profil bearbeiten | ➖ | ✅ (Free-Basisfelder) | ⚠️ | ✅ | ✅ |
| Follow | ➖ | ➖ | ✅ | ✅ | ✅ |
| Kontaktanfrage senden | ➖ | ➖ | ⚠️ max. 3 (Trial-Konto) | ✅ unbegrenzt | ✅ |
| Anfragen annehmen/ablehnen | ➖ | ✅ (Empfänger) | ✅ | ✅ | ✅ |
| Blockieren | ➖ | ✅ | ✅ | ✅ | ✅ |
| Nachrichten senden | ➖ | ➖ | ➖ | ✅ (nur bestätigte Verbindung) | ✅ |
| Beiträge erstellen (Feed) | ➖ | ➖ | ➖ | ✅ | ✅ |
| Mitteilungen lesen | ➖ | ✅ (eigene) | ✅ | ✅ | ✅ |
| Business-Chancen lesen | Preview `/business-deals` | ➖ | ✅ (6 Positionen) | ✅ | ✅ |
| Chance anlegen/verwalten | ➖ | ➖ | ➖ | ✅ | ✅ |
| Auf Chance bewerben | ➖ | ➖ | ✅ | ✅ | ✅ |
| Bewerbungen als Owner beantworten | ➖ | ➖ | ➖ | ✅ | ✅ |
| Marktplatz-Listings lesen | Preview `/marketplace` | ✅ (Liste) | ✅ | ✅ | ✅ |
| Listing erstellen (verkaufen) | ➖ | ➖ | ➖ | ✅ (Verkäuferfreigabe noch nicht erzwungen, K-07b) | ✅ |
| Produkt/Service kaufen | ➖ | ➖ | ➖ | **nicht implementiert** | – |
| Kurse: Preview-Lektionen | ➖ | ✅ | ✅ | ✅ | ✅ |
| Kurse: vollständiger Zugang + Enrollment | ➖ | ➖ | ➖ | ✅ | ✅ |
| Investments lesen | Preview `/investments` | ➖ | ✅ (3 Positionen) | ✅ | ✅ |
| Investment einreichen | ➖ | ➖ | ➖ | ✅ (Freigabe durch Admin nötig) | ✅ |
| Absichtserklärung abgeben | ➖ | ➖ | ✅ | ✅ | ✅ |
| Vertrauliche Deal-Dokumente | ➖ | ➖ | ➖ | ➖ (`dealDocuments` immer false) | ➖ |
| Events lesen/bewerben | Preview `/events` | ✅ Liste / ➖ Bewerbung | ✅ | ✅ | ✅ |
| Tickets/Check-in | ➖ | ➖ | ➖ | **nicht implementiert** | – |
| Trust & Performance (eigene Sicht) | ➖ | ➖ | ✅ | ✅ | ✅ |
| Bewertungen abgeben | ➖ | ➖ | ➖ | ➖ | ➖ (Pipeline fehlt) |
| Mitgliedskarte erhalten/anzeigen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Eigene Karte öffentlich prüfen lassen | ✅ | ✅ | ✅ | ✅ | ✅ |
| Billing/Planwahl | ➖ | ✅ | ✅ | ✅ | ✅ |
| Mitgliedsantrag stellen | ➖ | ➖ | ➖ | ✅ | ✅ |
| Buchhaltung/Rechnungen sehen | ➖ | ➖ | ➖ | ✅ (Daten nur mit Provider) | ✅ |
| Admin-Konsole öffnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Nutzer sperren / Founding Member setzen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Investments freigeben/ablehnen | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Mitglieds-/Löschanträge bearbeiten | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Audit-Log einsehen (implizit über Admin-Ansichten) | ➖ | ➖ | ➖ | ➖ | 🔒 |
| Dev-Postausgang `/dev/outbox` | ➖ | ➖ | ➖ | ➖ | 🔒 (zusätzlich `ENABLE_DEV_OUTBOX=true`) |

**Trial-Mengenbegrenzungen** (`TRIAL_VISIBLE` in `levels.ts`):
Verzeichnis/Discovery 12 Einträge pro Seite, 6 Chancen, 6 Events,
3 Investments.

## 4. Wo die Durchsetzung passiert (niemals nur in der UI)

| Ort | Mechanismus |
| --- | ----------- |
| `src/app/(app)/app/layout.tsx` | `requireUser()` + Verifizierungs-Redirect nach `/verify` |
| `src/app/(app)/admin/layout.tsx`, jede `/admin/*`-Seite | `requireAdmin()` |
| Seiten | `requireUser()`, `requireVerifiedUser()`, `requireAccess("member")` oder `entitlements.*` → Redirect/Locked-State/`notFound()` |
| Server Actions | `getAccessContext()` in **jeder** Action, danach Eigentums-/Verbindungsprüfung |
| Eigentumsprüfungen | z. B. Opportunity-Owner, Nachrichten nur zwischen verbundenen Konten, Notifications/Applications nur mit passender `userId` |
| Blockierungen | `Block` wird in Kontakt- und Nachrichtenaktionen geprüft |
| Admin-Aktionen | `requireAdmin()` **und** `audit()`-Eintrag |

**Regel für neue Arbeit:** Eine Berechtigung wird in `src/lib/access/levels.ts`
ergänzt, serverseitig geprüft und **dieses Dokument aktualisiert**. UI-Prüfungen
allein sind ungültig.

## 5. Rollen, die (noch) nicht existieren

| Rolle | Zustand |
| ----- | ------- |
| Verkäufer (Freigabe vor Verkauf) | Datenmodell `SellerProfile` vorhanden, Prüfung im Verkaufsflow fehlt (K-07b) |
| Creator/Partner (Referrals) | nicht implementiert |
| Investment-Publisher | faktisch „Mitglied darf einreichen + Admin gibt frei" |
| Qualifizierter Investor | nicht implementiert (Rechtsprüfung offen) |
| Gruppen-Admin / Firmen-Admin | nicht implementiert (keine Gruppen-/Firmentabellen) |
| Moderator / Support / Finanzen / Super-Admin | nicht implementiert – nur `user` \| `admin` |
| Founding Member | Anerkennung ohne Rechte (Feld + Admin-Aktion vorhanden) |
