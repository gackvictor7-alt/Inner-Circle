# Sprint 17 – Stripe-Sandbox-Billing und UX-Aufräumarbeiten

**Datum:** 2026-09-29
**Basis:** aktuelles `main` @ `98814bc`
**Branch:** `arena/01a0ea7c-inner-circle`
**Status:** PR bereit zur Prüfung, nicht gemergt

## Lieferung

- `/app/billing` posts den ausgewählten Plan (`monthly`/`annual`) an einen
  authentifizierten Server-Endpunkt. Price IDs werden ausschließlich aus
  `STRIPE_PRICE_MONTHLY` und `STRIPE_PRICE_YEARLY` gelesen. Der Server erzeugt
  oder verwendet den zur User-ID gespeicherten Stripe Customer, schreibt die
  Checkout-/Subscription-Metadaten und nutzt `NEXT_PUBLIC_SITE_URL` für die
  Rückleitungen.
- Stripe akzeptiert in dieser Implementierung ausschließlich Testmodus-
  Secret-Keys. Keine Live-Keys, Produkte, Zahlungen oder Produktionsänderungen
  wurden aktiviert.
- `/api/webhooks/stripe` prüft den Raw Body und `STRIPE_WEBHOOK_SECRET`,
  speichert Provider-Event-IDs idempotent und verarbeitet die sechs
  verbindlichen Ereignisse: `checkout.session.completed`,
  `customer.subscription.created`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid` und
  `invoice.payment_failed`. Verzögerte Checkout-Zahlungen werden zusätzlich
  behandelt.
- Membership-Zugriff entsteht nur aus signiertem Stripe-Zustand. Success-/Cancel-
  URLs informieren nur. Provider-/Customer-/Subscription-Zuordnungen,
  unbekannte Price IDs und Admin-Overrides werden geprüft. Stripe verändert
  weder Private Beta, Founding Member, User-Rolle noch die administrative
  Membership. Das bestehende Admin-Aktivieren/-Entziehen bleibt separat.
- `/api/billing/portal` und der Button auf `/app/billing` erzeugen echte
  Customer-Portal-Sessions nur aus der serverseitigen Customer-Zuordnung.
  Admin-/Dev-Membership erhalten keinen Portal-Button.
- Preise sind zentral: exakt `24,99 €` monatlich und `249,99 €` jährlich.
  Aktive alte `249,90 €`-Hinweise wurden entfernt; historische Sprint-Reports
  dürfen den damaligen Preis als Historie nennen.
- Der bestehende konsolidierte Profil-/Onboarding-Editor wurde nicht neu
  aufgebaut: Rollen-/Skills-Eingaben bleiben aus der Oberfläche entfernt,
  historische `rolesJson`/`skillsJson` bleiben serverseitig erhalten.
- Neue Opportunities fragen Titel, Typ, Kurzfassung, Beschreibung, Branche,
  Ort und die vorhandene Remote-Option ab. Legacy-Spalten und Lesbarkeit
  bleiben erhalten; Kernfelder liefern feldspezifische DE/EN-Fehler.
- Dokumentation, URL-Audit und Testanleitungen wurden auf die kanonische
  öffentliche URL `https://innercirclevp.com` und zentrale
  `NEXT_PUBLIC_SITE_URL`-Verwendung aktualisiert. DNS, Cloudflare, Auth,
  Resend und Beta-Konfiguration wurden nicht verändert.

## Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| `npm test -- --reporter=dot` | **354 Tests / 44 Dateien grün** |
| `npm run typecheck` | **grün** |
| `npm run i18n:audit` | **DE 2708 / EN 2708, gleiche Form, alle referenzierten Keys vorhanden** |
| `npm run cf:dry-run` | **grün** – OpenNext-Build + Wrangler Dry-Run; 9654,79 KiB Upload / 1932,41 KiB gzip; Bindings `DB`, `MEDIA`, `ASSETS`, `NEXTJS_ENV` |
| `npm run lint` | **Baseline rot:** 5 Fehler + 6 Warnungen; keine neuen Befunde in den betroffenen Stripe-/Opportunity-Dateien |
| Node-Dev-HTTP-Smoke | `/` und `/membership` 200; unauthenticated Billing 307; Portal GET 303; Webhook GET 405 |
| Browser-/Screenshot-E2E | **offen:** kein Chromium/Playwright-Modul in der Umgebung; keine visuellen Ergebnisse behauptet |
| echter Stripe-Testmodus-Durchlauf | **offen:** keine externen Sandbox-Werte verwendet oder gesetzt |

## Bewusste Grenzen

- Keine Produktionsmigration und kein `drizzle`-Schema-Change.
- Keine Stripe-Secrets oder Price-ID-Werte im Repository, in Logs oder in dieser
  Dokumentation.
- Kein Merge und keine Live-Schaltung. Der PR muss nach Review und einem
  freigegebenen Stripe-Sandbox-Testlauf separat durch die zuständige Person
  gemergt werden.
