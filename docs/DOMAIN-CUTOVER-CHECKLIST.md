# Domain-Cutover-Checkliste: `innercirclevp.com`

**Status: vorbereitet, nicht ausgeführt.** Diese Checkliste beschreibt den späteren
kontrollierten Wechsel. In diesem Sprint wurden weder DNS/Nameserver geändert,
noch eine Cloudflare-Custom-Domain oder Redirect-Regel angelegt, Production-
Variablen geändert oder ein Deployment ausgeführt.

**Ist-Zustand:** `https://innercirclevp.com` ist die kanonische öffentliche
URL der Anwendung. Diese Checkliste ist nur für eine separat freigegebene
Cloudflare-/DNS-Abnahme gedacht; in diesem Sprint wurden weder die Zone noch
Custom-Domain-Routen, Produktionsvariablen oder Deployments verändert. Der
Resend-Versand über die verifizierte Sending Domain ist davon unabhängig.

## Reihenfolge am Cutover-Tag

1. [ ] **Cloudflare-Zone `innercirclevp.com` ist Active.** In Cloudflare den
   Nameserver-Status prüfen; erst fortfahren, wenn Cloudflare die Zone als
   aktiv meldet. DNS-Zustand nicht allein aus lokaler Auflösung ableiten.
2. [ ] **Apex-Domain prüfen.** Den Worker `inner-circle` in Cloudflare
   Workers → Settings/ Domains & Routes mit `innercirclevp.com` verbinden bzw.
   die bestehende Custom-Domain-Zuordnung verifizieren. Keine andere Host-URL
   zur primären Anwendung machen.
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
    oder alternative Host-URL dazwischenliegt.
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
18. [ ] **Kanonische URL kontrollieren:** ausschließlich
    `https://innercirclevp.com` als öffentliche Produkt- und Stripe-Rückleitungs-
    URL verwenden; technische Preview-/Provider-Hosts nicht als primäre URL
    in `NEXT_PUBLIC_SITE_URL` eintragen.

## Abbruch-/Rollback-Hinweis

Wenn Apex, TLS oder ein kritischer Smoke-Test fehlschlägt, keine Redirects auf
`www` erzwingen. Den Cutover stoppen und `NEXT_PUBLIC_SITE_URL` nicht
improvisiert ändern; DNS-/Zone-Zustand und Mail-Sender-Konfiguration bleiben
unangetastet, bis die zuständige Freigabe vorliegt.
