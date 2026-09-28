# Domain-Cutover-Checkliste: `innercirclevp.com`

**Status: vorbereitet, nicht ausgeführt.** Diese Checkliste beschreibt den späteren
kontrollierten Wechsel. In diesem Sprint wurden weder DNS/Nameserver geändert,
noch eine Cloudflare-Custom-Domain oder Redirect-Regel angelegt, Production-
Variablen geändert oder ein Deployment ausgeführt.

**Ist-Zustand laut Projektkontext vom 2026-09-28:** `innercirclevp.com` befindet
sich in der Nameserver-Propagation bei Cloudflare. Die bestehende Production
bleibt bis zum ausdrücklich freigegebenen Cutover unter
`https://inner-circle.gackvictor7.workers.dev` erreichbar. Der Resend-Versand
über die bei Resend verifizierte Sending Domain ist davon unabhängig.

## Reihenfolge am Cutover-Tag

1. [ ] **Cloudflare-Zone `innercirclevp.com` ist Active.** In Cloudflare den
   Nameserver-Status prüfen; erst fortfahren, wenn Cloudflare die Zone als
   aktiv meldet. DNS-Zustand nicht allein aus lokaler Auflösung ableiten.
2. [ ] **Apex-Domain verbinden.** Den Worker `inner-circle` in Cloudflare
   Workers → Settings/ Domains & Routes mit `innercirclevp.com` verbinden.
   Die bestehende `workers.dev`-Adresse vorerst aktiviert lassen.
3. [ ] **`www`-Strategie (optional, primäre URL bleibt ohne `www`).** Falls
   `www.innercirclevp.com` angeboten werden soll, den Host für Cloudflare
   erreichbar machen und eine einzige permanente Cloudflare-Weiterleitung
   (`301` oder `308`) auf `https://innercirclevp.com` einrichten. Pfad und
   Query-String erhalten, Schleifen vermeiden und die Regel erst aktivieren,
   wenn DNS sowie TLS für `www` bereit sind. Keine Redirect-Regel ist Teil
   dieses vorbereitenden Sprints.
4. [ ] **Eine öffentliche Basis setzen:** `NEXT_PUBLIC_SITE_URL` exakt auf
   `https://innercirclevp.com` setzen – sowohl im Cloudflare-Workers-Build-
   Kontext als auch in der Worker-Runtime. Keine `www`-Variante eintragen.
   Resend-, Auth-, Stripe- oder sonstige Secrets dafür nicht ändern. Andere
   URL-Einstellungen nicht nebenbei umstellen.
5. [ ] **Deployment freigeben und ausführen.** Erst nach bestätigter Zone,
   funktionsfähigem Apex-Custom-Domain-Setup und gesetztem Build-/Runtime-Wert
   den normalen Production-Deploy-Prozess auslösen. Keine Datenbankmigration
   ist für den Domainwechsel vorgesehen.
6. [ ] **SSL/TLS prüfen.** Cloudflare-Zertifikat für Apex aktiv; falls `www`
   genutzt wird, Zertifikat auch dort aktiv. HTTPS ohne Zertifikatswarnung;
   HTTP-Verhalten entsprechend der bestehenden Cloudflare-Policy kontrollieren.
7. [ ] **Homepage** unter `https://innercirclevp.com` laden; Assets,
   Navigation und Locale-Wechsel prüfen.
8. [ ] **Registrierung** mit einem freigegebenen Canary-/Testkonto starten.
   Sicherstellen, dass der Formularfluss auf derselben neuen Domain bleibt.
9. [ ] **E-Mail-Verifizierung** mit dem Testkonto prüfen: Resend-Nachricht
   zustellen lassen, Code auf der neuen Domain eingeben und erfolgreichen
   Verify-/Onboarding-Fluss bestätigen. Die Verifizierungs-Mail ist aktuell
   codebasiert und enthält keinen Website-Link.
10. [ ] **Login und Logout** testen. Interne Ziele (`/verify`, Onboarding,
    `/app`) bleiben pfadbasiert; Logout führt auf die konfigurierte Apex-Domain.
11. [ ] **Passwort-Reset** anfordern. Button- und Fallback-Link der Resend-Mail
    müssen direkt auf `https://innercirclevp.com/reset-password?...` zeigen;
    Link öffnen und prüfen, dass keine falsche Zwischen-/Weiterleitungsseite
    oder Workers.dev-Host dazwischenliegt.
12. [ ] **`/app`** mit verifiziertem Testkonto öffnen; geschützte Bereiche und
    Reload prüfen.
13. [ ] **Beta** prüfen (`/app/beta` und – mit geeignetem Canary-Konto –
    Einlösen/Status). Nur freigegebene Testschlüssel verwenden.
14. [ ] **Discover** öffnen, Filtern und Profilöffnen auf der neuen Domain
    prüfen.
15. [ ] **Anfrage** mit zwei freigegebenen Testkonten senden und annehmen;
    prüfen, dass interne Navigation auf der Apex-Domain bleibt.
16. [ ] **Chat** zwischen den Testkonten öffnen und eine Testnachricht senden;
    In-App-Links und Reload prüfen.
17. [ ] **Öffentliche/ausgehende Links** kontrollieren: Passwort-Reset-Mail,
    Beta-Einladungstext, Profil teilen, Mitgliedskarten-QR und – falls
    verwendet – Stripe-Checkout-/Billing-Rückkehr. Jede erzeugte öffentliche
    Basis muss `https://innercirclevp.com` verwenden.
18. [ ] **Alte URL kontrollieren, nicht abschalten:**
    `https://inner-circle.gackvictor7.workers.dev` weiterhin laden und die
    bisherige Production prüfen. `workers.dev` erst nach separater Freigabe
    abschalten; die Domainumstellung erfordert das nicht.

## Abbruch-/Rollback-Hinweis

Wenn Apex, TLS oder ein kritischer Smoke-Test fehlschlägt, keine Redirects auf
`www` erzwingen und `workers.dev` nicht deaktivieren. Den Cutover stoppen und
nach Freigabe den `NEXT_PUBLIC_SITE_URL`-Wert auf die bisherige Worker-URL
zurücksetzen sowie regulär neu deployen. DNS-/Zone-Zustand und Mail-Sender-
Konfiguration dabei nicht improvisiert ändern.
