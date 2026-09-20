/**
 * Base taxonomy shared by the development seed (scripts/seed.ts) and the
 * Cloudflare D1 bootstrap (scripts/d1-bootstrap.ts).
 *
 * These records are NOT demo data: interests and goals drive onboarding, the
 * badges are granted by administration. Keep both scripts in sync by editing
 * this file only.
 */

/** [slug, labelDe, labelEn, groupDe, groupEn] */
export const INTERESTS: [string, string, string, string, string][] = [
  ["entrepreneurship", "Unternehmertum", "Entrepreneurship", "Business", "Business"],
  ["startups", "Startups", "Startups", "Business", "Business"],
  ["real-estate", "Immobilien", "Real Estate", "Finance", "Finance"],
  ["investing", "Investieren", "Investing", "Finance", "Finance"],
  ["venture-capital", "Venture Capital", "Venture Capital", "Finance", "Finance"],
  ["private-equity", "Private Equity", "Private Equity", "Finance", "Finance"],
  ["marketing", "Marketing", "Marketing", "Growth", "Growth"],
  ["sales", "Vertrieb", "Sales", "Growth", "Growth"],
  ["ecommerce", "E-Commerce", "E-Commerce", "Growth", "Growth"],
  ["technology", "Technologie", "Technology", "Technology", "Technology"],
  ["ai", "KI & Automatisierung", "AI & Automation", "Technology", "Technology"],
  ["finance", "Finance", "Finance", "Finance", "Finance"],
  ["consulting", "Consulting", "Consulting", "Professional", "Professional"],
  ["content-creation", "Content Creation", "Content Creation", "Creative", "Creative"],
  ["personal-branding", "Personal Branding", "Personal Branding", "Creative", "Creative"],
  ["freelancing", "Freelancing", "Freelancing", "Professional", "Professional"],
  ["ma", "M&A", "M&A", "Finance", "Finance"],
  ["business-development", "Business Development", "Business Development", "Business", "Business"],
  ["hospitality", "Hospitality", "Hospitality", "Lifestyle", "Lifestyle"],
  ["automotive", "Automotive", "Automotive", "Lifestyle", "Lifestyle"],
  ["sports", "Sport", "Sports", "Lifestyle", "Lifestyle"],
  ["fashion", "Fashion", "Fashion", "Lifestyle", "Lifestyle"],
  ["other", "Sonstiges", "Other", "Other", "Other"],
];

/** [slug, labelDe, labelEn] */
export const GOALS: [string, string, string][] = [
  ["find-partners", "Geschäftspartner finden", "Find business partners"],
  ["find-cofounders", "Co-Founder finden", "Find co-founders"],
  ["find-customers", "Kunden finden", "Find customers"],
  ["invest", "Investieren", "Invest"],
  ["raise-capital", "Kapital aufnehmen", "Raise capital"],
  ["learn", "Lernen", "Learn"],
  ["sell-services", "Dienstleistungen verkaufen", "Sell services"],
  ["sell-courses", "Kurse verkaufen", "Sell courses"],
  ["build-network", "Netzwerk aufbauen", "Build a network"],
  ["attend-events", "Events besuchen", "Attend events"],
  ["discover-projects", "Projekte & Jobs entdecken", "Discover jobs & projects"],
];

/** [slug, kind, titleDe, titleEn, iconKey] */
export const BADGES: [string, string, string, string, string][] = [
  ["founding-member", "founding", "Founding Member", "Founding Member", "award"],
  ["verified-activity", "verified", "Verifizierte Aktivität", "Verified activity", "shield"],
  ["partner", "partner", "Partner", "Partner", "handshake"],
];
