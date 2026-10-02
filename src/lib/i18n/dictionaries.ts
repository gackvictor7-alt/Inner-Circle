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
 *     app.beta, app.betaAdmin    (private beta, Sprint 12: dict/app-beta.ts)
 *     app.deals                  (deal fee, investment pool, deal records)
 */

import { appCoreDe, appCoreEn } from "./dict/app-core";
import { appSocialDe, appSocialEn } from "./dict/app-social";
import { appBusinessDe, appBusinessEn } from "./dict/app-business";
import { siteV2De, siteV2En } from "./dict/site-v2";
import { appBetaDe, appBetaEn } from "./dict/app-beta";
import { appDealsDe, appDealsEn } from "./dict/app-deals";
import { appReputationDe, appReputationEn } from "./dict/app-reputation";

const appDe = { ...appCoreDe, ...appSocialDe, ...appBusinessDe, ...appBetaDe, ...appReputationDe, deals: appDealsDe };
const appEn = { ...appCoreEn, ...appSocialEn, ...appBusinessEn, ...appBetaEn, ...appReputationEn, deals: appDealsEn };

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
    join: "Jetzt Mitglied werden",
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
    availableNow: "Verfügbar",
    availableNote: "Der Zugriff hängt von deinem Konto-Status ab – Details findest du unter Mitgliedschaft.",
    noteLabel: "Hinweis",
    previewLabel: "Vorschau",
    learnMore: "Mehr erfahren",
    discover: "Entdecken",
    explore: " Erkunden",
    getStarted: "Jetzt starten",
    skipToContent: "Direkt zum Inhalt springen",
    imageNote: "Stimmungsbild · vorläufiger Platzhalter",
    exampleLabel: "Beispieldarstellung",
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
          "Abschlüsse beidseitig bestätigt",
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
        a: "Jederzeit: Konto erstellen, E-Mail bestätigen, Interessen wählen – die 48-stündige Discovery-Phase startet sofort. Die Mitgliedschaft schaltet danach alle Bereiche frei.",
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
      imageAlt: "Zwei junge Business-Personen schauen gemeinsam auf ein Tablet in einem hellen Büro mit Glasfassade",
      featuresKicker: "Im Überblick",
      howItWorksLink: "Wie Netzwerk, Kontakte und Vertrauen hier funktionieren",
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
          desc: "Direkter 1:1-Chat nach bestätigter Verbindung – mit Verlauf und Ungelesen-Zähler.",
        },
        {
          title: "Reputation sichtbar",
          desc: "Sternebewertungen und Auszeichnungen aus bestätigten Zusammenarbeiten – auf jedem Profil.",
        },
      ],
      availableTitle: "Das Netzwerk heute",
      availableItems: [
        "Mitgliederverzeichnis mit Suche und Filtern",
        "Discover mit passenden Vorschlägen und Match-Gründen",
        "Folgen oder Kontakt anfragen – mit persönlicher Nachricht",
        "1:1-Nachrichten nach bestätigter Verbindung",
        "Benachrichtigungen zu Anfragen und Nachrichten",
        "Mitglieder blockieren, wenn ein Kontakt nicht passt",
      ],
      ctaTitle: "Bereit für deinen inneren Kreis?",
      ctaText:
        "Konto erstellen, verifizieren und das Netzwerk 48 Stunden lang entdecken – die Mitgliedschaft schaltet danach den vollen Zugriff frei.",
    },
    businessDeals: {
      kicker: "Business Deals",
      title: "Geschäftschancen, die wirklich passen.",
      lead: "Teile Geschäftschancen, bewirb dich gezielt auf passende Anfragen und lass abgeschlossene Zusammenarbeiten beidseitig bestätigen – transparent statt anonym.",
      metaTitle: "Business Deals – INNER CIRCLE",
      metaDescription:
        "Entdecke Geschäftsmöglichkeiten im INNER CIRCLE: Co-Founder, Partnerschaften, Joint Ventures und Aufträge mit klarem Bewerbungsprozess.",
      imageAlt: "Zwei junge Projektentwickler besprechen Baupläne auf einer modernen Beton-Baustelle",
      formatsTitle: "Chancen-Typen",
      formatsLead: "Diese Typen kannst du als Chance einstellen – unter anderem. Mitglieder bewerben sich gezielt darauf.",
      formats: [
        "Co-Founder gesucht",
        "Geschäftspartner gesucht",
        "Joint Venture",
        "Strategische Partnerschaft",
        "Kunden gesucht",
        "Freelance-Auftrag",
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
          title: "Direkt austauschen",
          desc: "Nimmst du eine Bewerbung an, entsteht eine Verbindung – ihr sprecht direkt per 1:1-Nachricht.",
        },
        {
          title: "Gemeinsam abschließen",
          desc: "Abgeschlossene Zusammenarbeit melden, beidseitig bestätigen und sich gegenseitig bewerten.",
        },
      ],
      noteTitle: "Vertrauen ist der Standard",
      note: "Jeder Deal läuft über bestätigte Profile. Der Abschluss einer Zusammenarbeit wird bestätigt und fließt in das Reputationssystem beider Seiten ein.",
      /* --- Deal fee (Sprint) --- */
      feeKicker: "Transparente Gebührenstruktur",
      feeTitle: "Je größer der Deal, desto geringer der Plattformanteil.",
      feeLead:
        "Für abgeschlossene Business Deals kann INNER CIRCLE einen prozentualen Plattformanteil verlangen. Die Rate richtet sich nach dem Volumen – und sinkt mit der Größe des Deals.",
      feeVolumeColumn: "Deal-Volumen",
      feeRateColumn: "Plattformanteil",
      feeTier1: "bis 50.000 €",
      feeTier2: "50.000 – 250.000 €",
      feeTier3: "250.000 – 1.000.000 €",
      feeTier4: "1.000.000 – 5.000.000 €",
      feeTierNegotiable: "über 5.000.000 €",
      feeNegotiable: "Individuelle Rate (1 – 1,5 %)",
      feeNegotiableNote:
        "Über 5.000.000 € wird die Rate im Einzelfall vereinbart. Wir rechnen dann bewusst keinen festen Betrag.",
      feeForVolume: "Für dein Volumen",
      feeForVolumeHint: "Gib ein Volumen ein, um die passende Stufe zu sehen.",
      feeNoVolume: "Keine Rate berechnet – ohne Volumen",
      feeCoversTitle: "Wofür der Plattformanteil steht",
      feeCovers: [
        "Zugang zum Netzwerk",
        "Deal-Infrastruktur und Anbahnung",
        "Matching der Beteiligten",
        "Reputation und dokumentierte Zusammenarbeit",
        "Verifizierung der Mitglieder",
        "Kommunikation und Abstimmung",
        "Dokumentation der Zusammenarbeit",
        "Unterstützung beim Zustandekommen",
      ],
      feeCoversNote:
        "Leistungen, die INNER CIRCLE heute tatsächlich erbringt – keine Zusagen auf Funktionen, die es noch nicht gibt.",
      feeDueNote:
        "Der Anteil wird erst mit dem abgeschlossenen Deal fällig, nicht mit der Veröffentlichung einer Anzeige.",
      feeTermsNote:
        "Abgeschlossene Deals werden beidseitig bestätigt und fließen dadurch in die Reputation beider Parteien ein.",
      availableTitle: "Business Deals heute",
      availableItems: [
        "Chancen mit Typ, Branche, Ort und Voraussetzungen einstellen",
        "Chancen durchsuchen und nach Typ filtern",
        "Mit Begründung bewerben – Annahme oder Ablehnung durch den Anbieter",
        "Bei Annahme entsteht eine Verbindung für den direkten Austausch",
        "Abgeschlossene Deals melden und beidseitig bestätigen",
        "Bewertungen nach bestätigter Zusammenarbeit",
      ],
      ctaTitle: "Deine erste Chance wartet nicht.",
      ctaText:
        "Konto erstellen und Chancen im Mitgliederbereich entdecken – der Zugriff hängt von deinem Konto-Status ab.",
    },
    /* Investments (Sprint: Informationsarchitektur) – die Seite trennt zwei
       grundverschiedene Dinge: Opportunities FÜR Mitglieder und das eigene
       INNER CIRCLE Portfolio. Kurz, editorial, ohne Doppelungen. */
    investments: {
      kicker: "Investments",
      title: "Investments. Für Mitglieder und durch INNER CIRCLE.",
      lead: "INNER CIRCLE verbindet Mitglieder mit ausgewählten Investment Opportunities und baut gleichzeitig langfristig ein eigenes Investment-Portfolio auf.",
      metaTitle: "Investments – INNER CIRCLE",
      metaDescription:
        "Investments für Mitglieder und das INNER CIRCLE Portfolio: geprüfte Opportunities aus dem Netzwerk und eine geplante strategische Zielallokation.",
      ctaOpportunities: "Investment Opportunities",
      ctaPortfolio: "INNER CIRCLE Portfolio",
      /* --- Abschnitt 2: zwei Wege --- */
      pathsKicker: "Zwei Wege",
      pathsTitle: "Zwei unterschiedliche Dinge. Klar getrennt.",
      memberLabel: "Hier investierst du",
      memberTitle: "Für Mitglieder",
      memberText: "Zugang zu ausgewählten Investment Opportunities aus dem Netzwerk.",
      memberPoints: [
        "Start-ups & Unternehmen",
        "Beteiligungen",
        "Immobilienprojekte",
        "Ausgewählte Opportunities",
      ],
      memberCta: "Opportunities entdecken",
      icLabel: "Hier investiert INNER CIRCLE",
      icTitle: "INNER CIRCLE Portfolio",
      icText:
        "Ein Teil der eigenen Plattform-Einnahmen soll langfristig in Unternehmen und Projekte investiert werden.",
      icBudgetNote:
        "20 % der Plattform-Einnahmen sind als Investmentbudget vorgesehen – davon 25 % in das Netzwerk und 75 % extern (entspricht bezogen auf 100 % Plattform-Einnahmen 5 % und 15 %).",
      icCta: "Portfolio ansehen",
      disclaimer:
        "INNER CIRCLE ist keine Anlageberatung und keine Vermittlung nach §§ 15, 34f GewO (DE). Es werden keine Renditeversprechen gemacht. Investitionen sind mit Risiken verbunden. Rechtlicher Rahmen und Prüfprozesse werden vor dem Launch final umgesetzt.",
      /* --- Abschnitt 3: Investment Pool kompakt visualisiert --- */
      poolKicker: "Investment Pool",
      poolTitle: "Strategische Zielallokation",
      poolPlannedBadge: "Geplante Struktur",
      poolLead:
        "Bezogen auf 100 % der Plattform-Einnahmen: 5 % sollen langfristig in INNER-CIRCLE-Unternehmen und Projekte fließen, 15 % in externe Investments. Die übrigen Einnahmen sind nicht Teil des Investmentbudgets.",
      poolNetwork: "INNER-CIRCLE-Unternehmen & Projekte",
      poolExternal: "Externe Investments",
      poolRest: "Nicht Teil des Investmentbudgets",
      poolNote:
        "Ein geplantes strategisches Modell – kein bestehender Fonds. Es werden keine Renditen versprochen und keine investierten Beträge dargestellt.",
      poolDetailCta: "Modell im Detail ansehen",
      /* --- Abschnitt 4: geplantes Impact-Modell --- */
      impactKicker: "Unser langfristiges Commitment",
      impactPlannedBadge: "Geplante Impact-Struktur",
      impactTitle: "Gemeinnützig mitdenken.",
      impactLead:
        "Geplant ist, 5 % des Unternehmensgewinns für eine eigene gemeinnützige Struktur und ausgewählte soziale Projekte bereitzustellen. Ziel ist es, konkrete Projekte rund um Ernährung, Trinkwasser und Bildung zu unterstützen.",
      impactAreasTitle: "Vorgesehene Bereiche",
      impactAreas: [
        "Ernährung für Kinder",
        "Sauberes Trinkwasser",
        "Unterstützung von Kindern",
        "Weitere überprüfbare gemeinnützige Projekte",
      ],
      impactStatusTitle: "Ehrlich gesagt",
      impactStatus:
        "Eine eigene Stiftung oder eine geeignete gemeinnützige Struktur ist noch nicht gegründet und rechtlich nicht geprüft. Solange das nicht der Fall ist, behaupten wir nicht, dass bereits gespendet wird.",
      ctaTitle: "Auf der Watchlist bleiben.",
      ctaText:
        "Registriere dich vorab – du erfährst, sobald die ersten geprüften Chancen live gehen.",
    },
    marketplace: {
      kicker: "Marketplace & Academy",
      title: "Wissen lernen. Wissen anbieten. Leistungen entdecken.",
      lead: "Der Marktplatz von INNER CIRCLE verbindet Angebote der Community: Kurse und Workshops in der Academy, Coaching, Beratung und professionelle Dienstleistungen im Marketplace.",
      metaTitle: "Marketplace & Academy – INNER CIRCLE",
      metaDescription:
        "Lerne neue Fähigkeiten, verkaufe dein Wissen und entdecke professionelle Dienstleistungen der INNER-CIRCLE-Community.",
      imageAlt: "Zwei junge Kolleg:innen besprechen Produktverpackungen und Layouts an einem Studio-Tisch",
      tabMarketplace: "Marketplace",
      tabAcademy: "Academy",
      marketplaceTab: {
        headline: "Professionelle Leistungen aus der Community",
        text: "Entdecke Angebote von Mitgliedern – oder veröffentliche deine eigenen Leistungen.",
        features: [
          {
            title: "Angebote entdecken",
            desc: "Coaching, Beratung, Workshops und Dienstleistungen – von Mitgliedern für Mitglieder, filterbar nach Kategorie.",
          },
          {
            title: "Anbieter kennenlernen",
            desc: "Zu jedem Angebot gibt es das Anbieterprofil und weitere Angebote derselben Person.",
          },
          {
            title: "Selbst anbieten",
            desc: "Veröffentliche eigene Angebote mit Beschreibung und Preis – sichtbar für die Community.",
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
            title: "Wissen anbieten",
            desc: "Veröffentliche dein eigenes Wissen als Kurs oder Workshop für die Community.",
          },
          {
            title: "Lernfortschritt",
            desc: "Module und Lektionen mit Fortschrittsanzeige – du siehst, wo du stehst.",
          },
        ],
      },
      creatorNote:
        "Zahlungsabwicklung und Auszahlungen sind noch nicht aktiv – Käufe und Buchungen laufen noch nicht über die Plattform.",
      availableTitle: "Marketplace & Academy heute",
      availableItems: [
        "Angebote von Mitgliedern durchsuchen und nach Kategorie filtern",
        "Eigene Angebote veröffentlichen – Kurs, Coaching, Workshop, Beratung oder Dienstleistung",
        "Anbieterprofil und weitere Angebote je Anbieter",
        "Academy: Kursbibliothek mit Modulen, Lektionen und Lernfortschritt",
      ],
      ctaTitle: "Teaching & Selling für Mitglieder.",
      ctaText:
        "Entdecke Angebote der Community, teile dein Wissen und baue Reputation im Kreis auf.",
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
      upcomingTitle: "Termine & Teilnahme",
      upcomingEmpty:
        "Events werden von INNER CIRCLE kuratiert und im Mitgliederbereich unter „Events“ veröffentlicht. Dort kannst du als Mitglied die Teilnahme anfragen. Diese öffentliche Seite zeigt keine Termine.",
      upcomingPill: "Im Mitgliederbereich",
      visionDisclaimer:
        "Hinweis: Die beschriebenen Formate und Erlebnisse sind geplant und konzeptionell.",
      imageRegularAlt: "Networking-Abend auf einer Dachterrasse mit Stadtlichtern",
      imageVisionAlt: "Gruppe von Unternehmern auf einer Yacht an der Côte d'Azur vor Monaco",
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
        "Die INNER-CIRCLE-Mitgliedschaft: 24,99 € pro Monat oder 249,99 € pro Jahr – eine Mitgliedschaft, beide Abrechnungszeiträume.",
      monthlyTitle: "Monatsmitgliedschaft",
      monthlyBadge: "Standard",
      price: "24,99 €",
      period: "/ Monat",
      billingNote: "Monatlich kündbar · Zahlung startet erst mit Kontoführung",
      annualPrice: "249,99 €",
      annualPeriod: "/ Jahr",
      annualEquivalent: "entspricht 20,83 € pro Monat",
      pricePeriodTitle: "Abrechnungszeitraum",
      pricePeriodHint: "Eine Mitgliedschaft, zwei Zeiträume – umschaltbar bei der Buchung in der App.",
      selectCta: "Auswählen und registrieren",
      selectedNote: "Wir starten mit 48 Stunden Discovery – Zahlungsdaten erst danach.",
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
      annualBadge: "Preisvorteil",
      annualText:
        "Gleiche Mitgliedschaft, ein Zahlungstermin: 249,99 € pro Jahr statt 24,99 € pro Monat – gespart wird gegenüber zwölf Monatszahlungen.",
      annualNote: "Kündbar zum Periodenende. Der Preisvorteil ist fest eingeplant, keine Aktion.",
      trialNote: "Jedes neue Konto beginnt mit einer kostenlosen 48-Stunden-Entdeckungsphase.",
      payNoteTitle: "Ehrlich gesagt:",
      payNote:
        "Die Zahlungsfunktion ist noch nicht aktiv. Preise und Abrechnung werden mit der Freischaltung des Zahlungsanbieters getestet und aktiviert – bis dahin entstehen keine Kosten.",
      faqTitle: "Häufige Fragen",
      ctaTitle: "Bereit für den inneren Kreis?",
      ctaText: "Erstelle dein Konto, starte 48 Stunden Discovery – und wachse mit der Community.",
    },
    howItWorks: {
      kicker: "Wie es funktioniert",
      title: "Für Menschen, die etwas aufbauen – und wissen wollen, mit wem sie es tun.",
      lead:
        "Hier erfährst du, wie INNER CIRCLE funktioniert, wie relevante Verbindungen entstehen und wie Reputation durch echte Zusammenarbeit sichtbar wird.",
      metaTitle: "Wie INNER CIRCLE funktioniert – INNER CIRCLE",
      metaDescription:
        "Hier erfährst du, wie INNER CIRCLE funktioniert, wie relevante Verbindungen entstehen und wie Reputation durch echte Zusammenarbeit sichtbar wird.",
      audienceLead: "Offen für alle, die etwas aufbauen. Status und Reputation entstehen durch echte Arbeit.",
      flowLead:
        "Vier Schritte, keine Abkürzung nach oben: Profil, relevante Menschen, echte Gespräche, daraus entstehende Zusammenarbeit.",
      trustLead:
        "Verifizierung, Trust Score und Bewertungen nach realen Outcomes. Follower und Profilbilder zählen nicht.",
      portfolioTitle: "Und was passiert mit den Einnahmen?",
      portfolioText:
        "20 % der Plattform-Einnahmen sind als Investmentbudget geplant: 25 % in Unternehmen und Projekte aus dem Netzwerk, 75 % extern – bezogen auf 100 % sind das 5 % und 15 %.",
      joinCta: "Konto erstellen",
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
    copyright: "INNER CIRCLE. Alle Rechte vorbehalten.",
    disclaimer:
      "Ein Teil der Marketingbilder besteht aus illustrativen, teilweise KI-generierten Visualisierungen – sie zeigen keine echten Mitglieder, Events, Geschäftsabschlüsse oder Erfolge. Demo-Profile, Demo-Events und Beispielinhalte in der Plattform sind dort, wo Verwechslungsgefahr besteht, eindeutig als „Demo“ bzw. „Beispiel“ markiert. Keine Anlageberatung, keine Erfolgsversprechen.",
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
    join: "Become a member now",
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
    availableNow: "Available",
    availableNote: "Access depends on your account status – see Membership for details.",
    noteLabel: "Note",
    previewLabel: "Preview",
    learnMore: "Learn more",
    discover: "Discover",
    explore: "Explore",
    getStarted: "Get started",
    skipToContent: "Skip to content",
    imageNote: "Mood image · temporary placeholder",
    exampleLabel: "Illustrative example",
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
          "Completed deals confirmed by both sides",
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
        a: "Any time: create an account, confirm your e-mail, pick your interests – the 48-hour discovery phase starts right away. The membership then unlocks every area.",
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
    howItWorks: {
      kicker: "How it works",
      title: "For people who build – and want to know who they are building with.",
      lead:
        "Learn how INNER CIRCLE works, how relevant connections are made, and how reputation becomes visible through genuine collaboration.",
      metaTitle: "How INNER CIRCLE works – INNER CIRCLE",
      metaDescription:
        "Learn how INNER CIRCLE works, how relevant connections are made, and how reputation becomes visible through genuine collaboration.",
      audienceLead: "Open to anyone who builds. Status and reputation are earned through real work.",
      flowLead:
        "Four steps, no shortcut to the top: a profile, relevant people, real conversations, collaboration that grows from them.",
      trustLead:
        "Verification, trust score and reviews after real outcomes. Followers and profile pictures do not count.",
      portfolioTitle: "And what happens to the revenue?",
      portfolioText:
        "20% of platform revenue is planned as the investment budget: 25% into companies and projects from the network, 75% external – relative to 100% that is 5% and 15%.",
      joinCta: "Create an account",
    },
    network: {
      kicker: "Network",
      title: "People who genuinely move your business forward.",
      lead: "The heart of INNER CIRCLE: a curated network of founders, investors and creators. Discover relevant profiles, connect with intent and build relationships that last.",
      metaTitle: "Network – INNER CIRCLE",
      metaDescription:
        "Meet founders, business partners and people with similar ambitions in the INNER CIRCLE network.",
      imageAlt: "Two young business people reviewing numbers on a tablet in a bright glass-fronted office",
      featuresKicker: "At a glance",
      howItWorksLink: "How network, contacts and trust work here",
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
          desc: "Direct 1:1 chat after a confirmed connection – with history and an unread counter.",
        },
        {
          title: "Visible reputation",
          desc: "Star ratings and awards from verified collaborations – on every profile.",
        },
      ],
      availableTitle: "The network today",
      availableItems: [
        "Member directory with search and filters",
        "Discover with relevant suggestions and match reasons",
        "Follow or request a connection – with a personal note",
        "1:1 messages after a confirmed connection",
        "Notifications for requests and messages",
        "Block members when a contact is not a fit",
      ],
      ctaTitle: "Ready for your inner circle?",
      ctaText:
        "Create an account, verify it and explore the network for 48 hours – the membership then unlocks full access.",
    },
    businessDeals: {
      kicker: "Business Deals",
      title: "Business opportunities that truly fit.",
      lead: "Share business opportunities, apply with intent to fitting requests and have completed collaborations confirmed by both sides – transparent instead of anonymous.",
      metaTitle: "Business Deals – INNER CIRCLE",
      metaDescription:
        "Discover business opportunities inside INNER CIRCLE: co-founders, partnerships, joint ventures and projects with a clear application process.",
      imageAlt: "Two young project developers reviewing floor plans on a modern concrete construction site",
      formatsTitle: "Opportunity types",
      formatsLead: "These are some of the types you can post as an opportunity. Members apply to them with intent.",
      formats: [
        "Co-founder wanted",
        "Business partner wanted",
        "Joint venture",
        "Strategic partnership",
        "Customers wanted",
        "Freelance assignment",
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
          title: "Talk directly",
          desc: "When you accept an application, a connection is created – you talk directly by 1:1 message.",
        },
        {
          title: "Close together",
          desc: "Report the completed collaboration, confirm it on both sides and rate each other.",
        },
      ],
      noteTitle: "Trust is the standard",
      note: "Every deal runs on verified profiles. The completion of a collaboration gets confirmed and feeds the reputation system of both sides.",
      /* --- Deal fee (Sprint) --- */
      feeKicker: "Transparent fee structure",
      feeTitle: "The bigger the deal, the lower the platform share.",
      feeLead:
        "For completed business deals INNER CIRCLE may charge a percentage platform share. The rate follows the volume – and decreases as the deal grows.",
      feeVolumeColumn: "Deal volume",
      feeRateColumn: "Platform share",
      feeTier1: "up to €50,000",
      feeTier2: "€50,000 – €250,000",
      feeTier3: "€250,000 – €1,000,000",
      feeTier4: "€1,000,000 – €5,000,000",
      feeTierNegotiable: "over €5,000,000",
      feeNegotiable: "Individual rate (1 – 1.5%)",
      feeNegotiableNote:
        "Above €5,000,000 the rate is agreed case by case. We deliberately do not calculate a fixed amount there.",
      feeForVolume: "For your volume",
      feeForVolumeHint: "Enter a volume to see the matching tier.",
      feeNoVolume: "No rate calculated – without a volume",
      feeCoversTitle: "What the platform share stands for",
      feeCovers: [
        "Access to the network",
        "Deal infrastructure and origination",
        "Matching of the parties involved",
        "Reputation and documented collaboration",
        "Verification of the members",
        "Communication and coordination",
        "Documentation of the collaboration",
        "Support in closing the deal",
      ],
      feeCoversNote:
        "Services INNER CIRCLE actually provides today – no promises about features that do not exist yet.",
      feeDueNote:
        "The share becomes due with the completed deal, not with the publication of a listing.",
      feeTermsNote:
        "Completed deals are confirmed by both sides and thereby count towards the reputation of both parties.",
      availableTitle: "Business Deals today",
      availableItems: [
        "Post opportunities with type, industry, location and requirements",
        "Browse opportunities and filter by type",
        "Apply with a reason – the provider accepts or declines",
        "Accepting creates a connection for direct exchange",
        "Report completed deals and confirm them on both sides",
        "Ratings after a confirmed collaboration",
      ],
      ctaTitle: "Your next opportunity won't wait.",
      ctaText:
        "Create an account and discover opportunities in the member area – access depends on your account status.",
    },
    investments: {
      kicker: "Investments",
      title: "Investments. For members, and by INNER CIRCLE.",
      lead: "INNER CIRCLE connects members with selected investment opportunities while building its own long-term investment portfolio.",
      metaTitle: "Investments – INNER CIRCLE",
      metaDescription:
        "Investments for members and the INNER CIRCLE Portfolio: reviewed opportunities from the network and a planned strategic target allocation.",
      ctaOpportunities: "Investment opportunities",
      ctaPortfolio: "INNER CIRCLE Portfolio",
      /* --- Section 2: two paths --- */
      pathsKicker: "Two paths",
      pathsTitle: "Two different things. Clearly separated.",
      memberLabel: "This is where YOU invest",
      memberTitle: "For members",
      memberText: "Access to selected investment opportunities from the network.",
      memberPoints: [
        "Start-ups & companies",
        "Equity participations",
        "Real-estate projects",
        "Selected opportunities",
      ],
      memberCta: "Discover opportunities",
      icLabel: "This is where INNER CIRCLE invests",
      icTitle: "INNER CIRCLE Portfolio",
      icText:
        "Part of INNER CIRCLE's own platform revenue is intended to be invested in companies and projects over the long term.",
      icBudgetNote:
        "20 % of platform revenue is planned as the investment budget – 25 % of it into the network and 75 % external (corresponding to 5 % and 15 % relative to 100 % platform revenue).",
      icCta: "View the portfolio",
      disclaimer:
        "INNER CIRCLE does not provide investment advice or brokerage services. No returns are promised. All investments carry risk. The legal framework and review processes will be finalized before launch.",
      /* --- Section 3: the investment pool, visualised compactly --- */
      poolKicker: "Investment pool",
      poolTitle: "Strategic target allocation",
      poolPlannedBadge: "Planned structure",
      poolLead:
        "In relation to 100% of platform revenue: 5% is intended to flow into INNER CIRCLE companies and projects in the long run, 15% into external investments. The remaining revenue is not part of the investment budget.",
      poolNetwork: "INNER CIRCLE companies & projects",
      poolExternal: "External investments",
      poolRest: "Not part of the investment budget",
      poolNote:
        "A planned strategic model – not an existing fund. No returns are promised and no invested amounts are shown.",
      poolDetailCta: "See the model in detail",
      /* --- Section 4: the planned impact model --- */
      impactKicker: "Our long-term commitment",
      impactPlannedBadge: "Planned impact model",
      impactTitle: "Thinking beyond profit.",
      impactLead:
        "It is planned to allocate 5% of company profits to our own charitable structure and selected social projects. The aim is to support concrete projects around nutrition, clean water and education.",
      impactAreasTitle: "Intended areas",
      impactAreas: [
        "Nutrition for children",
        "Clean drinking water",
        "Support for children",
        "Further verifiable charitable projects",
      ],
      impactStatusTitle: "To be transparent",
      impactStatus:
        "A foundation of our own or a suitable charitable structure has not yet been founded and has not been legally reviewed. As long as that is not the case, we do not claim that anything is already being donated.",
      ctaTitle: "Stay on the watchlist.",
      ctaText:
        "Register in advance – you will hear as soon as the first reviewed opportunities go live.",
    },
    marketplace: {
      kicker: "Marketplace & Academy",
      title: "Learn knowledge. Offer knowledge. Discover services.",
      lead: "The INNER CIRCLE marketplace brings the community's offerings together: courses and workshops in the Academy, coaching, consulting and professional services in the Marketplace.",
      metaTitle: "Marketplace & Academy – INNER CIRCLE",
      metaDescription:
        "Learn new skills, sell your knowledge and discover professional services from the INNER CIRCLE community.",
      imageAlt: "Two young colleagues discussing packaging prototypes and layouts at a studio table",
      tabMarketplace: "Marketplace",
      tabAcademy: "Academy",
      marketplaceTab: {
        headline: "Professional services from the community",
        text: "Discover offers from members – or publish your own services.",
        features: [
          {
            title: "Discover offers",
            desc: "Coaching, consulting, workshops and services – members for members, filterable by category.",
          },
          {
            title: "Get to know providers",
            desc: "Every offer links to the provider profile and to more offers by the same person.",
          },
          {
            title: "Offer your own",
            desc: "Publish your own offers with a description and price – visible to the community.",
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
            title: "Offer your knowledge",
            desc: "Publish your own knowledge as a course or workshop for the community.",
          },
          {
            title: "Learning progress",
            desc: "Modules and lessons with a progress indicator – you always see where you stand.",
          },
        ],
      },
      creatorNote:
        "Payment processing and payouts are not active yet – purchases and bookings do not run through the platform yet.",
      availableTitle: "Marketplace & Academy today",
      availableItems: [
        "Browse member offers and filter by category",
        "Publish your own offers – course, coaching, workshop, consulting or service",
        "Provider profile and more offers per provider",
        "Academy: course library with modules, lessons and learning progress",
      ],
      ctaTitle: "Teaching & selling for members.",
      ctaText:
        "Discover offers from the community, share your knowledge and build reputation inside the circle.",
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
      upcomingTitle: "Dates & participation",
      upcomingEmpty:
        "Events are curated by INNER CIRCLE and published in the member area under “Events”. Members can request to take part there. This public page does not list dates.",
      upcomingPill: "In the member area",
      visionDisclaimer:
        "Note: the formats and experiences described above are planned and conceptual.",
      imageRegularAlt: "Rooftop networking evening with city lights",
      imageVisionAlt: "Group of entrepreneurs on a yacht on the Côte d'Azur off Monaco",
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
        "The INNER CIRCLE membership: €24.99 per month or €249.99 per year – one membership, both billing periods.",
      monthlyTitle: "Monthly membership",
      monthlyBadge: "Standard",
      price: "€24.99",
      period: "/ month",
      billingNote: "Cancel monthly · Billing starts only once accounts go live",
      annualPrice: "€249.99",
      annualPeriod: "/ year",
      annualEquivalent: "equivalent to €20.83 per month",
      pricePeriodTitle: "Billing period",
      pricePeriodHint: "One membership, two periods – switchable when you book in the app.",
      selectCta: "Select and register",
      selectedNote: "You start with 48 hours of discovery – payment details only after that.",
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
      annualBadge: "Better value",
      annualText:
        "Same membership, one payment date: €249.99 per year instead of €24.99 per month – the saving is against twelve monthly payments.",
      annualNote: "Cancellable at the end of the period. The advantage is a fixed price, not a campaign.",
      trialNote: "Every new account starts with a free 48-hour discovery phase.",
      payNoteTitle: "To be fully transparent:",
      payNote:
        "Payment is not active yet. Pricing and billing will be tested and enabled once the payment provider is switched on – no charges until then.",
      faqTitle: "Frequently asked questions",
      ctaTitle: "Ready for the inner circle?",
      ctaText: "Create your account, start 48 hours of discovery – and grow with the community.",
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
    copyright: "INNER CIRCLE. All rights reserved.",
    disclaimer:
      "Some marketing images are illustrative, partly AI-generated visualisations – they do not show real members, events, business transactions or achievements. Demo profiles, demo events and sample content inside the platform are clearly labelled “Demo” or “Example” wherever confusion is possible. No investment advice, no promises of success.",
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
