/**
 * Centralized internationalization dictionaries.
 *
 * Rule: no hardcoded UI text in components. Every user-facing string lives in
 * this module tree (German + English). TypeScript enforces that both locales
 * share the exact same shape.
 *
 * Namespaces:
 *   meta/brand/nav/common/home/pages/footer/legal/design  – public website (STEP 02)
 *   home2/stats/publicNav/legalNotice                     – public website (Sprint 2.0)
 *   app.*                                                 – platform UI (Sprint 2.0)
 *     app.nav … app.dev          (core: dict/app-core.ts)
 *     app.profile … app.trust    (social: dict/app-social.ts)
 *     app.opportunities … app.admin (business: dict/app-business.ts)
 */

import { appCoreDe, appCoreEn } from "./dict/app-core";
import { appSocialDe, appSocialEn } from "./dict/app-social";
import { appBusinessDe, appBusinessEn } from "./dict/app-business";
import { siteV2De, siteV2En } from "./dict/site-v2";

const appDe = { ...appCoreDe, ...appSocialDe, ...appBusinessDe };
const appEn = { ...appCoreEn, ...appSocialEn, ...appBusinessEn };

const publicV2De = siteV2De;
const publicV2En = siteV2En;

export type Locale = "de" | "en";

export const locales: Locale[] = ["de", "en"];
export const defaultLocale: Locale = "de";

const siteDe = {
  meta: {
    title: "INNER CIRCLE – Netzwerk, Chancen und Wissen für Unternehmer, Investoren & Creator",
    description:
      "INNER CIRCLE verbindet ambitionierte Menschen, Unternehmer, Investoren und Creator – für echte Geschäftskontakte, Chancen, Wissen, Kapitalzugang und besondere Erlebnisse.",
  },
  brand: {
    name: "INNER CIRCLE",
    tagline: "Netzwerk für Unternehmer, Investoren & Creator",
  },
  nav: {
    home: "Start",
    network: "Network",
    businessDeals: "Business Deals",
    investments: "Investments",
    marketplace: "Marketplace",
    events: "Events",
    membership: "Membership",
    portfolio: "Portfolio",
    login: "Login",
    join: "Join Inner Circle",
    menuOpen: "Menü öffnen",
    menuClose: "Menü schließen",
    languageLabel: "Sprache",
    languageSwitch: "Sprache wechseln",
    themeLabel: "Erscheinungsbild",
    themeSwitch: "Erscheinungsbild wechseln",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeSystem: "System",
  },
  common: {
    comingSoon: "Demnächst verfügbar",
    comingSoonShort: "Demnächst",
    previewLabel: "Vorschau",
    learnMore: "Mehr erfahren",
    discover: "Entdecken",
    explore: " Erkunden",
    getStarted: "Jetzt starten",
    skipToContent: "Direkt zum Inhalt springen",
    imageNote: "Stimmungsbild · vorläufiger Platzhalter",
    exampleLabel: "Beispieldarstellung",
    notReleasedYet:
      "Diese Funktion ist Teil der laufenden Entwicklung und noch nicht aktiv.",
    closesNote: "Plattform im Aufbau",
    stepNote: "Umfangreiche Funktionen werden schrittweise gemäß Roadmap aktiviert.",
    backHome: "Zur Startseite",
    pageNotFoundTitle: "Seite nicht gefunden",
    pageNotFoundText:
      "Diese Seite existiert nicht (mehr). Nutze die Navigation, um zurückzufinden.",
    contactPlaceholder: "Kontakt (Platzhalter)",
    designSystemLink: "Design-System (intern)",
  },
  home: {
    heroBadge: "Eine exklusive, aber zugängliche Business-Community",
    heroTitleA: "DEIN NETZWERK.",
    heroTitleB: "DEINE CHANCEN.",
    heroDescription:
      "INNER CIRCLE verbindet ambitionierte Menschen, Unternehmer, Investoren und Creator – für neue geschäftliche Beziehungen, Partnerschaften und Möglichkeiten.",
    heroCtaPrimary: "Explore Inner Circle",
    heroCtaSecondary: "Join the Network",
    heroImageNote: "Stimmungsbild · vorläufiger Platzhalter",
    pillarsKicker: "Die Möglichkeiten",
    pillarsTitle: "Ein Netzwerk. Vier Wege, dein Business voranzubringen.",
    pillarsLead:
      "INNER CIRCLE bündelt Kontakte, Geschäftschancen, Wissen und Erlebnisse an einem Ort – kuratiert, persönlich und mit echtem Vertrauen.",
    pillars: {
      network: {
        title: "Network",
        desc: "Finde Unternehmer, Geschäftspartner und Menschen mit ähnlichen Ambitionen.",
        points: [
          "Kuratiertes Mitgliederverzeichnis",
          "Direkte Verbindungen & Nachrichten",
          "Sichtbare Reputation für echtes Vertrauen",
        ],
      },
      business: {
        title: "Business & Investments",
        desc: "Entdecke neue Geschäftsmöglichkeiten und potenzielle Investmentangebote.",
        points: [
          "Business Deals mit Bewerbungsprozess",
          "Geprüfte Investment-Chancen",
          "Diskrete Deal-Räume für Verhandlungen",
        ],
      },
      marketplace: {
        title: "Marketplace & Academy",
        desc: "Lerne neue Fähigkeiten, verkaufe eigenes Wissen und entdecke professionelle Dienstleistungen.",
        points: [
          "Kurse & Workshops von Experten",
          "Professionelle Services von Mitgliedern",
          "Wissen teilen und monetarisieren",
        ],
      },
      events: {
        title: "Events & Experiences",
        desc: "Knüpfe persönliche Kontakte und erlebe besondere Veranstaltungen.",
        points: [
          "Regelmäßige Networking-Events",
          "Persönliche Begegnungen statt reiner Chats",
          "Langfristig: außergewöhnliche Erlebnisse",
        ],
      },
    },
    trustKicker: "Trust & Reputation",
    trustTitle: "Vertrauen entsteht durch echte Zusammenarbeit.",
    trustLead:
      "Kein anonymer Marktplatz: INNER CIRCLE baut auf einem persönlichen Reputationssystem auf. Bewertungen und Auszeichnungen erhält nur, wer tatsächlich geschäftlich zusammengearbeitet hat – bestätigt und nachvollziehbar.",
    trustHowTitle: "So funktioniert es",
    trustSteps: [
      {
        title: "Bestätigte Zusammenarbeit",
        desc: "Nach einer gemeinsamen Geschäftsbeziehung bestätigen beide Seiten die Zusammenarbeit.",
      },
      {
        title: "Bewertung mit 1–5 Sternen",
        desc: "Gegenseitige Sternebewertung – nur aus echten, bestätigten Kooperationen.",
      },
      {
        title: "Auszeichnungen verdienen",
        desc: "Besondere Leistungen werden mit Auszeichnungen sichtbar gemacht.",
      },
    ],
    trustExample: {
      label: "Beispieldarstellung – kein echtes Mitglied",
      name: "Alexandra M.",
      role: "Gründerin · Beratungsunternehmen (fiktives Beispiel)",
      ratingValue: "4,9",
      ratingCount: "12 bestätigte Bewertungen",
      ratingScale: "Skala: 1 bis 5 Sterne",
      badges: [
        "Verifizierte Geschäftspartnerin",
        "5 erfolgreiche Kollaborationen",
        "Gründungsmitglied",
      ],
      reviewQuote:
        "Ausgesprochen gut vorbereitet, klare Kommunikation und ein verlässlicher Abschluss. Gerade wieder zusammenarbeiten.",
      reviewAuthor: "Beispielbewertung eines fiktiven Geschäftspartners",
      disclaimer:
        "Alle Angaben auf dieser Karte sind frei erfunden und illustrativ – sie zeigen, wie das Reputationssystem später aussehen wird.",
    },
    eventsKicker: "Events & Community",
    eventsTitle: "Wo digitale Kontakte zu echten Begegnungen werden.",
    eventsLead:
      "Geschäft entsteht zwischen Menschen. INNER CIRCLE plant regelmäßige Networking-Events – und entwickelt langfristig außergewöhnliche Erlebnisse für seine Mitglieder.",
    eventsRegular: {
      label: "Geplantes Format",
      title: "Networking-Events",
      desc: "Regelmäßige Begegnungen in entspannter, professioneller Atmosphäre.",
      points: [
        "Informelle Abende in wechselnden Städten",
        "Kuratierte Gästelisten aus der Community",
        "Themenspotlights statt Smalltalk",
      ],
    },
    eventsVision: {
      label: "Langfristige Vision",
      title: "Außergewöhnliche Experiences",
      desc: "Internationale Erlebnisse, die Mitglieder zusammenbringen – einzigartig, sorgfältig gestaltet, unvergesslich.",
      points: [
        "Internationale Destinationen",
        "Kleine Kreise, hohe Qualität",
        "Nur für Mitglieder: unvergessliche Momente",
      ],
    },
    eventsDisclaimer:
      "Konzeptionelle Vision und geplante Formate – noch keine bestätigten Veranstaltungen. Termine werden zu gegebener Zeit hier angekündigt.",
    eventsCta: "Events entdecken",
    membershipKicker: "Membership",
    membershipTitle: "Eine Mitgliedschaft. Der Zugang zu allem.",
    membershipLead:
      "Keine Stufen, keine versteckten Upgrades: eine einheitliche Mitgliedschaft eröffnet dir das gesamte Netzwerk mit allen regulären Plattformfunktionen.",
    membershipPlanName: "Inner Circle Mitgliedschaft",
    membershipPrice: "24,99 €",
    membershipPeriod: "/ Monat",
    membershipPriceNote: "Monatlich kündbar · Zahlung startet erst mit Kontoführung",
    membershipIncludedTitle: "Enthalten",
    membershipIncluded: [
      "Vollzugang zum Netzwerk & Mitgliederverzeichnis",
      "Business Deals & Investment-Vorschauen",
      "Marketplace & Academy",
      "Regelmäßige Events & Community",
      "Persönliches Reputationssystem & Auszeichnungen",
      "Deutsch & Englisch · Light & Dark Mode",
    ],
    membershipAnnualTitle: "Jahresmitgliedschaft",
    membershipAnnualBadge: "Preis folgt",
    membershipAnnualDesc:
      "Zusätzlich geplant: eine Jahresmitgliedschaft mit Preisvorteil gegenüber der Monatszahlung.",
    membershipAnnualNote: "Der endgültige Jahrespreis ist noch nicht festgelegt.",
    membershipCta: "Mitglied werden",
    membershipLoginCta: "Du hast bereits ein Konto? Login",
    membershipFootnote:
      "Hinweis: Die Zahlungsfunktion ist noch nicht aktiv. Die Abrechnung wird mit der Einführung der Mitgliedschaft (Schritt 05) getestet und freigeschaltet.",
    faqTitle: "Häufige Fragen",
    faq: [
      {
        q: "Was macht INNER CIRCLE anders als klassische Business-Netzwerke?",
        a: "INNER CIRCLE verbindet Networking, Geschäftschancen, Investments, Wissensmarkt und echte Events an einem Ort – mit persönlichem Reputationssystem statt anonymer Profile.",
      },
      {
        q: "Wann kann ich mich anmelden?",
        a: "Die Plattform entsteht Schritt für Schritt. Registrierung und Login werden mit Schritt 04 der Roadmap aktiviert. Diese Website zeigt bereits die geplante Struktur.",
      },
      {
        q: "Wann startet die Zahlung der Mitgliedschaft?",
        a: "Erst mit der Freischaltung der Mitgliedschaft in einem späteren Entwicklungsschritt. Bis dahin entstehen keine Kosten.",
      },
      {
        q: "Wie funktioniert die Sternebewertung?",
        a: "Mitglieder bewerten sich gegenseitig mit 1 bis 5 Sternen – ausschließlich nach bestätigten geschäftlichen Zusammenarbeiten. So bleiben Bewertungen echt und belastbar.",
      },
    ],
    finalTitle: "Der innere Kreis öffnet sich.",
    finalText:
      "Die Plattform wächst Schritt für Schritt. Registriere dich vorab und erfahre früh, wann Konten und Mitgliedschaften starten.",
    finalPrimary: "Jetzt registrieren",
    finalSecondary: "Mitgliedschaft ansehen",
  },
  pages: {
    network: {
      kicker: "Network",
      title: "Menschen, die dein Business wirklich voranbringen.",
      lead: "Das Herzstück von INNER CIRCLE: ein kuratiertes Netzwerk aus Unternehmern, Investoren und Creators. Entdecke relevante Profile, verbinde dich absichtsvoll und baue Beziehungen auf, die halten.",
      metaTitle: "Network – INNER CIRCLE",
      metaDescription:
        "Entdecke Unternehmer, Geschäftspartner und Menschen mit ähnlichen Ambitionen im INNER-CIRCLE-Netzwerk.",
      imageAlt: "Zwei Fachleute im Gespräch in einer hochwertigen Lounge",
      features: [
        {
          title: "Entdecken",
          desc: "Mitgliederverzeichnis mit Suche und Filtern – finde genau die Menschen, die zu deinen Zielen passen.",
        },
        {
          title: "Verbinden",
          desc: "Verbindungsanfragen mit persönlicher Nachricht. Beidseitig bestätigt – kein ungefragter Spam.",
        },
        {
          title: "Nachrichten",
          desc: "Direkter 1:1-Chat nach bestätigter Verbindung: Verlauf, Dateien, Ungelesen-Zähler.",
        },
        {
          title: "Reputation sichtbar",
          desc: "Sternebewertungen und Auszeichnungen aus bestätigten Zusammenarbeiten – auf jedem Profil.",
        },
      ],
      stepsTitle: "So wird es funktionieren",
      steps: [
        {
          title: "Profil aufbauen",
          desc: "Erzähle, wer du bist, was du machst und wonach du suchst.",
        },
        {
          title: "Menschen finden",
          desc: "Entdecke passende Mitglieder über Suche, Filter und Vorschläge.",
        },
        {
          title: "Verbinden & sprechen",
          desc: "Sende eine Anfrage, werde bestätigt und starte den direkten Austausch.",
        },
      ],
      comingSoonTitle: "Was hier später entsteht",
      comingSoonItems: [
        "Mitgliederverzeichnis mit Suche & Filtern",
        "Empfehlungen relevanter Mitglieder",
        "Folgen vs. Vernetzen mit Anfrage-Workflow",
        "1:1-Nachrichten mit Verlauf & Dateien",
        "Blockieren & Melden mit Moderation",
      ],
      ctaTitle: "Bereit für deinen inneren Kreis?",
      ctaText:
        "Die ersten Mitglieder erhalten Zugriff, sobald Konten freigeschaltet werden. Registriere dich vorab.",
    },
    businessDeals: {
      kicker: "Business Deals",
      title: "Geschäftschancen, die wirklich passen.",
      lead: "Von Vertriebspartnerschaften bis Unternehmensnachfolge: teile Geschäftschancen, bewirb dich gezielt und verhandle in diskreten Deal-Räumen – begleitet statt anonym.",
      metaTitle: "Business Deals – INNER CIRCLE",
      metaDescription:
        "Entdecke Geschäftsmöglichkeiten im INNER CIRCLE: Kooperationen, Aufträge, Partnerschaften und Nachfolgen mit klarem Bewerbungsprozess.",
      imageAlt: "Zwei Fachleute schließen eine Vereinbarung in einem Penthouse-Büro ab",
      formatsTitle: "Geplante Deal-Formate",
      formats: [
        "Kooperationen & Joint Ventures",
        "Projektaufträge & Ausschreibungen",
        "Vertriebs- & Channel-Partnerschaften",
        "Unternehmensnachfolgen",
      ],
      processTitle: "So läuft ein Deal ab",
      features: [
        {
          title: "Chance einstellen",
          desc: "Beschreibe dein Vorhaben strukturiert: Kontext, Ziele, Anforderungen.",
        },
        {
          title: "Gezielt bewerben",
          desc: "Interessenten bewerben sich mit Aussage statt One-Click – Qualität statt Masse.",
        },
        {
          title: "Deal-Raum öffnen",
          desc: "Ausgewählte Kandidaten verhandeln in einem privaten, geschützten Raum.",
        },
        {
          title: "Gemeinsam abschließen",
          desc: "Vereinbarungen dokumentieren, umsetzen – und sich gegenseitig bewerten.",
        },
      ],
      noteTitle: "Vertrauen ist der Standard",
      note: "Jeder Deal läuft über bestätigte Profile. Der Abschluss einer Zusammenarbeit wird bestätigt und fließt in das Reputationssystem beider Seiten ein.",
      comingSoonTitle: "Was hier später entsteht",
      comingSoonItems: [
        "Deal-Marktplatz mit Kategorien & Filtern",
        "Bewerbungsprozess mit Auswahl",
        "Private Deal-Räume mit Verlauf & Dateien",
        "Deal-Abschluss-Bestätigung & Bewertung",
        "Brokerage-Option für Vermittler",
      ],
      ctaTitle: "Deine erste Chance wartet nicht.",
      ctaText:
        "Sobald Business Deals live gehen, erblicken angemeldete Mitglieder neue Chancen zuerst.",
    },
    investments: {
      kicker: "Investments",
      title: "Zugang zu geprüften Investment-Möglichkeiten.",
      lead: "INNER CIRCLE bringt Investoren und Unternehmer mit substanziellen Möglichkeiten zusammen – geprüft, strukturiert und mit klaren Erwartungen auf beiden Seiten.",
      metaTitle: "Investments – INNER CIRCLE",
      metaDescription:
        "Geprüfte Investment-Chancen und strukturierte Investoren-Anfragen – diskret und mit klarem Prozess.",
      imageAlt: "Investoren besprechen Unterlagen in einem Konferenzraum bei Abendlicht",
      features: [
        {
          title: "Geprüfte Chancen",
          desc: "Angebote werden vor Veröffentlichung überprüft – Struktur und Vollständigkeit statt Blindversprechen.",
        },
        {
          title: "Strukturierte Unterlagen",
          desc: "Teasern, Dokumente und klare Prozessschritte – damit beide Seiten schnell wissen, woran sie sind.",
        },
        {
          title: "Diskretion zuerst",
          desc: "Sensible Details werden erst nach gegenseitigem Interesse und ggf. NDA geteilt.",
        },
        {
          title: "Investoren-Anfragen",
          desc: "Auch umgekehrt: Investoren können Suchprofile hinterlegen und gefunden werden.",
        },
      ],
      typesTitle: "Geplante Chancen-Typen",
      types: [
        "Startup-Finanzierungen",
        "Wachstums- & Expansionskapital",
        "Immobilien-Projekte",
        "Beteiligungen & Co-Investments",
      ],
      disclaimerTitle: "Wichtiger Hinweis",
      disclaimer:
        "INNER CIRCLE ist keine Anlageberatung und keine Vermittlung nach §§ 15, 34f GewO (DE). Es werden keine Renditeversprechen gemacht. Investitionen sind mit Risiken verbunden. Rechtlicher Rahmen und Prüfprozesse werden vor dem Launch final umgesetzt.",
      comingSoonTitle: "Was hier später entsteht",
      comingSoonItems: [
        "Geprüfte Investment-Chancen mit strukturierten Teasern",
        "Interessensbekundungen mit NDA-Prozess",
        "Investoren-Suchprofile",
        "Nachweis- & Prüf-Workflow vor Veröffentlichung",
        "Diskrete Kommunikation im geschützten Raum",
      ],
      ctaTitle: "Auf der Watchlist bleiben.",
      ctaText:
        "Registriere dich vorab – du erfährst, sobald die ersten geprüften Chancen live gehen.",
    },
    marketplace: {
      kicker: "Marketplace & Academy",
      title: "Wissen lernen. Wissen verkaufen. Leistungen buchen.",
      lead: "Der Marktplatz von INNER CIRCLE verbindet Angebote der Community: Kurse und Workshops in der Academy, professionelle Dienstleistungen und Produkte im Marketplace.",
      metaTitle: "Marketplace & Academy – INNER CIRCLE",
      metaDescription:
        "Lerne neue Fähigkeiten, verkaufe dein Wissen und entdecke professionelle Dienstleistungen der INNER-CIRCLE-Community.",
      imageAlt: "Expertin hält eine kleine Masterclass für aufmerksame Teilnehmer",
      tabMarketplace: "Marketplace",
      tabAcademy: "Academy",
      marketplaceTab: {
        headline: "Professionelle Leistungen aus der Community",
        text: "Buche Dienstleistungen von Mitgliedern mit sichtbarer Reputation – oder biete deine eigenen Leistungen an.",
        features: [
          {
            title: "Services entdecken",
            desc: "Agenturleistungen, Beratung, Design, Entwicklung und mehr – von Mitgliedern für Mitglieder.",
          },
          {
            title: "Mit Reputation buchen",
            desc: "Bewertungen und bestätigte Aufträge zeigen dir, wen du vor dir hast.",
          },
          {
            title: "Selbst verkaufen",
            desc: "Biete deine eigenen Leistungen und Produkte an – im Kreis passender Kunden.",
          },
        ],
      },
      academyTab: {
        headline: "Wissen von Menschen, die es gelebt haben",
        text: "Die Academy bündelt Kurse und Workshops von Mitgliedern – praxisnah, kuratiert und mit echtem Betriebs-Blut.",
        features: [
          {
            title: "Kurse & Workshops",
            desc: "Lerne von Unternehmern, Investoren und Creators – kompakt und anwendbar.",
          },
          {
            title: "Wissen monetarisieren",
            desc: "Verkaufe dein eigenes Wissen als Kurs oder Workshop an die Community.",
          },
          {
            title: "Lernpfade",
            desc: "Themenbündel führen dich strukturiert von Grundlagen zu Fortgeschrittenem.",
          },
        ],
      },
      creatorNote:
        "Geplant: Creators & Referrals – Mitglieder empfehlen INNER CIRCLE und erhalten faire Beteiligung.",
      comingSoonTitle: "Was hier später entsteht",
      comingSoonItems: [
        "Kurskatalog mit Kauf & Zugang (Schritt 13)",
        "Service-Listings mit Buchungsanfragen",
        "Verkäufer-Profiles mit Reputation",
        "Bewertungen für Kurse & Leistungen",
        "Auszahlungen & Rechnungsgrundlagen",
      ],
      ctaTitle: "Teaching & Selling für Mitglieder.",
      ctaText:
        "Sobald der Marktplatz startet, kannst du Wissen anbieten, Leistungen buchen und wachsen.",
    },
    events: {
      kicker: "Events & Experiences",
      title: "Begegnungen, die bleiben.",
      lead: "Geschäft entsteht zwischen Menschen. INNER CIRCLE plant regelmäßige Networking-Events – und entwickelt langfristig außergewöhnliche internationale Erlebnisse für Mitglieder.",
      metaTitle: "Events & Experiences – INNER CIRCLE",
      metaDescription:
        "Regelmäßige Networking-Events und die Vision außergewöhnlicher internationaler Erlebnisse – persönlich, kuratiert, besonders.",
      regularTitle: "Regelmäßige Networking-Events",
      regularText:
        "Geplantes Format: entspannte, kuratierte Abende, auf denen Mitglieder einander wirklich kennenlernen – in wechselnden Städten.",
      regularPoints: [
        "Kuratierte Gästelisten aus der Community",
        "Wechselnde Städte & Locations",
        "Kurze thematische Impulse statt Smalltalk-Zwang",
      ],
      visionTitle: "Die Vision: außergewöhnliche Experiences",
      visionText:
        "Langfristig entstehen internationale Erlebnisse abseits des Alltäglichen – kleine Kreise, besondere Orte, unvergessliche Momente.",
      visionPoints: [
        "Internationale Destinationen",
        "Mehrtägige Formate in kleinem Kreis",
        "Nur für Mitglieder & eingeladene Gäste",
      ],
      upcomingTitle: "Nächste Termine",
      upcomingEmpty:
        "Noch keine Termine veröffentlicht. Die ersten Events werden hier angekündigt, sobald sie feststehen.",
      visionDisclaimer:
        "Hinweis: Geplante Formate und konzeptionelle Vision – noch keine bestätigten Veranstaltungen.",
      imageRegularAlt: "Networking-Abend auf einer Dachterrasse mit Stadtlichtern",
      imageVisionAlt: "Exklusives Abendessen auf einer Klippenterrasse am Meer",
      ctaTitle: "Dabei sein, wenn es startet.",
      ctaText:
        "Mitglieder erhalten vorrangigen Zugang zu allen Events. Sichere dir deinen Platz im Kreis.",
    },
    membership: {
      kicker: "Membership",
      title: "Ein Zugang. Das gesamte Ökosystem.",
      lead: "INNER CIRCLE bewusst exklusiv, aber zugänglich: eine einheitliche Mitgliedschaft eröffnet alle regulären Funktionen – Netzwerk, Deals, Investments, Marktplatz, Academy und Events.",
      metaTitle: "Membership – INNER CIRCLE",
      metaDescription:
        "Die INNER-CIRCLE-Mitgliedschaft: 24,99 € pro Monat, monatlich kündbar. Jahresmitgliedschaft mit Preisvorteil geplant.",
      monthlyTitle: "Monatsmitgliedschaft",
      monthlyBadge: "Standard",
      price: "24,99 €",
      period: "/ Monat",
      billingNote: "Monatlich kündbar · Zahlung startet erst mit Kontoführung",
      includedTitle: "Enthalten in jeder Mitgliedschaft",
      included: [
        "Vollzugang zum Netzwerk & Mitgliederverzeichnis",
        "Business Deals: Chancen entdecken & bewerben",
        "Investment-Vorschauen & Interessensbekundungen",
        "Marketplace & Academy: lernen, verkaufen, buchen",
        "Regelmäßige Events & Community",
        "Persönliches Reputationssystem & Auszeichnungen",
      ],
      annualTitle: "Jahresmitgliedschaft",
      annualBadge: "Preis folgt",
      annualText:
        "Zusätzlich geplant: eine Jahresmitgliedschaft mit Preisvorteil gegenüber der Monatszahlung – für alle, die langfristig dabei bleiben wollen.",
      annualNote: "Der endgültige Jahrespreis ist noch nicht festgelegt.",
      trialNote: "Jedes neue Konto beginnt mit einer kostenlosen 48-Stunden-Entdeckungsphase.",
      payNoteTitle: "Ehrlich gesagt:",
      payNote:
        "Die Zahlungsfunktion ist noch nicht aktiv. Preise und Abrechnung werden mit der Einführung der Mitgliedschaft (Schritt 05) getestet und freigeschaltet.",
      faqTitle: "Häufige Fragen",
      ctaTitle: "Bereit für den inneren Kreis?",
      ctaText: "Erstelle dein Konto, sobald die Registrierung startet – und wachse mit der Community.",
    },
    login: {
      kicker: "Login",
      title: "Willkommen zurück.",
      lead: "Melde dich an, um dein Netzwerk, deine Chancen und deine Messages zu sehen.",
      metaTitle: "Login – INNER CIRCLE",
      metaDescription: "Anmeldung für Mitglieder der INNER-CIRCLE-Community.",
      emailLabel: "E-Mail-Adresse",
      passwordLabel: "Passwort",
      submit: "Anmelden",
      forgot: "Passwort vergessen?",
      noAccount: "Noch kein Konto?",
      registerLink: "Jetzt registrieren",
      previewTitle: "Vorbereitung – noch nicht aktiv",
      previewText:
        "Konten und Anmeldung werden in Schritt 04 der Roadmap implementiert. Diese Seite zeigt bereits das spätere Design und Verhalten.",
      toastInfo:
        "Die Anmeldung ist noch nicht verfügbar – sie wird mit Schritt 04 implementiert.",
    },
    register: {
      kicker: "Registrierung",
      title: "Teil des Kreises werden.",
      lead: "Erstelle dein INNER-CIRCLE-Konto und starte in die Entdeckungsphase – kostenlos und ohne Zahlungsmittel.",
      metaTitle: "Registrierung – INNER CIRCLE",
      metaDescription:
        "Registriere dich für INNER CIRCLE: Netzwerk, Geschäftschancen, Investments, Marketplace und Events.",
      firstNameLabel: "Vorname",
      lastNameLabel: "Nachname",
      emailLabel: "E-Mail-Adresse",
      passwordLabel: "Passwort",
      submit: "Konto erstellen",
      haveAccount: "Bereits Mitglied?",
      loginLink: "Login",
      trialNote: "Jedes Konto startet mit einer kostenlosen 48-Stunden-Entdeckungsphase.",
      previewTitle: "Vorbereitung – noch nicht aktiv",
      previewText:
        "Konten und Registrierung werden in Schritt 04 der Roadmap implementiert. Dieses Formular demonstriert bereits das spätere Design mit allen Formularzuständen.",
      toastInfo:
        "Die Registrierung ist noch nicht verfügbar – sie wird mit Schritt 04 implementiert.",
      errorRequired: "Bitte fülle dieses Feld aus.",
      errorEmail: "Bitte gib eine gültige E-Mail-Adresse ein.",
      errorPassword: "Bitte wähle ein Passwort mit mindestens 8 Zeichen.",
      passwordHint: "Mindestens 8 Zeichen.",
    },
  },
  footer: {
    tagline:
      "Die exklusive Business-Community für Unternehmer, Investoren und Creator. Kontakte knüpfen, Chancen entdecken, Wissen erwerben, Events erleben.",
    platformTitle: "Plattform",
    companyTitle: "Projekt",
    legalTitle: "Rechtliches",
    contact: "Kontakt",
    contactNote: "(Platzhalter bis zum Launch)",
    copyright: "INNER CIRCLE – im Aufbau. Alle Rechte vorbehalten.",
    disclaimer:
      "Entwicklungsvorschau: Diese Website befindet sich im Aufbau. Noch nicht implementierte Funktionen sind als „Demnächst verfügbar“ gekennzeichnet. Alle Bilder sind vorläufige, KI-generierte Stimmungsbilder und zeigen keine tatsächlichen INNER-CIRCLE-Veranstaltungen oder Mitglieder. Keine Anlageberatung, keine Erfolgsversprechen. Preise können sich vor dem Launch ändern.",
    imprint: "Impressum",
    privacy: "Datenschutz",
    terms: "AGB",
  },
  legal: {
    placeholderTitle: "Platzhalterseite",
    placeholderText:
      "Diese Seite ist ein Platzhalter. Der endgültige Inhalt wird vor der öffentlichen Veröffentlichung erstellt und rechtlich geprüft. An dieser Stelle werden bewusst keine fiktiven Unternehmensdaten oder vermeintlich rechtsgeprüften Texte dargestellt.",
    backLink: "Zurück zur Startseite",
    imprint: {
      title: "Impressum",
      metaTitle: "Impressum – INNER CIRCLE",
      metaDescription: "Impressum der Website INNER CIRCLE (Platzhalter).",
    },
    privacy: {
      title: "Datenschutz",
      metaTitle: "Datenschutz – INNER CIRCLE",
      metaDescription: "Datenschutzhinweise der Website INNER CIRCLE (Platzhalter).",
    },
    terms: {
      title: "AGB",
      metaTitle: "AGB – INNER CIRCLE",
      metaDescription: "Allgemeine Geschäftsbedingungen von INNER CIRCLE (Platzhalter).",
    },
  },
  design: {
    kicker: "Intern",
    title: "INNER CIRCLE Design-System",
    lead: "Die gemeinsame visuelle Grundlage für öffentliche Website und späteren Mitgliederbereich – konsistent in Light und Dark Mode, responsiv und barrierearm.",
    metaTitle: "Design-System – INNER CIRCLE",
    metaDescription:
      "Interne Übersicht des INNER-CIRCLE-Design-Systems: Tokens, Typografie und Komponenten.",
    colorsTitle: "Farben",
    colorsLead:
      "Marke: Midnight Navy & Off White. Interaktionen: Electric Blue. Exklusivität: Champagne (dezent).",
    colorNeutral: "Neutralflächen",
    colorElectric: "Funktionale Akzentfarbe",
    colorChampagne: "Exklusiv-Akzent",
    typographyTitle: "Typografie",
    typographyLead:
      "Inter (next/font, self-hosted). Konsistente Skala, große Überschriften transportieren die Kernbotschaft.",
    displaySample: "Display · Für die größten Aussagen",
    h1Sample: "Überschrift H1",
    h2Sample: "Überschrift H2",
    h3Sample: "Überschrift H3",
    bodySample: "Fließtext – für Beschreibungen und Absätze mit komfortabler Zeilenhöhe.",
    captionSample: "Caption · Für Hinweise und Bildnachweise",
    buttonsTitle: "Buttons",
    buttonsLead: "Primär (Electric), Sekundär (Outline), Ghost, Exklusiv (Champagne).",
    buttonPrimary: "Primär",
    buttonSecondary: "Sekundär",
    buttonGhost: "Ghost",
    buttonExclusive: "Exklusiv",
    buttonDisabled: "Deaktiviert",
    badgesTitle: "Badges",
    badgesLead: "Für Status, Hinweise und Auszeichnungen.",
    badgeNeutral: "Neutral",
    badgeElectric: "Elektrisch",
    badgeChampagne: "Champagne",
    badgeSuccess: "Erfolg",
    badgeDanger: "Fehler",
    inputsTitle: "Eingabefelder",
    inputsLead: "Mit Label, Hinweistext, Fehler- und Deaktiviert-Zustand.",
    inputLabelDefault: "E-Mail-Adresse",
    inputPlaceholder: "name@beispiel.de",
    inputHint: "Wir verwenden deine Adresse nur für Konto & wichtige Updates.",
    inputLabelError: "Firma",
    inputError: "Bitte fülle dieses Feld aus.",
    inputLabelDisabled: "Kundennummer (später)",
    inputDisabledHint: "Verfügbar ab Schritt 04.",
    textareaLabel: "Nachricht",
    textareaPlaceholder: "Worum geht es?",
    cardsTitle: "Karten",
    cardsLead: "Ruhige Flächen mit dezenter Umrandung; interaktive Karten heben sich bei Hover.",
    cardTitle: "Standardkarte",
    cardText: "Eine ruhige Karte für Inhalte – mit konsistenter Umrandung und Radius.",
    cardInteractiveTitle: "Interaktive Karte",
    cardInteractiveText: "Hebt sich bei Hover an – für auswählbare Inhalte.",
    dialogsTitle: "Dialog",
    dialogsLead: "Modaler Dialog mit Fokus-Falle, Escape- und Backdrop-Schließen.",
    dialogOpenButton: "Dialog öffnen",
    dialogTitle: "Beispieldialog",
    dialogBody:
      "Dialoge werden für Bestätigungen und kurze Formulare im Mitgliederbereich genutzt.",
    dialogCancel: "Schließen",
    dialogConfirm: "Verstanden",
    dropdownTitle: "Dropdown",
    dropdownLead: "Für Sprach- und Theme-Auswahl sowie Kontextmenüs.",
    dropdownTrigger: "Optionen wählen",
    dropdownItems: ["Erste Option", "Zweite Option", "Dritte Option"],
    tabsTitle: "Tabs",
    tabsLead: "Zum Wechseln verwandter Ansichten ohne Seitenwechsel.",
    tabOne: "Übersicht",
    tabTwo: "Details",
    tabThree: "Aktivität",
    tabOnePanel: "Inhalt des Tabs „Übersicht“ – ein Platzhaltertext.",
    tabTwoPanel: "Inhalt des Tabs „Details“ – ein Platzhaltertext.",
    tabThreePanel: "Inhalt des Tabs „Aktivität“ – ein Platzhaltertext.",
    toastsTitle: "Benachrichtigungen",
    toastsLead: "Kurze Rückmeldungen unten rechts, automatisch ausblendend.",
    toastInfoBtn: "Info-Toast",
    toastSuccessBtn: "Erfolgs-Toast",
    toastErrorBtn: "Fehler-Toast",
    toastInfoText: "Das ist eine neutrale Information.",
    toastSuccessText: "Aktion erfolgreich ausgeführt (Demo).",
    toastErrorText: "Da ist etwas schiefgelaufen (Demo).",
    progressTitle: "Statusanzeigen",
    progressLead: "Fortschritt und Status, z. B. für Profilvollständigkeit.",
    progressLabel: "Profilvollständigkeit",
    ratingTitle: "Sternebewertung",
    ratingLead: "Festgelegte Skala 1–5, nur für bestätigte Zusammenarbeiten.",
    avatarsTitle: "Avatare",
    avatarsLead: "Initialen-Avatare als vorläufige Darstellung.",
    motionTitle: "Bewegung",
    motionLead:
      "Dezente Übergänge, Scroll-Reveals und Hover-Effekte – respektiert prefers-reduced-motion.",
    formStatesTitle: "Formularzustände",
    formStatesLead: "Standard, Fokus, Fehler, Erfolg, Deaktiviert – konsistent über alle Formulare.",
    a11yTitle: "Barrierefreiheit",
    a11yItems: [
      "Sichtbare Fokusringe für Tastaturnutzung",
      "ARIA-Attribute für Tabs, Dialoge, Dropdowns & Badges",
      "Kontraste in beiden Modi geprüft",
      "Reduced Motion wird respektiert",
      "Skip-Link zum Hauptinhalt",
    ],
  },
};

export type SiteDictionary = typeof siteDe;

const siteEnRaw: SiteDictionary = {
  meta: {
    title: "INNER CIRCLE – Find the people and chances that move your business forward",
    description:
      "A business platform for ambitious people: customers, partners, capital, investments, knowledge and events. One access, €24.99 a month.",
  },
  brand: {
    name: "INNER CIRCLE",
    tagline: "Network for founders, investors & creators",
  },
  nav: {
    home: "Home",
    network: "Network",
    businessDeals: "Business Deals",
    investments: "Investments",
    marketplace: "Marketplace",
    events: "Events",
    membership: "Membership",
    portfolio: "Portfolio",
    login: "Login",
    join: "Join Inner Circle",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    languageLabel: "Language",
    languageSwitch: "Switch language",
    themeLabel: "Appearance",
    themeSwitch: "Switch appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
  },
  common: {
    comingSoon: "Coming soon",
    comingSoonShort: "Soon",
    previewLabel: "Preview",
    learnMore: "Learn more",
    discover: "Discover",
    explore: "Explore",
    getStarted: "Get started",
    skipToContent: "Skip to content",
    imageNote: "Mood image · temporary placeholder",
    exampleLabel: "Illustrative example",
    notReleasedYet:
      "This feature is part of the ongoing development and is not active yet.",
    closesNote: "Platform in the making",
    stepNote: "Core features will be activated step by step according to the roadmap.",
    backHome: "Back to home",
    pageNotFoundTitle: "Page not found",
    pageNotFoundText:
      "This page does not exist (anymore). Use the navigation to find your way back.",
    contactPlaceholder: "Contact (placeholder)",
    designSystemLink: "Design system (internal)",
  },
  home: {
    heroBadge: "An exclusive yet accessible business community",
    heroTitleA: "YOUR NETWORK.",
    heroTitleB: "YOUR OPPORTUNITIES.",
    heroDescription:
      "INNER CIRCLE connects ambitious people, founders, investors and creators – for new business relationships, partnerships and opportunities.",
    heroCtaPrimary: "Explore Inner Circle",
    heroCtaSecondary: "Join the Network",
    heroImageNote: "Mood image · temporary placeholder",
    pillarsKicker: "What's inside",
    pillarsTitle: "One network. Four ways to move your business forward.",
    pillarsLead:
      "INNER CIRCLE brings contacts, business opportunities, knowledge and experiences together in one place – curated, personal and built on real trust.",
    pillars: {
      network: {
        title: "Network",
        desc: "Find founders, business partners and people with similar ambitions.",
        points: [
          "Curated member directory",
          "Direct connections & messaging",
          "Visible reputation for real trust",
        ],
      },
      business: {
        title: "Business & Investments",
        desc: "Discover new business opportunities and potential investment offerings.",
        points: [
          "Business deals with an application process",
          "Reviewed investment opportunities",
          "Discreet deal rooms for negotiations",
        ],
      },
      marketplace: {
        title: "Marketplace & Academy",
        desc: "Learn new skills, sell your knowledge and discover professional services.",
        points: [
          "Courses & workshops by experts",
          "Professional services from members",
          "Share and monetize your knowledge",
        ],
      },
      events: {
        title: "Events & Experiences",
        desc: "Build personal relationships and experience exceptional occasions.",
        points: [
          "Regular networking events",
          "Personal encounters instead of pure chats",
          "Long term: extraordinary experiences",
        ],
      },
    },
    trustKicker: "Trust & Reputation",
    trustTitle: "Trust is earned through real collaboration.",
    trustLead:
      "Not an anonymous marketplace: INNER CIRCLE is built on a personal reputation system. Ratings and awards are only earned through verified business collaborations – confirmed and transparent.",
    trustHowTitle: "How it works",
    trustSteps: [
      {
        title: "Verified collaboration",
        desc: "After doing business together, both sides confirm the collaboration.",
      },
      {
        title: "1–5 star rating",
        desc: "Mutual star ratings – only from real, confirmed cooperations.",
      },
      {
        title: "Earn distinctions",
        desc: "Special achievements become visible through awards and badges.",
      },
    ],
    trustExample: {
      label: "Illustrative example – not a real member",
      name: "Alexandra M.",
      role: "Founder · consultancy (fictional example)",
      ratingValue: "4.9",
      ratingCount: "12 verified ratings",
      ratingScale: "Scale: 1 to 5 stars",
      badges: [
        "Verified business partner",
        "5 successful collaborations",
        "Founding member",
      ],
      reviewQuote:
        "Extremely well prepared, clear communication and a reliable close. Would work together again any time.",
      reviewAuthor: "Example rating from a fictional business partner",
      disclaimer:
        "Everything on this card is fictional and illustrative – it demonstrates how the reputation system will look in the future.",
    },
    eventsKicker: "Events & Community",
    eventsTitle: "Where digital contacts become real encounters.",
    eventsLead:
      "Business happens between people. INNER CIRCLE plans regular networking events – and is developing extraordinary experiences for its members over the long term.",
    eventsRegular: {
      label: "Planned format",
      title: "Networking Events",
      desc: "Regular encounters in a relaxed, professional atmosphere.",
      points: [
        "Informative evenings in changing cities",
        "Curated guest lists from the community",
        "Topic spotlights instead of small talk",
      ],
    },
    eventsVision: {
      label: "Long-term vision",
      title: "Extraordinary Experiences",
      desc: "International experiences that bring members together – unique, carefully designed, unforgettable.",
      points: [
        "International destinations",
        "Small circles, high quality",
        "Members only: unforgettable moments",
      ],
    },
    eventsDisclaimer:
      "Conceptual vision and planned formats – no confirmed events yet. Dates will be announced here in due time.",
    eventsCta: "Discover events",
    membershipKicker: "Membership",
    membershipTitle: "One membership. Access to everything.",
    membershipLead:
      "No tiers, no hidden upgrades: one uniform membership opens the entire network with all regular platform features.",
    membershipPlanName: "Inner Circle Membership",
    membershipPrice: "€24.99",
    membershipPeriod: "/ month",
    membershipPriceNote: "Cancel monthly · Billing starts only once accounts go live",
    membershipIncludedTitle: "Included",
    membershipIncluded: [
      "Full access to the network & member directory",
      "Business deals & investment previews",
      "Marketplace & Academy",
      "Regular events & community",
      "Personal reputation system & awards",
      "German & English · light & dark mode",
    ],
    membershipAnnualTitle: "Annual membership",
    membershipAnnualBadge: "Pricing to follow",
    membershipAnnualDesc:
      "Also planned: an annual membership with a saving compared to monthly billing.",
    membershipAnnualNote: "The final annual price has not been set yet.",
    membershipCta: "Become a member",
    membershipLoginCta: "Already have an account? Log in",
    membershipFootnote:
      "Note: Payment is not active yet. Billing will be tested and enabled when the membership launches (Step 05).",
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What makes INNER CIRCLE different from classic business networks?",
        a: "INNER CIRCLE combines networking, business opportunities, investments, a knowledge market and real events in one place – with a personal reputation system instead of anonymous profiles.",
      },
      {
        q: "When can I sign up?",
        a: "The platform is being built step by step. Registration and login will be activated with Step 04 of the roadmap. This website already shows the planned structure.",
      },
      {
        q: "When does membership billing start?",
        a: "Only when the membership is enabled in a later development step. Until then, you will not be charged anything.",
      },
      {
        q: "How does the star rating work?",
        a: "Members rate each other with 1 to 5 stars – exclusively after verified business collaborations. This keeps ratings genuine and reliable.",
      },
    ],
    finalTitle: "The inner circle is opening.",
    finalText:
      "The platform grows step by step. Sign up in advance and be the first to hear when accounts and memberships go live.",
    finalPrimary: "Register now",
    finalSecondary: "View membership",
  },
  pages: {
    network: {
      kicker: "Network",
      title: "People who genuinely move your business forward.",
      lead: "The heart of INNER CIRCLE: a curated network of founders, investors and creators. Discover relevant profiles, connect with intent and build relationships that last.",
      metaTitle: "Network – INNER CIRCLE",
      metaDescription:
        "Meet founders, business partners and people with similar ambitions in the INNER CIRCLE network.",
      imageAlt: "Two professionals in conversation in an upscale lounge",
      features: [
        {
          title: "Discover",
          desc: "A member directory with search and filters – find exactly the people who fit your goals.",
        },
        {
          title: "Connect",
          desc: "Connection requests with a personal note. Confirmed by both sides – no unsolicited spam.",
        },
        {
          title: "Messages",
          desc: "Direct 1:1 chat after a confirmed connection: history, files, unread counter.",
        },
        {
          title: "Visible reputation",
          desc: "Star ratings and awards from verified collaborations – on every profile.",
        },
      ],
      stepsTitle: "How it will work",
      steps: [
        {
          title: "Build your profile",
          desc: "Tell people who you are, what you do and what you are looking for.",
        },
        {
          title: "Find people",
          desc: "Discover matching members via search, filters and suggestions.",
        },
        {
          title: "Connect & talk",
          desc: "Send a request, get confirmed and start the direct conversation.",
        },
      ],
      comingSoonTitle: "What will live here",
      comingSoonItems: [
        "Member directory with search & filters",
        "Suggestions for relevant members",
        "Follow vs. connect with request workflow",
        "1:1 messaging with history & files",
        "Blocking & reporting with moderation",
      ],
      ctaTitle: "Ready for your inner circle?",
      ctaText:
        "The first members get access as soon as accounts are enabled. Register in advance.",
    },
    businessDeals: {
      kicker: "Business Deals",
      title: "Business opportunities that truly fit.",
      lead: "From sales partnerships to business succession: share opportunities, apply with intent and negotiate in discreet deal rooms – accompanied instead of anonymous.",
      metaTitle: "Business Deals – INNER CIRCLE",
      metaDescription:
        "Discover business opportunities inside INNER CIRCLE: cooperations, projects, partnerships and successions with a clear application process.",
      imageAlt: "Two professionals closing an agreement in a penthouse office",
      formatsTitle: "Planned deal formats",
      formats: [
        "Cooperations & joint ventures",
        "Projects & tenders",
        "Sales & channel partnerships",
        "Business successions",
      ],
      processTitle: "How a deal flows",
      features: [
        {
          title: "Post an opportunity",
          desc: "Describe your project in a structured way: context, goals, requirements.",
        },
        {
          title: "Apply with intent",
          desc: "Candidates apply with substance instead of one click – quality over volume.",
        },
        {
          title: "Open a deal room",
          desc: "Shortlisted candidates negotiate in a private, protected room.",
        },
        {
          title: "Close together",
          desc: "Document agreements, deliver – and rate each other afterwards.",
        },
      ],
      noteTitle: "Trust is the standard",
      note: "Every deal runs on verified profiles. The completion of a collaboration gets confirmed and feeds the reputation system of both sides.",
      comingSoonTitle: "What will live here",
      comingSoonItems: [
        "Deal marketplace with categories & filters",
        "Application process with selection",
        "Private deal rooms with history & files",
        "Deal completion confirmation & rating",
        "Brokerage option for intermediaries",
      ],
      ctaTitle: "Your next opportunity won't wait.",
      ctaText:
        "When business deals go live, registered members see new opportunities first.",
    },
    investments: {
      kicker: "Investments",
      title: "Access to reviewed investment opportunities.",
      lead: "INNER CIRCLE brings investors and founders with substantial opportunities together – reviewed, structured and with clear expectations on both sides.",
      metaTitle: "Investments – INNER CIRCLE",
      metaDescription:
        "Reviewed investment opportunities and structured investor inquiries – discreet and with a clear process.",
      imageAlt: "Investors reviewing documents in a conference room at dusk",
      features: [
        {
          title: "Reviewed opportunities",
          desc: "Offerings are checked before publication – structure and completeness instead of blind promises.",
        },
        {
          title: "Structured documents",
          desc: "Teasers, documents and clear process steps – so both sides quickly know where they stand.",
        },
        {
          title: "Discretion first",
          desc: "Sensitive details are shared only after mutual interest and, if applicable, an NDA.",
        },
        {
          title: "Investor inquiries",
          desc: "The other way around too: investors can publish search profiles and get found.",
        },
      ],
      typesTitle: "Planned opportunity types",
      types: [
        "Startup financings",
        "Growth & expansion capital",
        "Real estate projects",
        "Equity & co-investments",
      ],
      disclaimerTitle: "Important notice",
      disclaimer:
        "INNER CIRCLE does not provide investment advice or brokerage services. No returns are promised. All investments carry risk. The legal framework and review processes will be finalized before launch.",
      comingSoonTitle: "What will live here",
      comingSoonItems: [
        "Reviewed investment opportunities with structured teasers",
        "Expressions of interest with an NDA process",
        "Investor search profiles",
        "Verification & review workflow before publication",
        "Discreet communication in protected rooms",
      ],
      ctaTitle: "Stay on the watchlist.",
      ctaText:
        "Register in advance – you will hear as soon as the first reviewed opportunities go live.",
    },
    marketplace: {
      kicker: "Marketplace & Academy",
      title: "Learn knowledge. Sell knowledge. Book services.",
      lead: "The INNER CIRCLE marketplace brings the community's offerings together: courses and workshops in the Academy, professional services and products in the Marketplace.",
      metaTitle: "Marketplace & Academy – INNER CIRCLE",
      metaDescription:
        "Learn new skills, sell your knowledge and discover professional services from the INNER CIRCLE community.",
      imageAlt: "An expert leading a small masterclass with attentive participants",
      tabMarketplace: "Marketplace",
      tabAcademy: "Academy",
      marketplaceTab: {
        headline: "Professional services from the community",
        text: "Book services from members with visible reputation – or offer your own services.",
        features: [
          {
            title: "Discover services",
            desc: "Agency work, consulting, design, development and more – members for members.",
          },
          {
            title: "Book with reputation",
            desc: "Ratings and verified projects show you exactly who you are dealing with.",
          },
          {
            title: "Sell yourself",
            desc: "Offer your own services and products – to a circle of fitting customers.",
          },
        ],
      },
      academyTab: {
        headline: "Knowledge from people who lived it",
        text: "The Academy bundles courses and workshops by members – practical, curated and with real battle scars.",
        features: [
          {
            title: "Courses & workshops",
            desc: "Learn from founders, investors and creators – compact and applicable.",
          },
          {
            title: "Monetize knowledge",
            desc: "Sell your own knowledge as a course or workshop to the community.",
          },
          {
            title: "Learning paths",
            desc: "Topic bundles guide you from fundamentals to advanced levels.",
          },
        ],
      },
      creatorNote:
        "Planned: creators & referrals – members recommend INNER CIRCLE and receive a fair share.",
      comingSoonTitle: "What will live here",
      comingSoonItems: [
        "Course catalog with purchase & access (Step 13)",
        "Service listings with booking requests",
        "Seller profiles with reputation",
        "Ratings for courses & services",
        "Payouts & invoicing basics",
      ],
      ctaTitle: "Teaching & selling for members.",
      ctaText:
        "When the marketplace starts, you can offer knowledge, book services and grow.",
    },
    events: {
      kicker: "Events & Experiences",
      title: "Encounters that last.",
      lead: "Business happens between people. INNER CIRCLE plans regular networking events – and is developing extraordinary international experiences for members over the long term.",
      metaTitle: "Events & Experiences – INNER CIRCLE",
      metaDescription:
        "Regular networking events and the vision of extraordinary international experiences – personal, curated, special.",
      regularTitle: "Regular networking events",
      regularText:
        "Planned format: relaxed, curated evenings where members genuinely get to know each other – in changing cities.",
      regularPoints: [
        "Curated guest lists from the community",
        "Changing cities & venues",
        "Short thematic impulses instead of forced small talk",
      ],
      visionTitle: "The vision: extraordinary experiences",
      visionText:
        "Over time, international experiences beyond the everyday will emerge – small circles, special places, unforgettable moments.",
      visionPoints: [
        "International destinations",
        "Multi-day formats in small circles",
        "Members & invited guests only",
      ],
      upcomingTitle: "Upcoming dates",
      upcomingEmpty:
        "No dates published yet. The first events will be announced here once they are confirmed.",
      visionDisclaimer:
        "Note: planned formats and conceptual vision – no confirmed events yet.",
      imageRegularAlt: "Rooftop networking evening with city lights",
      imageVisionAlt: "Exclusive cliffside dinner terrace by the sea",
      ctaTitle: "Be there when it starts.",
      ctaText:
        "Members get priority access to all events. Secure your place in the circle.",
    },
    membership: {
      kicker: "Membership",
      title: "One access. The entire ecosystem.",
      lead: "Deliberately exclusive, yet accessible: one uniform membership unlocks all regular features – network, deals, investments, marketplace, academy and events.",
      metaTitle: "Membership – INNER CIRCLE",
      metaDescription:
        "The INNER CIRCLE membership: €24.99 per month, cancel monthly. Annual membership with a saving is planned.",
      monthlyTitle: "Monthly membership",
      monthlyBadge: "Standard",
      price: "€24.99",
      period: "/ month",
      billingNote: "Cancel monthly · Billing starts only once accounts go live",
      includedTitle: "Included in every membership",
      included: [
        "Full access to the network & member directory",
        "Business deals: discover & apply to opportunities",
        "Investment previews & expressions of interest",
        "Marketplace & Academy: learn, sell, book",
        "Regular events & community",
        "Personal reputation system & awards",
      ],
      annualTitle: "Annual membership",
      annualBadge: "Pricing to follow",
      annualText:
        "Also planned: an annual membership with a saving compared to monthly billing – for everyone staying for the long run.",
      annualNote: "The final annual price has not been set yet.",
      trialNote: "Every new account starts with a free 48-hour discovery phase.",
      payNoteTitle: "To be fully transparent:",
      payNote:
        "Payment is not active yet. Pricing and billing will be tested and enabled when the membership launches (Step 05).",
      faqTitle: "Frequently asked questions",
      ctaTitle: "Ready for the inner circle?",
      ctaText: "Create your account once registration opens – and grow with the community.",
    },
    login: {
      kicker: "Login",
      title: "Welcome back.",
      lead: "Sign in to see your network, your opportunities and your messages.",
      metaTitle: "Login – INNER CIRCLE",
      metaDescription: "Sign-in for members of the INNER CIRCLE community.",
      emailLabel: "Email address",
      passwordLabel: "Password",
      submit: "Sign in",
      forgot: "Forgot your password?",
      noAccount: "No account yet?",
      registerLink: "Register now",
      previewTitle: "Preparation – not active yet",
      previewText:
        "Accounts and sign-in are implemented in Step 04 of the roadmap. This page already shows the future design and behaviour.",
      toastInfo: "Sign-in is not available yet – it will be implemented in Step 04.",
    },
    register: {
      kicker: "Registration",
      title: "Become part of the circle.",
      lead: "Create your INNER CIRCLE account and start the discovery phase – free and without payment details.",
      metaTitle: "Registration – INNER CIRCLE",
      metaDescription:
        "Register for INNER CIRCLE: network, business opportunities, investments, marketplace and events.",
      firstNameLabel: "First name",
      lastNameLabel: "Last name",
      emailLabel: "Email address",
      passwordLabel: "Password",
      submit: "Create account",
      haveAccount: "Already a member?",
      loginLink: "Log in",
      trialNote: "Every account starts with a free 48-hour discovery phase.",
      previewTitle: "Preparation – not active yet",
      previewText:
        "Accounts and registration are implemented in Step 04 of the roadmap. This form already demonstrates the future design with all form states.",
      toastInfo: "Registration is not available yet – it will be implemented in Step 04.",
      errorRequired: "Please fill in this field.",
      errorEmail: "Please enter a valid email address.",
      errorPassword: "Please choose a password with at least 8 characters.",
      passwordHint: "At least 8 characters.",
    },
  },
  footer: {
    tagline:
      "The exclusive business community for founders, investors and creators. Build contacts, discover opportunities, gain knowledge, experience events.",
    platformTitle: "Platform",
    companyTitle: "Project",
    legalTitle: "Legal",
    contact: "Contact",
    contactNote: "(placeholder until launch)",
    copyright: "INNER CIRCLE – in the making. All rights reserved.",
    disclaimer:
      "Development preview: this website is under construction. Features that are not implemented yet are marked as “Coming soon”. All images are temporary AI-generated mood images and do not show real INNER CIRCLE events or members. No investment advice, no promises of returns. Prices may change before launch.",
    imprint: "Imprint",
    privacy: "Privacy",
    terms: "Terms",
  },
  legal: {
    placeholderTitle: "Placeholder page",
    placeholderText:
      "This page is a placeholder. The final content will be created and legally reviewed before public release. Fictional company data or purportedly legal-reviewed texts are deliberately not shown here.",
    backLink: "Back to home",
    imprint: {
      title: "Imprint",
      metaTitle: "Imprint – INNER CIRCLE",
      metaDescription: "Imprint of the INNER CIRCLE website (placeholder).",
    },
    privacy: {
      title: "Privacy",
      metaTitle: "Privacy – INNER CIRCLE",
      metaDescription: "Privacy notes of the INNER CIRCLE website (placeholder).",
    },
    terms: {
      title: "Terms",
      metaTitle: "Terms – INNER CIRCLE",
      metaDescription: "Terms and conditions of INNER CIRCLE (placeholder).",
    },
  },
  design: {
    kicker: "Internal",
    title: "INNER CIRCLE Design System",
    lead: "The shared visual foundation for the public website and the future member area – consistent in light and dark mode, responsive and accessible.",
    metaTitle: "Design System – INNER CIRCLE",
    metaDescription:
      "Internal overview of the INNER CIRCLE design system: tokens, typography and components.",
    colorsTitle: "Colors",
    colorsLead:
      "Brand: Midnight Navy & Off White. Interactions: Electric Blue. Exclusivity: Champagne (subtle).",
    colorNeutral: "Neutral surfaces",
    colorElectric: "Functional accent",
    colorChampagne: "Exclusive accent",
    typographyTitle: "Typography",
    typographyLead:
      "Inter (next/font, self-hosted). Consistent scale; large headlines carry the core message.",
    displaySample: "Display · For the biggest statements",
    h1Sample: "Heading H1",
    h2Sample: "Heading H2",
    h3Sample: "Heading H3",
    bodySample: "Body text – for descriptions and paragraphs with comfortable line height.",
    captionSample: "Caption · For notes and image credits",
    buttonsTitle: "Buttons",
    buttonsLead: "Primary (electric), secondary (outline), ghost, exclusive (champagne).",
    buttonPrimary: "Primary",
    buttonSecondary: "Secondary",
    buttonGhost: "Ghost",
    buttonExclusive: "Exclusive",
    buttonDisabled: "Disabled",
    badgesTitle: "Badges",
    badgesLead: "For status, hints and awards.",
    badgeNeutral: "Neutral",
    badgeElectric: "Electric",
    badgeChampagne: "Champagne",
    badgeSuccess: "Success",
    badgeDanger: "Danger",
    inputsTitle: "Inputs",
    inputsLead: "With label, hint, error and disabled state.",
    inputLabelDefault: "Email address",
    inputPlaceholder: "name@example.com",
    inputHint: "We only use your address for account & important updates.",
    inputLabelError: "Company",
    inputError: "Please fill in this field.",
    inputLabelDisabled: "Customer number (later)",
    inputDisabledHint: "Available from Step 04.",
    textareaLabel: "Message",
    textareaPlaceholder: "What is it about?",
    cardsTitle: "Cards",
    cardsLead: "Calm surfaces with subtle borders; interactive cards lift on hover.",
    cardTitle: "Standard card",
    cardText: "A calm card for content – with consistent border and radius.",
    cardInteractiveTitle: "Interactive card",
    cardInteractiveText: "Lifts on hover – for selectable content.",
    dialogsTitle: "Dialog",
    dialogsLead: "Modal dialog with focus trap, escape and backdrop closing.",
    dialogOpenButton: "Open dialog",
    dialogTitle: "Example dialog",
    dialogBody:
      "Dialogs are used for confirmations and short forms in the member area.",
    dialogCancel: "Close",
    dialogConfirm: "Got it",
    dropdownTitle: "Dropdown",
    dropdownLead: "For language and theme selection as well as context menus.",
    dropdownTrigger: "Choose option",
    dropdownItems: ["First option", "Second option", "Third option"],
    tabsTitle: "Tabs",
    tabsLead: "Switch between related views without a page change.",
    tabOne: "Overview",
    tabTwo: "Details",
    tabThree: "Activity",
    tabOnePanel: "Content of the “Overview” tab – placeholder text.",
    tabTwoPanel: "Content of the “Details” tab – placeholder text.",
    tabThreePanel: "Content of the “Activity” tab – placeholder text.",
    toastsTitle: "Notifications",
    toastsLead: "Short feedback at the bottom right, auto-dismissing.",
    toastInfoBtn: "Info toast",
    toastSuccessBtn: "Success toast",
    toastErrorBtn: "Error toast",
    toastInfoText: "This is a neutral piece of information.",
    toastSuccessText: "Action completed successfully (demo).",
    toastErrorText: "Something went wrong (demo).",
    progressTitle: "Progress indicators",
    progressLead: "Progress and status, e.g. for profile completeness.",
    progressLabel: "Profile completeness",
    ratingTitle: "Star rating",
    ratingLead: "Fixed 1–5 scale, only for verified collaborations.",
    avatarsTitle: "Avatars",
    avatarsLead: "Initial avatars as the temporary representation.",
    motionTitle: "Motion",
    motionLead:
      "Subtle transitions, scroll reveals and hover effects – respects prefers-reduced-motion.",
    formStatesTitle: "Form states",
    formStatesLead: "Default, focus, error, success, disabled – consistent across all forms.",
    a11yTitle: "Accessibility",
    a11yItems: [
      "Visible focus rings for keyboard use",
      "ARIA attributes for tabs, dialogs, dropdowns & badges",
      "Contrasts checked in both modes",
      "Reduced motion is respected",
      "Skip link to the main content",
    ],
  },
};

const de = { ...siteDe, ...publicV2De, app: appDe };

/** Fully merged dictionary type (public site + Sprint 2.0 namespaces). */
export type Dictionary = typeof de;

const en: Dictionary = { ...siteEnRaw, ...publicV2En, app: appEn };

export const dictionaries: Record<Locale, Dictionary> = { de, en };
