/**
 * Platform dictionary – deals namespace (Sprint: deal fee, investment pool,
 * off-platform deal declaration).
 *
 * Split out of `app-business.ts` because it is a self-contained feature area
 * and grew large. It is merged into `app.*` by `dictionaries.ts` exactly like
 * the other dict files, so nothing about the lookup path changes.
 *
 * Wording rules that apply to every string in here:
 *   * The investment pool is described as a **planned model**, never as money
 *     that exists. No amounts, no AUM, no dates, no member counts.
 *   * The deal fee is described as a **scale that applies to a closed deal**,
 *     never as a guarantee, an invoice or a payment.
 *   * Above 5 M the rate is described as individually negotiable – never as a
 *     fixed 1 % or 1,5 %.
 *   * No penalty, no damages, no invented legal consequence. A declined
 *     confirmation is simply "not counted".
 */

export const appDealsDe = {
  /* ------------------------------------------------------ investment pool */
  pool: {
    kicker: "INNER CIRCLE Investment Pool",
    title: "So arbeitet der geplante Investment Pool",
    lead:
      "Ein Teil der Einnahmen, die INNER CIRCLE im Netzwerk erwirtschaftet, ist langfristig für eigene Investments vorgesehen. Das Modell ist eine geplante Struktur – es gibt noch keine investierten Mittel.",
    plannedBadge: "Geplantes Modell",
    modelTitle: "Vom Netzwerk zum eigenen Portfolio",
    stepNetwork: "Netzwerk",
    stepNetworkText: "Mitglieder finden zusammen, was vorher nicht zueinander gefunden hat.",
    stepDeals: "Deals",
    stepDealsText: "Aus diesen Verbindungen entstehen konkrete Geschäftschancen.",
    stepRevenue: "Einnahmen",
    stepRevenueText: "Plattform-Einnahmen aus Mitgliedschaft und Marketplace.",
    stepPool: "Investment Pool",
    stepPoolText: "Ein festgelegter Anteil wird für eigene Investments reserviert.",
    stepPortfolio: "Portfolio & Projekte",
    stepPortfolioText: "Kapital, Kontakte und operative Unterstützung für ausgewählte Projekte.",
    categoriesTitle: "Geplante Allokation",
    categoriesLead:
      "Die folgenden Kategorien beschreiben, wohin ein Investment Pool langfristig fließen könnte. Sie sind eine Struktur, keine Bestandsauflistung.",
    categories: {
      startups: "Start-ups",
      stakes: "Beteiligungen",
      realEstate: "Immobilienprojekte",
      community: "Community-Unternehmen",
      strategic: "Strategische Investments",
      reserve: "Reserve / künftige Opportunities",
    },
    categoriesNote:
      "Die Anteile sind Richtwerte einer geplanten Struktur und werden erst mit echten Investments belastbar.",
    emptyTitle: "Noch keine investierten Mittel",
    emptyText:
      "Sobald INNER CIRCLE eigene Investments getätigt hat, werden hier nach und nach die tatsächlichen Positionen sichtbar – mit Anzahl, Status und Zeitpunkt.",
    disclaimer:
      "Kein Fonds, keine Beteiligung, kein Anspruch auf Ausschüttungen. Es werden keine Renditen versprochen und keine Investments garantiert.",
    noFakeNotice:
      "Dieser Bereich zeigt ausschließlich die geplante Struktur. Ohne echte Investments wird bewusst kein Betrag angezeigt.",
  },

  /* ------------------------------------------------------------- deal fee */
  fee: {
    title: "Plattformanteil am Deal",
    kicker: "Transparente Gebührenstruktur",
    lead:
      "Je größer der Deal, desto geringer der prozentuale Plattformanteil. Die Rate richtet sich nach dem Volumen des abgeschlossenen Deals.",
    tableTitle: "Staffel",
    volumeColumn: "Deal-Volumen",
    rateColumn: "Plattformanteil",
    tier1: "bis 50.000 €",
    tier2: "50.000 – 250.000 €",
    tier3: "250.000 – 1.000.000 €",
    tier4: "1.000.000 – 5.000.000 €",
    tierNegotiable: "über 5.000.000 €",
    negotiableRate: "Individuelle Rate (1 – 1,5 %)",
    negotiableNote:
      "Ab diesem Volumen wird die Rate im Einzelfall vereinbart. Es wird kein fester Prozentsatz und kein fixer Betrag berechnet.",
    whatItCovers: "Wofür der Plattformanteil steht",
    benefitNetwork: "Zugang zum Netzwerk",
    benefitInfrastructure: "Deal-Infrastruktur und Anbahnung",
    benefitMatching: "Matching der Beteiligten",
    benefitReputation: "Reputation und dokumentierte Zusammenarbeit",
    benefitVerification: "Verifizierung der Mitglieder",
    benefitCommunication: "Kommunikation und Abstimmung",
    benefitDocumentation: "Dokumentierte Zusammenarbeit",
    benefitSupport: "Unterstützung beim Zustandekommen",
    forYourVolume: "Für dein angegebenes Volumen",
    forYourVolumeEmpty: "Gib oben ein Volumen an, um die Rate zu sehen.",
    termsVersionLabel: "Version der Deal-Bedingungen",
    notIncludedNote:
      "Der Plattformanteil wird erst mit dem abgeschlossenen Deal fällig, nicht mit der Veröffentlichung einer Anzeige.",
  },

  /* ------------------------------------------------------------ deal terms */
  terms: {
    title: "Deal-Bedingungen",
    lead: "Kurz und verständlich, was beim Veröffentlichen gilt.",
    checkbox:
      "Ich habe die Deal-Bedingungen und die für meinen Deal geltende Plattform-Fee gelesen und akzeptiere sie.",
    detailsLink: "Details / Bedingungen",
    feeSummary: "Plattformanteil laut Staffel",
    reportSummary: "Deal nach Abschluss melden",
    offplatformSummary: "Kontakt nicht außerhalb der Plattform umgehen",
    offplatformText:
      "Werden die Deal-Bedingungen akzeptiert, wird der über INNER CIRCLE entstandene Deal nach Abschluss gemeldet und nicht ohne die vereinbarte Fee abgeschlossen.",
    required: "Bitte bestätige die Deal-Bedingungen, um zu veröffentlichen.",
    legalNote:
      "Diese technische Bestätigung dokumentiert die angezeigte Fassung. Die endgültige rechtliche Formulierung wird noch juristisch geprüft.",
    appliesTo: "Gilt für diesen Angebotstyp",
    doesNotApply: "Für diesen Angebotstyp greift keine Plattform-Fee.",
  },

  /* ------------------------------------------------------------- declaring */
  declare: {
    title: "Deal abgeschlossen",
    lead:
      "Viele Deals schließen außerhalb der Plattform. Melde hier, was über INNER CIRCLE entstanden ist – das zählt für deine Reputation und macht die Zusammenarbeit nachvollziehbar.",
    cta: "Deal melden",
    counterpartyLabel: "Gegenüber",
    counterpartyHint: "Wähle ein Mitglied, mit dem du bereits eine bestätigte Zusammenarbeit hast.",
    counterpartyEmpty: "Du hast aktuell kein Mitglied mit bestätigter Zusammenarbeit.",
    categoryLabel: "Deal-Art",
    category: {
      co_founder: "Mitgründung",
      strategic_partnership: "Strategische Partnerschaft",
      joint_venture: "Joint Venture",
      freelance: "Projektzusammenarbeit",
      customers: "Kundenabschluss",
      other: "Sonstiger Deal",
    },
    volumeLabel: "Deal-Volumen (optional)",
    volumeHint:
      "Wird nur als grobe Größenordnung gespeichert und niemals öffentlich angezeigt. Ohne Angabe bleibt der Deal trotzdem zählbar.",
    closedLabel: "Abgeschlossen",
    closedToday: "Heute",
    closedDays: "Vor {days} Tagen",
    privateNoteLabel: "Interne Notiz (optional)",
    privateNoteHint: "Nur für dich sichtbar. Wird nicht an das Gegenüber übertragen.",
    sourceLabel: "Ursprüngliche Chance (optional)",
    sourceHint: "Verknüpft den Deal mit der Chance, aus der er entstanden ist.",
    submit: "Deal melden",
    declared: "Deal gemeldet. Er zählt, sobald die Gegenseite bestätigt.",
    privacyNote:
      "Wirtschaftliche Details, Gegenüber und Notizen bleiben privat. Öffentlich sichtbar ist später nur eine aggregierte Zahl bestätigter Deals.",
  },

  /* ----------------------------------------------------------------- list */
  list: {
    title: "Deine Deals",
    lead: "Über INNER CIRCLE entstandene Geschäftschancen, die zu einem Abschluss geführt haben.",
    emptyTitle: "Noch keine gemeldeten Deals",
    emptyText: "Sobald du einen über das Netzwerk entstandenen Deal abschließt, kannst du ihn hier melden.",
    status: {
      pending_confirmation: "Wartet auf Bestätigung",
      confirmed: "Bestätigt",
      disputed: "Nicht bestätigt",
    },
    statusPendingText: "Die Gegenseite hat noch nicht bestätigt. Der Deal zählt erst nach beidseitiger Bestätigung.",
    statusConfirmedText: "Von beiden Seiten bestätigt – der Deal fließt in deine Reputation ein.",
    statusDisputedText: "Die Gegenseite hat nicht bestätigt. Der Deal wird nicht gezählt.",
    confirmCta: "Bestätigen",
    confirmedByMe: "Von dir bestätigt",
    confirmedByOther: "Vom Gegenüber bestätigt",
    waitingForOther: "Wartet auf das Gegenüber",
    disputeCta: "Nicht bestätigen",
    disputeNote: "Du kannst jederzeit ablehnen. Der Deal wird dann nicht gezählt – ohne Folgen für dich.",
    confirmed: "Deal bestätigt.",
    confirmationRecorded: "Deine Bestätigung wurde gespeichert.",
    disputed: "Bestätigung abgelehnt.",
    declaredByYou: "Von dir gemeldet",
    declaredByOther: "Vom Gegenüber gemeldet",
    band: {
      undisclosed: "Volumen nicht angegeben",
      lt_50k: "bis 50.000 €",
      "50k_250k": "50.000 – 250.000 €",
      "250k_1m": "250.000 – 1.000.000 €",
      "1m_5m": "1.000.000 – 5.000.000 €",
      gt_5m: "über 5.000.000 €",
    },
    bandLabel: "Größenordnung",
    closedOn: "Abgeschlossen am",
  },

  notify: {
    confirmTitle: "{name} hat einen Deal gemeldet.",
    confirmBody: "Bestätige den Abschluss, damit er für beide Seiten als verifizierter Deal zählt.",
  },
};

export type AppDealsDict = typeof appDealsDe;

export const appDealsEn: AppDealsDict = {
  /* ------------------------------------------------------ investment pool */
  pool: {
    kicker: "INNER CIRCLE Investment Pool",
    title: "How the planned investment pool works",
    lead:
      "Part of the revenue INNER CIRCLE earns within the network is earmarked for its own investments in the long run. This model is a planned structure – there are no invested funds yet.",
    plannedBadge: "Planned model",
    modelTitle: "From the network to our own portfolio",
    stepNetwork: "Network",
    stepNetworkText: "Members find each other what previously did not find each other.",
    stepDeals: "Deals",
    stepDealsText: "Concrete business opportunities emerge from these connections.",
    stepRevenue: "Revenue",
    stepRevenueText: "Platform revenue from membership and marketplace.",
    stepPool: "Investment pool",
    stepPoolText: "A defined share is reserved for our own investments.",
    stepPortfolio: "Portfolio & projects",
    stepPortfolioText: "Capital, contacts and operational support for selected projects.",
    categoriesTitle: "Planned allocation",
    categoriesLead:
      "The categories below describe where an investment pool could flow in the long run. They are a structure, not a list of holdings.",
    categories: {
      startups: "Start-ups",
      stakes: "Equity stakes",
      realEstate: "Real-estate projects",
      community: "Community companies",
      strategic: "Strategic investments",
      reserve: "Reserve / future opportunities",
    },
    categoriesNote:
      "The shares are indicative figures of a planned structure and only become meaningful with real investments.",
    emptyTitle: "No invested funds yet",
    emptyText:
      "As soon as INNER CIRCLE has made its own investments, the actual positions will gradually become visible here – with number, status and date.",
    disclaimer:
      "Not a fund, no participation, no claim to distributions. No returns are promised and no investments are guaranteed.",
    noFakeNotice:
      "This area shows the planned structure only. Without real investments, deliberately no amount is displayed.",
  },

  /* ------------------------------------------------------------- deal fee */
  fee: {
    title: "Platform share on the deal",
    kicker: "Transparent fee structure",
    lead:
      "The bigger the deal, the lower the percentage platform share. The rate follows the volume of the closed deal.",
    tableTitle: "Scale",
    volumeColumn: "Deal volume",
    rateColumn: "Platform share",
    tier1: "up to €50,000",
    tier2: "€50,000 – €250,000",
    tier3: "€250,000 – €1,000,000",
    tier4: "€1,000,000 – €5,000,000",
    tierNegotiable: "over €5,000,000",
    negotiableRate: "Individual rate (1 – 1.5%)",
    negotiableNote:
      "From this volume onwards the rate is agreed case by case. No fixed percentage and no fixed amount is calculated.",
    whatItCovers: "What the platform share stands for",
    benefitNetwork: "Access to the network",
    benefitInfrastructure: "Deal infrastructure and origination",
    benefitMatching: "Matching of the parties involved",
    benefitReputation: "Reputation and documented collaboration",
    benefitVerification: "Verification of the members",
    benefitCommunication: "Communication and coordination",
    benefitDocumentation: "Documented collaboration",
    benefitSupport: "Support in closing the deal",
    forYourVolume: "For the volume you entered",
    forYourVolumeEmpty: "Enter a volume above to see the rate.",
    termsVersionLabel: "Version of the deal terms",
    notIncludedNote:
      "The platform share becomes due with the closed deal, not with the publication of a listing.",
  },

  /* ------------------------------------------------------------ deal terms */
  terms: {
    title: "Deal terms",
    lead: "Briefly and plainly, what applies when you publish.",
    checkbox:
      "I have read and accept the deal terms and the platform fee that applies to my deal.",
    detailsLink: "Details / terms",
    feeSummary: "Platform share according to the scale",
    reportSummary: "Report the deal after closing",
    offplatformSummary: "Do not route the contact around the platform",
    offplatformText:
      "When the deal terms are accepted, a deal that originated on INNER CIRCLE is reported after closing and is not completed without the agreed fee.",
    required: "Please accept the deal terms in order to publish.",
    legalNote:
      "This technical confirmation documents the version that was displayed. The final legal wording is still under legal review.",
    appliesTo: "Applies to this listing type",
    doesNotApply: "No platform fee applies to this listing type.",
  },

  /* ------------------------------------------------------------- declaring */
  declare: {
    title: "Deal completed",
    lead:
      "Many deals close outside the platform. Report here what originated on INNER CIRCLE – it counts for your reputation and makes the collaboration traceable.",
    cta: "Report a deal",
    counterpartyLabel: "Counterparty",
    counterpartyHint: "Choose a member with whom you already have a confirmed collaboration.",
    counterpartyEmpty: "You currently have no member with a confirmed collaboration.",
    categoryLabel: "Deal type",
    category: {
      co_founder: "Co-founding",
      strategic_partnership: "Strategic partnership",
      joint_venture: "Joint venture",
      freelance: "Project collaboration",
      customers: "Customer win",
      other: "Other deal",
    },
    volumeLabel: "Deal volume (optional)",
    volumeHint:
      "Stored only as a rough order of magnitude and never shown publicly. Without it the deal still counts.",
    closedLabel: "Closed",
    closedToday: "Today",
    closedDays: "{days} days ago",
    privateNoteLabel: "Internal note (optional)",
    privateNoteHint: "Visible only to you. It is not passed on to the counterparty.",
    sourceLabel: "Original opportunity (optional)",
    sourceHint: "Links the deal to the opportunity it originated from.",
    submit: "Report deal",
    declared: "Deal reported. It counts once the other side confirms.",
    privacyNote:
      "Economic details, the counterparty and notes stay private. Later only an aggregated number of confirmed deals is publicly visible.",
  },

  /* ----------------------------------------------------------------- list */
  list: {
    title: "Your deals",
    lead: "Business opportunities that originated on INNER CIRCLE and led to a closing.",
    emptyTitle: "No reported deals yet",
    emptyText: "As soon as you close a deal that originated through the network, you can report it here.",
    status: {
      pending_confirmation: "Awaiting confirmation",
      confirmed: "Confirmed",
      disputed: "Not confirmed",
    },
    statusPendingText: "The other side has not confirmed yet. The deal counts only after mutual confirmation.",
    statusConfirmedText: "Confirmed by both sides – the deal counts towards your reputation.",
    statusDisputedText: "The other side did not confirm. The deal is not counted.",
    confirmCta: "Confirm",
    confirmedByMe: "Confirmed by you",
    confirmedByOther: "Confirmed by the counterparty",
    waitingForOther: "Awaiting the counterparty",
    disputeCta: "Do not confirm",
    disputeNote: "You can decline at any time. The deal is then not counted – with no consequence for you.",
    confirmed: "Deal confirmed.",
    confirmationRecorded: "Your confirmation was saved.",
    disputed: "Confirmation declined.",
    declaredByYou: "Reported by you",
    declaredByOther: "Reported by the counterparty",
    band: {
      undisclosed: "Volume not stated",
      lt_50k: "up to €50,000",
      "50k_250k": "€50,000 – €250,000",
      "250k_1m": "€250,000 – €1,000,000",
      "1m_5m": "€1,000,000 – €5,000,000",
      gt_5m: "over €5,000,000",
    },
    bandLabel: "Order of magnitude",
    closedOn: "Closed on",
  },

  notify: {
    confirmTitle: "{name} reported a deal.",
    confirmBody: "Confirm the closing so it counts as a verified deal for both sides.",
  },
};
